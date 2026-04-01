"""
Playwright-based scraper for Quranic Universal Library (qul.tarteel.ai).

QUL no longer exposes a public REST API — all resources are downloaded via
the web UI.  Download buttons render as href="#_" until JavaScript resolves
the real file URL, so a headless browser is required.

Credentials (QUL_EMAIL / QUL_PASSWORD env vars) are used to log in when
provided; some resources or the admin panel require an authenticated session.

Outputs: same paths as sync_qul.py so the two scripts are interchangeable.

Usage:
    python3 scripts/scrape_qul.py                      # all resources
    python3 scripts/scrape_qul.py --resources translations,tafsirs
    python3 scripts/scrape_qul.py --headless false     # show browser (debug)
"""
from __future__ import annotations

import argparse
import asyncio
import json
import os
import sys
import tempfile
from pathlib import Path
from typing import Any

sys.path.insert(0, str(Path(__file__).parent))
from utils import write_json, safe_path  # noqa: E402

QUL_BASE = "https://qul.tarteel.ai"

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _slug_to_name(slug: str) -> str:
    """Map a QUL quran-script slug to a local filename stem."""
    MAP = {
        "quran-uthmani-hafs": "uthmani",
        "quran-simple": "simple",
        "quran-indopak": "indopak",
        "quran-uthmani-tajweed": "tajweed",
        "quran-qpc-hafs": "qpc-hafs",
    }
    return MAP.get(slug, slug.replace("quran-", ""))


async def _login(page: Any) -> bool:
    """Attempt to log in if credentials are present.  Returns True on success."""
    email = os.environ.get("QUL_EMAIL", "").strip()
    password = os.environ.get("QUL_PASSWORD", "").strip()
    if not email or not password:
        print("  ⓘ  No QUL credentials — proceeding without login.")
        return False

    print("  → Logging in …")
    # Try common login paths
    for login_path in ("/login", "/accounts/login", "/auth/login", "/signin"):
        try:
            await page.goto(f"{QUL_BASE}{login_path}", wait_until="domcontentloaded", timeout=20_000)
            # Look for an email/username input
            email_sel = 'input[type="email"], input[name="email"], input[name="username"]'
            if await page.locator(email_sel).count() > 0:
                await page.fill(email_sel, email)
                await page.fill('input[type="password"]', password)
                await page.keyboard.press("Enter")
                await page.wait_for_load_state("networkidle", timeout=15_000)
                # Simple success check: no longer on a login page
                if page.url != f"{QUL_BASE}{login_path}":
                    print("  ✓ Logged in.")
                    return True
        except Exception:
            continue

    print("  ⚠ Could not find login form — continuing unauthenticated.")
    return False


async def _intercept_download_url(page: Any, click_locator: Any, timeout: int = 20_000) -> str | None:
    """
    Click an element and capture either:
      1. A browser download event  → returns download.url
      2. A navigation to a file URL  → returns the URL directly
    Returns None on failure.
    """
    captured_url: list[str] = []

    async def _on_response(response: Any) -> None:
        ct = response.headers.get("content-type", "")
        if "json" in ct or "octet-stream" in ct or "application/zip" in ct:
            captured_url.append(response.url)

    page.on("response", _on_response)
    try:
        async with page.expect_download(timeout=timeout) as dl_info:
            await click_locator.click()
        dl = await dl_info.value
        page.remove_listener("response", _on_response)
        return dl.url
    except Exception:
        page.remove_listener("response", _on_response)
        # Fall back: did we capture a JSON response URL?
        return captured_url[-1] if captured_url else None


async def _fetch_url_with_cookies(page: Any, url: str) -> Any:
    """Use the browser's cookies to fetch a URL via JS fetch(), returning parsed JSON."""
    result = await page.evaluate(
        """async (url) => {
            const r = await fetch(url, {credentials: 'include'});
            if (!r.ok) return null;
            const text = await r.text();
            try { return JSON.parse(text); } catch { return text; }
        }""",
        url,
    )
    return result


# ---------------------------------------------------------------------------
# Resource scrapers
# ---------------------------------------------------------------------------

async def scrape_quran_scripts(page: Any) -> None:
    print("\n[quran-scripts] Quran text editions …")
    await page.goto(f"{QUL_BASE}/resources/quran-script/", wait_until="domcontentloaded")

    # Each script card should have a JSON download link/button
    cards = page.locator("a[href], button").filter(has_text="json")
    count = await cards.count()
    if count == 0:
        # Try generic download buttons
        cards = page.locator("[data-resource-type='quran-script'] a, .download-btn")
        count = await cards.count()

    print(f"  Found {count} download candidate(s).")

    for i in range(count):
        card = cards.nth(i)
        try:
            # Try to get slug from parent context
            slug = await card.evaluate(
                """el => {
                    const row = el.closest('[data-slug], [data-resource-slug], tr, .resource-card');
                    if (row) return row.dataset.slug || row.dataset.resourceSlug || '';
                    return '';
                }"""
            )
            url = await _intercept_download_url(page, card)
            if not url:
                continue
            data = await _fetch_url_with_cookies(page, url)
            if not data:
                continue
            # Normalise to { verse_key: text }
            if isinstance(data, list):
                out = {f"{v['chapter_id']}:{v['verse_number']}": v.get("text", "") for v in data}
            elif isinstance(data, dict) and "data" in data:
                out = data["data"]
            else:
                out = data
            name = _slug_to_name(slug) if slug else f"script-{i}"
            write_json(f"data/quran/{name}.json", out)
            print(f"  ✓ data/quran/{name}.json  ({len(out):,} verses)")
        except Exception as exc:
            print(f"  ⚠ script #{i}: {exc}")

        # Navigate back after each download
        await page.goto(f"{QUL_BASE}/resources/quran-script/", wait_until="domcontentloaded")


async def scrape_translations(page: Any) -> None:
    print("\n[translations] Verse translations …")
    await page.goto(f"{QUL_BASE}/resources/translation/", wait_until="domcontentloaded")

    # Collect all translation rows: id, name, language, author
    catalog_raw = await page.evaluate(
        """() => {
            const rows = [];
            document.querySelectorAll('tr[data-id], [data-resource-id]').forEach(row => {
                rows.push({
                    id: row.dataset.id || row.dataset.resourceId,
                    name: (row.querySelector('.name, td:nth-child(1)')?.textContent || '').trim(),
                    language: (row.querySelector('.language, [data-lang]')?.textContent || '').trim(),
                    author: (row.querySelector('.author, [data-author]')?.textContent || '').trim(),
                });
            });
            return rows;
        }"""
    )

    catalog = []
    download_links: list[dict] = []

    # Also capture network responses to translation JSON files
    captured: list[dict] = []

    async def _on_resp(resp: Any) -> None:
        url = resp.url
        if "/translations/" in url and url.endswith(".json"):
            try:
                data = await resp.json()
                captured.append({"url": url, "data": data})
            except Exception:
                pass

    page.on("response", _on_resp)

    # Find all JSON download buttons
    btns = page.locator("a, button").filter(has_text="json")
    count = await btns.count()
    print(f"  Found {count} JSON download button(s).")

    for i in range(count):
        btn = btns.nth(i)
        try:
            rid = await btn.evaluate(
                """el => {
                    const row = el.closest('tr, [data-id], .resource-row');
                    return row?.dataset?.id || row?.dataset?.resourceId || '';
                }"""
            )
            url = await _intercept_download_url(page, btn)
            if url:
                download_links.append({"id": rid, "url": url})
        except Exception as exc:
            print(f"  ⚠ translation btn #{i}: {exc}")
        await page.goto(f"{QUL_BASE}/resources/translation/", wait_until="domcontentloaded")

    page.remove_listener("response", _on_resp)

    # Build catalog from raw data or download links
    for entry in catalog_raw:
        catalog.append({
            "id": int(entry["id"]) if entry.get("id", "").isdigit() else entry.get("id"),
            "name": entry["name"],
            "language": entry["language"],
            "author": entry["author"],
            "direction": "rtl" if entry.get("language", "").lower() in {"arabic", "urdu", "persian"} else "ltr",
        })

    if catalog:
        write_json("data/translations/index.json", catalog)
        print(f"  ✓ data/translations/index.json  ({len(catalog)} entries)")

    # Fetch and save each translation file
    for link in download_links:
        tid = link["id"]
        url = link["url"]
        try:
            data = await _fetch_url_with_cookies(page, url)
            if not data:
                continue
            # Normalise to { verse_key: { text, footnotes? } }
            if isinstance(data, list):
                out: dict = {}
                for item in data:
                    key = item.get("verse_key") or f"{item.get('chapter_id')}:{item.get('verse_number')}"
                    out[key] = {"text": item.get("text", "")}
                    if item.get("footnotes"):
                        out[key]["footnotes"] = item["footnotes"]
            else:
                out = data
            write_json(f"data/translations/{tid}.json", out)
        except Exception as exc:
            print(f"  ⚠ translation {tid}: {exc}")

    print(f"  ✓ {len(download_links)} translation file(s) processed.")


async def scrape_tafsirs(page: Any) -> None:
    print("\n[tafsirs] Tafsirs …")
    await page.goto(f"{QUL_BASE}/resources/tafsir/", wait_until="domcontentloaded")

    catalog_raw = await page.evaluate(
        """() => {
            const rows = [];
            document.querySelectorAll('tr[data-id], [data-resource-id]').forEach(row => {
                rows.push({
                    id: row.dataset.id || row.dataset.resourceId,
                    name: (row.querySelector('.name, td:nth-child(1)')?.textContent || '').trim(),
                    language: (row.querySelector('.language, [data-lang]')?.textContent || '').trim(),
                    author: (row.querySelector('.author')?.textContent || '').trim(),
                });
            });
            return rows;
        }"""
    )

    catalog = [
        {
            "id": int(e["id"]) if str(e.get("id", "")).isdigit() else e.get("id"),
            "name": e["name"],
            "language": e["language"],
            "author": e["author"],
        }
        for e in catalog_raw
        if e.get("id")
    ]
    if catalog:
        write_json("data/tafsirs/index.json", catalog)
        print(f"  ✓ data/tafsirs/index.json  ({len(catalog)} entries)")

    # For each tafsir, navigate to its detail page and download by surah
    btns = page.locator("a, button").filter(has_text="json")
    count = await btns.count()
    print(f"  Found {count} JSON download button(s).")

    for i in range(count):
        btn = btns.nth(i)
        try:
            tid = await btn.evaluate(
                """el => {
                    const row = el.closest('tr, [data-id], .resource-row');
                    return row?.dataset?.id || row?.dataset?.resourceId || '';
                }"""
            )
            url = await _intercept_download_url(page, btn)
            if not url:
                continue
            data = await _fetch_url_with_cookies(page, url)
            if not data:
                continue
            # Data may be the whole tafsir or surah-grouped
            ayahs = data.get("tafsirs") or data.get("data") or (data if isinstance(data, list) else [])
            if ayahs:
                # Group by surah
                by_surah: dict[int, list] = {}
                for ayah in ayahs:
                    surah = ayah.get("chapter_id") or ayah.get("surah_number") or 1
                    by_surah.setdefault(surah, []).append(ayah)
                for surah, surah_ayahs in by_surah.items():
                    write_json(f"data/tafsirs/{tid}/{surah}.json", {"ayahs": surah_ayahs})
        except Exception as exc:
            print(f"  ⚠ tafsir btn #{i}: {exc}")
        await page.goto(f"{QUL_BASE}/resources/tafsir/", wait_until="domcontentloaded")

    print("  ✓ Tafsir files written under data/tafsirs/")


async def scrape_word_translations(page: Any) -> None:
    print("\n[word-translations] Word-by-word translations …")
    await page.goto(f"{QUL_BASE}/resources/word-translation/", wait_until="domcontentloaded")

    btns = page.locator("a, button").filter(has_text="json")
    count = await btns.count()
    print(f"  Found {count} JSON download button(s).")

    for i in range(count):
        btn = btns.nth(i)
        try:
            lang = await btn.evaluate(
                """el => {
                    const row = el.closest('tr, [data-id], .resource-row');
                    return row?.querySelector('.language,[data-lang]')?.textContent?.trim()
                        || row?.dataset?.language || '';
                }"""
            )
            url = await _intercept_download_url(page, btn)
            if not url:
                continue
            data = await _fetch_url_with_cookies(page, url)
            if not data:
                continue
            items = data if isinstance(data, list) else data.get("word_translations", data.get("results", []))
            out: dict = {}
            for item in items:
                loc = item.get("location") or item.get("word_key")
                if loc:
                    out[loc] = item.get("text", "")
            if out:
                name = lang.lower().replace(" ", "_") or f"wt-{i}"
                write_json(f"data/words/translations/{name}.json", out)
                print(f"  ✓ data/words/translations/{name}.json  ({len(out):,} words)")
        except Exception as exc:
            print(f"  ⚠ word-translation btn #{i}: {exc}")
        await page.goto(f"{QUL_BASE}/resources/word-translation/", wait_until="domcontentloaded")


async def scrape_recitations(page: Any) -> None:
    print("\n[recitations] Recitations + audio segments …")
    await page.goto(f"{QUL_BASE}/resources/recitation/", wait_until="domcontentloaded")

    catalog_raw = await page.evaluate(
        """() => {
            const rows = [];
            document.querySelectorAll('tr[data-id], [data-resource-id]').forEach(row => {
                rows.push({
                    id: row.dataset.id || row.dataset.resourceId,
                    name: (row.querySelector('.name, td:nth-child(1)')?.textContent || '').trim(),
                    reciter: (row.querySelector('.reciter, [data-reciter]')?.textContent || '').trim(),
                });
            });
            return rows;
        }"""
    )
    catalog = [
        {"id": e.get("id"), "name": e["name"], "reciter": e["reciter"]}
        for e in catalog_raw
        if e.get("id")
    ]
    if catalog:
        write_json("data/audio/recitations.json", catalog)
        print(f"  ✓ data/audio/recitations.json  ({len(catalog)} reciters)")

    # Download segment JSON files for segmented reciters
    btns = page.locator("a, button").filter(has_text="segment").or_(
        page.locator("a, button").filter(has_text="json")
    )
    count = await btns.count()
    print(f"  Found {count} segment/json download button(s).")

    for i in range(count):
        btn = btns.nth(i)
        try:
            rid = await btn.evaluate(
                """el => {
                    const row = el.closest('tr, [data-id], .resource-row');
                    return row?.dataset?.id || row?.dataset?.resourceId || '';
                }"""
            )
            url = await _intercept_download_url(page, btn)
            if not url:
                continue
            data = await _fetch_url_with_cookies(page, url)
            if not data:
                continue
            audio_files = data if isinstance(data, list) else data.get("audio_files", data.get("results", []))
            segments: dict = {}
            for af in audio_files:
                key = af.get("verse_key") or f"{af.get('chapter_id')}:{af.get('verse_number')}"
                if af.get("segments"):
                    segments[key] = af["segments"]
            if segments:
                write_json(f"data/audio/segments/{rid}.json", segments)
                print(f"  ✓ data/audio/segments/{rid}.json  ({len(segments):,} verses)")
        except Exception as exc:
            print(f"  ⚠ recitation btn #{i}: {exc}")
        await page.goto(f"{QUL_BASE}/resources/recitation/", wait_until="domcontentloaded")


async def scrape_mushaf(page: Any) -> None:
    print("\n[mushaf] Mushaf page layouts …")
    await page.goto(f"{QUL_BASE}/resources/mushaf/", wait_until="domcontentloaded")

    btns = page.locator("a, button").filter(has_text="json")
    count = await btns.count()
    if count == 0:
        print("  ⚠ No mushaf download buttons found.")
        return

    # Use the first JSON export (default Medina Mushaf)
    try:
        url = await _intercept_download_url(page, btns.first())
        if not url:
            return
        data = await _fetch_url_with_cookies(page, url)
        if not data:
            return
        pages_raw = data if isinstance(data, list) else data.get("mushaf_pages", data.get("data", []))
        pages: dict = {}
        for p in pages_raw:
            num = str(p.get("page_number") or p.get("number", ""))
            if num:
                pages[num] = {
                    "verse_mapping": p.get("verse_mapping"),
                    "lines_count": p.get("lines_count"),
                    "first_verse": p.get("first_verse_id"),
                    "last_verse": p.get("last_verse_id"),
                    "words_count": p.get("words_count"),
                }
        write_json("data/mushaf/pages.json", pages)
        print(f"  ✓ data/mushaf/pages.json  ({len(pages)} pages)")
    except Exception as exc:
        print(f"  ⚠ mushaf: {exc}")


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

SCRAPERS = {
    "quran-scripts": scrape_quran_scripts,
    "translations": scrape_translations,
    "tafsirs": scrape_tafsirs,
    "word-translations": scrape_word_translations,
    "recitations": scrape_recitations,
    "mushaf": scrape_mushaf,
}


async def main(resources: list[str], headless: bool) -> None:
    try:
        from playwright.async_api import async_playwright
    except ImportError:
        print("ERROR: playwright not installed.  Run: pip install playwright && playwright install chromium")
        sys.exit(1)

    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=headless)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (compatible; quran-api-sync/2.0)",
            accept_downloads=True,
        )
        page = await context.new_page()

        # Navigate to homepage first, then attempt login
        await page.goto(QUL_BASE, wait_until="domcontentloaded")
        await _login(page)

        for name in resources:
            scraper = SCRAPERS.get(name)
            if scraper is None:
                print(f"  ⚠ Unknown resource: {name!r}  (available: {', '.join(SCRAPERS)})")
                continue
            try:
                await scraper(page)
            except Exception as exc:
                print(f"  ✗ {name} failed: {exc}")

        await browser.close()

    print("\n✓ QUL scrape complete.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Playwright scraper for qul.tarteel.ai")
    parser.add_argument(
        "--resources",
        default="all",
        help=f"Comma-separated resources or 'all'. Available: {', '.join(SCRAPERS)}",
    )
    parser.add_argument(
        "--headless",
        default="true",
        choices=("true", "false"),
        help="Run browser headless (default: true)",
    )
    args = parser.parse_args()

    res_list = list(SCRAPERS) if args.resources == "all" else [r.strip() for r in args.resources.split(",")]
    asyncio.run(main(res_list, headless=args.headless.lower() == "true"))
