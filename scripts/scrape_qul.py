"""
Playwright-based scraper for Quranic Universal Library (qul.tarteel.ai).

QUL no longer exposes a public REST API — all resources are downloaded via
the web UI.  Download buttons render as href="#_" until JavaScript resolves
the real file URL, so a headless browser is required.

Credentials (QUL_EMAIL / QUL_PASSWORD env vars) are used to log in when
provided; some resources or the admin panel require an authenticated session.

Outputs: same paths as sync_qul.py so the two scripts are interchangeable.

Performance: each resource type gets its own browser context and runs
concurrently via asyncio.gather(); within each scraper, download URLs are
also resolved concurrently using a semaphore.

Usage:
    python3 scripts/scrape_qul.py                      # all resources
    python3 scripts/scrape_qul.py --resources translations,tafsirs
    python3 scripts/scrape_qul.py --headless false     # show browser (debug)
    python3 scripts/scrape_qul.py --contexts 6         # parallel contexts (default 4)
"""
from __future__ import annotations

import argparse
import asyncio
import json
import os
import random
import sys
import tempfile
import time
from pathlib import Path
from typing import Any

sys.path.insert(0, str(Path(__file__).parent))
from tqdm.asyncio import tqdm as atqdm  # noqa: E402
from utils import write_json  # noqa: E402

QUL_BASE = "https://qul.tarteel.ai"

# Number of browser contexts in the pool.
# Each context is ~150MB; 5 contexts = ~750MB, well within GitHub Actions 7GB.
NUM_CONTEXTS = 5

# Max concurrent tabs open across ALL contexts combined.
MAX_TABS = 80

# Filled by main() after login; shared across all contexts via storage_state.
_STORAGE_STATE: dict | None = None

# Context pool — tabs are round-robined across these for isolation + parallelism.
_CTX_POOL: list[Any] = []
_ctx_rr = 0  # round-robin counter (incremented atomically in single-threaded asyncio)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _slug_to_name(slug: str) -> str:
    MAP = {
        "quran-uthmani-hafs": "uthmani",
        "quran-simple": "simple",
        "quran-indopak": "indopak",
        "quran-uthmani-tajweed": "tajweed",
        "quran-qpc-hafs": "qpc-hafs",
    }
    return MAP.get(slug, slug.replace("quran-", ""))


async def _fill_login_form(page: Any, email: str, password: str) -> bool:
    """Fill and submit a login form if present on the current page. Returns True on success."""
    email_sel = 'input[type="email"], input[name="email"], input[name="username"]'
    try:
        await page.wait_for_selector(email_sel, timeout=5_000)
    except Exception:
        return False
    await page.fill(email_sel, email)
    await page.fill('input[type="password"]', password)
    await page.keyboard.press("Enter")
    try:
        await page.wait_for_load_state("networkidle", timeout=15_000)
    except Exception:
        pass
    # Success if we're no longer on a login/auth page
    return not any(p in page.url for p in ("/login", "/signin", "/auth"))


async def _login(page: Any) -> bool:
    """Attempt to log in if credentials are present.  Returns True on success."""
    email = os.environ.get("QUL_EMAIL", "").strip()
    password = os.environ.get("QUL_PASSWORD", "").strip()
    if not email or not password:
        print("  ⓘ  No QUL credentials — proceeding without login.")
        return False

    print("  → Logging in …")

    async def _login_and_return(label: str) -> bool:
        """Fill login form on current page; on success navigate back to QUL_BASE."""
        if await _fill_login_form(page, email, password):
            print(f"  ✓ Logged in via {label}.")
            await page.goto(QUL_BASE, wait_until="domcontentloaded", timeout=15_000)
            return True
        return False

    # 1. Try clicking CMS / Login button in the nav to reveal the form
    cms_sel = 'a[href*="cms"], a[href*="admin"], button:has-text("CMS"), a:has-text("CMS"), a:has-text("Login"), button:has-text("Login")'
    if await page.locator(cms_sel).count() > 0:
        try:
            await page.locator(cms_sel).first.click()
            await page.wait_for_load_state("domcontentloaded", timeout=10_000)
            if await _login_and_return("nav button"):
                return True
        except Exception:
            pass

    # 2. Try direct login paths
    for login_path in ("/login", "/accounts/login", "/auth/login", "/signin"):
        try:
            await page.goto(f"{QUL_BASE}{login_path}", wait_until="domcontentloaded", timeout=20_000)
            if await _login_and_return(login_path):
                return True
        except Exception:
            continue

    # 3. Try clicking a download button to trigger auth redirect
    try:
        await page.goto(f"{QUL_BASE}/resources/translation/", wait_until="domcontentloaded", timeout=20_000)
        first_dl = page.locator("a, button").filter(has_text="json").first
        if await first_dl.count() > 0:
            await first_dl.click()
            await page.wait_for_load_state("domcontentloaded", timeout=10_000)
            if await _login_and_return("download trigger"):
                return True
    except Exception:
        pass

    print("  ⚠ Could not find login form — continuing unauthenticated.")
    return False


async def _download_json(page: Any, click_locator: Any, timeout: int = 30_000) -> Any:
    """
    Click a download button, let Playwright intercept the browser download natively,
    save to a temp file on disk, and return parsed JSON.

    This avoids CORS/CSP entirely — the browser downloads the file using its own
    cookies and Playwright hands us the raw bytes, bypassing any JS fetch restrictions.
    Returns None on failure.
    """
    tmp_path: str | None = None
    try:
        async with page.expect_download(timeout=timeout) as dl_info:
            await click_locator.click()
        dl = await dl_info.value

        with tempfile.NamedTemporaryFile(suffix=".json", delete=False) as tmp:
            tmp_path = tmp.name
        await dl.save_as(tmp_path)

        with open(tmp_path, encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return None
    finally:
        if tmp_path:
            Path(tmp_path).unlink(missing_ok=True)


async def _download_sqlite(page: Any, click_locator: Any, timeout: int = 60_000) -> list[dict] | None:
    """
    Click a SQLite download button, save to a temp file, read with sqlite3,
    and return the largest table as a list of row dicts.
    Returns None on failure.
    """
    import sqlite3

    tmp_path: str | None = None
    con = None
    try:
        async with page.expect_download(timeout=timeout) as dl_info:
            await click_locator.click()
        dl = await dl_info.value

        with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as tmp:
            tmp_path = tmp.name
        await dl.save_as(tmp_path)

        con = sqlite3.connect(tmp_path)
        con.row_factory = sqlite3.Row
        tables = [
            r[0]
            for r in con.execute(
                "SELECT name FROM sqlite_master WHERE type='table'"
            ).fetchall()
        ]
        if not tables:
            return None
        # Use the table with the most rows as the primary data source
        best = max(
            tables,
            key=lambda t: con.execute(f"SELECT COUNT(*) FROM \"{t}\"").fetchone()[0],
        )
        rows = [dict(r) for r in con.execute(f"SELECT * FROM \"{best}\"").fetchall()]
        return rows or None
    except Exception:
        return None
    finally:
        if con:
            con.close()
        if tmp_path:
            Path(tmp_path).unlink(missing_ok=True)


async def _find_dl_btn_nth(page: Any, i: int) -> tuple[Any, str]:
    """
    Return the i-th download button and its format string ("json" or "sqlite").
    Prefers JSON; falls back to SQLite when the i-th JSON button doesn't exist.
    """
    json_loc = page.locator("a, button").filter(has_text="json")
    if await json_loc.count() > i:
        return json_loc.nth(i), "json"

    sqlite_loc = page.locator("a, button").filter(has_text="sqlite").or_(
        page.locator("a, button").filter(has_text=".db")
    )
    if await sqlite_loc.count() > i:
        return sqlite_loc.nth(i), "sqlite"

    # Fall back to json locator (will produce None on download attempt)
    return json_loc.nth(i), "json"


async def _download_file(page: Any, btn: Any, fmt: str) -> Any:
    """Dispatch to the correct downloader based on format."""
    if fmt == "sqlite":
        return await _download_sqlite(page, btn)
    return await _download_json(page, btn)


def _btn_count(json_count: int, sqlite_count: int) -> int:
    """Return the total number of downloadable resources (JSON preferred, SQLite fallback)."""
    return max(json_count, sqlite_count)


async def _goto(page: Any, url: str, retries: int = 3, timeout: int = 60_000) -> None:
    """Navigate with jitter + exponential-backoff retry on timeout."""
    # Small random delay spreads concurrent tab requests to avoid rate-limiting
    await asyncio.sleep(random.uniform(0, 1.5))
    for attempt in range(retries):
        try:
            await page.goto(url, wait_until="domcontentloaded", timeout=timeout)
            return
        except Exception as exc:
            if attempt == retries - 1:
                raise
            # Jitter on top of backoff to avoid thundering herd on retry
            wait = 2 ** attempt + random.uniform(0, 1)
            print(f"  ↻ retry {attempt + 1}/{retries} for {url} ({exc.__class__.__name__}) — waiting {wait:.1f}s")
            await asyncio.sleep(wait)


async def _new_page(browser: Any, sem: asyncio.Semaphore) -> tuple[Any, Any]:
    """Acquire semaphore slot and open a tab in the next context (round-robin)."""
    global _ctx_rr
    await sem.acquire()
    ctx = _CTX_POOL[_ctx_rr % len(_CTX_POOL)]
    _ctx_rr += 1
    page = await ctx.new_page()
    return page, page  # ctx=page so _close_ctx just closes the tab


async def _close_ctx(ctx: Any, sem: asyncio.Semaphore) -> None:
    await ctx.close()
    sem.release()


# ---------------------------------------------------------------------------
# Per-resource scrapers  (each receives a fresh browser + semaphore)
# ---------------------------------------------------------------------------

async def scrape_quran_scripts(browser: Any, sem: asyncio.Semaphore) -> None:
    print("\n[quran-scripts] Quran text editions …")
    ctx, page = await _new_page(browser, sem)
    count = 0
    try:
        await _goto(page, f"{QUL_BASE}/resources/quran-script/")
        count = _btn_count(
            await page.locator("a, button").filter(has_text="json").count(),
            await page.locator("a, button").filter(has_text="sqlite").or_(
                page.locator("a, button").filter(has_text=".db")
            ).count(),
        )
        print(f"  [quran-scripts] Found {count} download button(s).")
    finally:
        await _close_ctx(ctx, sem)

    async def _dl_one(i: int) -> None:
        sub_ctx, sub_page = await _new_page(browser, sem)
        try:
            await _goto(sub_page, f"{QUL_BASE}/resources/quran-script/")
            btn, fmt = await _find_dl_btn_nth(sub_page, i)
            slug = await btn.evaluate(
                """el => {
                    const row = el.closest('[data-slug],[data-resource-slug],tr,.resource-card');
                    return row?.dataset?.slug || row?.dataset?.resourceSlug || '';
                }"""
            )
            data = await _download_file(sub_page, btn, fmt)
            if not data:
                return
            out = (
                {f"{v['chapter_id']}:{v['verse_number']}": v.get("text", "") for v in data}
                if isinstance(data, list)
                else data.get("data", data)
            )
            name = _slug_to_name(slug) if slug else f"script-{i}"
            write_json(f"data/quran/{name}.json", out)
            print(f"  ✓ data/quran/{name}.json  ({len(out):,} verses)")
        except Exception as exc:
            print(f"  ⚠ script #{i}: {exc}")
        finally:
            await _close_ctx(sub_ctx, sem)

    await atqdm.gather(*[_dl_one(i) for i in range(count)], desc="  [quran-scripts]")


async def scrape_translations(browser: Any, sem: asyncio.Semaphore) -> None:
    print("\n[translations] Verse translations …")
    ctx, page = await _new_page(browser, sem)
    try:
        await _goto(page, f"{QUL_BASE}/resources/translation/")

        catalog_raw = await page.evaluate(
            """() => Array.from(document.querySelectorAll('tr[data-id],[data-resource-id]')).map(r => ({
                id: r.dataset.id || r.dataset.resourceId || '',
                name: (r.querySelector('.name,td:nth-child(1)')?.textContent || '').trim(),
                language: (r.querySelector('.language,[data-lang]')?.textContent || '').trim(),
                author: (r.querySelector('.author,[data-author]')?.textContent || '').trim(),
            }))"""
        )
        catalog = [
            {
                "id": int(e["id"]) if str(e.get("id", "")).isdigit() else e.get("id"),
                "name": e["name"],
                "language": e["language"],
                "author": e["author"],
                "direction": "rtl" if e.get("language", "").lower() in {"arabic", "urdu", "persian"} else "ltr",
            }
            for e in catalog_raw if e.get("id")
        ]
        if catalog:
            write_json("data/translations/index.json", catalog)
            print(f"  ✓ data/translations/index.json  ({len(catalog)} entries)")

        btns_count = _btn_count(
            await page.locator("a, button").filter(has_text="json").count(),
            await page.locator("a, button").filter(has_text="sqlite").or_(
                page.locator("a, button").filter(has_text=".db")
            ).count(),
        )
        print(f"  [translations] Found {btns_count} download button(s).")
    finally:
        await _close_ctx(ctx, sem)

    async def _dl_one(i: int) -> None:
        sub_ctx, sub_page = await _new_page(browser, sem)
        try:
            await _goto(sub_page, f"{QUL_BASE}/resources/translation/")
            btn, fmt = await _find_dl_btn_nth(sub_page, i)
            tid = await btn.evaluate(
                """el => {
                    const row = el.closest('tr,[data-id],.resource-row');
                    return row?.dataset?.id || row?.dataset?.resourceId || '';
                }"""
            )
            data = await _download_file(sub_page, btn, fmt)
            if not data:
                return
            items = data if isinstance(data, list) else data.get("translations", data.get("results", []))
            out: dict = {}
            for item in items:
                key = item.get("verse_key") or f"{item.get('chapter_id')}:{item.get('verse_number')}"
                out[key] = {"text": item.get("text", "")}
                if item.get("footnotes"):
                    out[key]["footnotes"] = item["footnotes"]
            if out:
                write_json(f"data/translations/{tid}.json", out)
        except Exception as exc:
            print(f"  ⚠ translation btn #{i}: {exc}")
        finally:
            await _close_ctx(sub_ctx, sem)

    await atqdm.gather(*[_dl_one(i) for i in range(btns_count)], desc="  [translations]")
    print(f"  ✓ {btns_count} translation file(s) processed.")


async def scrape_tafsirs(browser: Any, sem: asyncio.Semaphore) -> None:
    print("\n[tafsirs] Tafsirs …")
    ctx, page = await _new_page(browser, sem)
    try:
        await _goto(page, f"{QUL_BASE}/resources/tafsir/")
        catalog_raw = await page.evaluate(
            """() => Array.from(document.querySelectorAll('tr[data-id],[data-resource-id]')).map(r => ({
                id: r.dataset.id || r.dataset.resourceId || '',
                name: (r.querySelector('.name,td:nth-child(1)')?.textContent || '').trim(),
                language: (r.querySelector('.language,[data-lang]')?.textContent || '').trim(),
                author: (r.querySelector('.author')?.textContent || '').trim(),
            }))"""
        )
        catalog = [
            {
                "id": int(e["id"]) if str(e.get("id", "")).isdigit() else e.get("id"),
                "name": e["name"],
                "language": e["language"],
                "author": e["author"],
            }
            for e in catalog_raw if e.get("id")
        ]
        if catalog:
            write_json("data/tafsirs/index.json", catalog)
            print(f"  ✓ data/tafsirs/index.json  ({len(catalog)} entries)")

        btns_count = _btn_count(
            await page.locator("a, button").filter(has_text="json").count(),
            await page.locator("a, button").filter(has_text="sqlite").or_(
                page.locator("a, button").filter(has_text=".db")
            ).count(),
        )
        print(f"  [tafsirs] Found {btns_count} download button(s).")
    finally:
        await _close_ctx(ctx, sem)

    async def _dl_one(i: int) -> None:
        sub_ctx, sub_page = await _new_page(browser, sem)
        try:
            await _goto(sub_page, f"{QUL_BASE}/resources/tafsir/")
            btn, fmt = await _find_dl_btn_nth(sub_page, i)
            tid = await btn.evaluate(
                """el => {
                    const row = el.closest('tr,[data-id],.resource-row');
                    return row?.dataset?.id || row?.dataset?.resourceId || '';
                }"""
            )
            data = await _download_file(sub_page, btn, fmt)
            if not data:
                return
            ayahs = data.get("tafsirs") or data.get("data") or (data if isinstance(data, list) else [])
            by_surah: dict[int, list] = {}
            for ayah in ayahs:
                surah = ayah.get("chapter_id") or ayah.get("surah_number") or 1
                by_surah.setdefault(surah, []).append(ayah)
            for surah, surah_ayahs in by_surah.items():
                write_json(f"data/tafsirs/{tid}/{surah}.json", {"ayahs": surah_ayahs})
            if by_surah:
                print(f"  ✓ tafsir {tid}: {len(by_surah)} surah file(s)")
        except Exception as exc:
            print(f"  ⚠ tafsir btn #{i}: {exc}")
        finally:
            await _close_ctx(sub_ctx, sem)

    await atqdm.gather(*[_dl_one(i) for i in range(btns_count)], desc="  [tafsirs]")
    print("  ✓ Tafsir files written under data/tafsirs/")


async def scrape_word_translations(browser: Any, sem: asyncio.Semaphore) -> None:
    print("\n[word-translations] Word-by-word translations …")
    ctx, page = await _new_page(browser, sem)
    btns_count = 0
    try:
        await _goto(page, f"{QUL_BASE}/resources/word-translation/")
        btns_count = _btn_count(
            await page.locator("a, button").filter(has_text="json").count(),
            await page.locator("a, button").filter(has_text="sqlite").or_(
                page.locator("a, button").filter(has_text=".db")
            ).count(),
        )
        print(f"  [word-translations] Found {btns_count} download button(s).")
    finally:
        await _close_ctx(ctx, sem)

    async def _dl_one(i: int) -> None:
        sub_ctx, sub_page = await _new_page(browser, sem)
        try:
            await _goto(sub_page, f"{QUL_BASE}/resources/word-translation/")
            btn, fmt = await _find_dl_btn_nth(sub_page, i)
            lang = await btn.evaluate(
                """el => {
                    const row = el.closest('tr,[data-id],.resource-row');
                    return row?.querySelector('.language,[data-lang]')?.textContent?.trim()
                        || row?.dataset?.language || '';
                }"""
            )
            data = await _download_file(sub_page, btn, fmt)
            if not data:
                return
            items = data if isinstance(data, list) else data.get("word_translations", data.get("results", []))
            out: dict = {
                (item.get("location") or item.get("word_key")): item.get("text", "")
                for item in items
                if item.get("location") or item.get("word_key")
            }
            if out:
                name = lang.lower().replace(" ", "_") or f"wt-{i}"
                write_json(f"data/words/translations/{name}.json", out)
                print(f"  ✓ data/words/translations/{name}.json  ({len(out):,} words)")
        except Exception as exc:
            print(f"  ⚠ word-translation btn #{i}: {exc}")
        finally:
            await _close_ctx(sub_ctx, sem)

    await atqdm.gather(*[_dl_one(i) for i in range(btns_count)], desc="  [word-translations]")


async def scrape_recitations(browser: Any, sem: asyncio.Semaphore) -> None:
    print("\n[recitations] Recitations + audio segments …")
    ctx, page = await _new_page(browser, sem)
    btns_count = 0
    try:
        await _goto(page, f"{QUL_BASE}/resources/recitation/")
        catalog_raw = await page.evaluate(
            """() => Array.from(document.querySelectorAll('tr[data-id],[data-resource-id]')).map(r => ({
                id: r.dataset.id || r.dataset.resourceId || '',
                name: (r.querySelector('.name,td:nth-child(1)')?.textContent || '').trim(),
                reciter: (r.querySelector('.reciter,[data-reciter]')?.textContent || '').trim(),
            }))"""
        )
        catalog = [{"id": e["id"], "name": e["name"], "reciter": e["reciter"]} for e in catalog_raw if e.get("id")]
        if catalog:
            write_json("data/audio/recitations.json", catalog)
            print(f"  ✓ data/audio/recitations.json  ({len(catalog)} reciters)")

        btns_count = _btn_count(
            await (
                page.locator("a, button").filter(has_text="segment").or_(
                    page.locator("a, button").filter(has_text="json")
                )
            ).count(),
            await page.locator("a, button").filter(has_text="sqlite").or_(
                page.locator("a, button").filter(has_text=".db")
            ).count(),
        )
        print(f"  [recitations] Found {btns_count} segment/json/sqlite download button(s).")
    finally:
        await _close_ctx(ctx, sem)

    async def _dl_one(i: int) -> None:
        sub_ctx, sub_page = await _new_page(browser, sem)
        try:
            await _goto(sub_page, f"{QUL_BASE}/resources/recitation/")
            _seg_json = sub_page.locator("a, button").filter(has_text="segment").or_(
                sub_page.locator("a, button").filter(has_text="json")
            )
            _sqlite = sub_page.locator("a, button").filter(has_text="sqlite").or_(
                sub_page.locator("a, button").filter(has_text=".db")
            )
            if await _seg_json.count() > i:
                btn, fmt = _seg_json.nth(i), "json"
            elif await _sqlite.count() > i:
                btn, fmt = _sqlite.nth(i), "sqlite"
            else:
                btn, fmt = _seg_json.nth(i), "json"
            rid = await btn.evaluate(
                """el => {
                    const row = el.closest('tr,[data-id],.resource-row');
                    return row?.dataset?.id || row?.dataset?.resourceId || '';
                }"""
            )
            data = await _download_file(sub_page, btn, fmt)
            if not data:
                return
            audio_files = data if isinstance(data, list) else data.get("audio_files", data.get("results", []))
            segments: dict = {
                (af.get("verse_key") or f"{af.get('chapter_id')}:{af.get('verse_number')}"): af["segments"]
                for af in audio_files
                if af.get("segments")
            }
            if segments:
                write_json(f"data/audio/segments/{rid}.json", segments)
                print(f"  ✓ data/audio/segments/{rid}.json  ({len(segments):,} verses)")
        except Exception as exc:
            print(f"  ⚠ recitation btn #{i}: {exc}")
        finally:
            await _close_ctx(sub_ctx, sem)

    await atqdm.gather(*[_dl_one(i) for i in range(btns_count)], desc="  [recitations]")


async def scrape_mushaf(browser: Any, sem: asyncio.Semaphore) -> None:
    print("\n[mushaf] Mushaf page layouts …")
    ctx, page = await _new_page(browser, sem)
    try:
        await _goto(page, f"{QUL_BASE}/resources/mushaf/")
        btn, fmt = await _find_dl_btn_nth(page, 0)
        data = await _download_file(page, btn, fmt)
        if not data:
            return
        pages_raw = data if isinstance(data, list) else data.get("mushaf_pages", data.get("data", []))
        pages: dict = {
            str(p.get("page_number") or p.get("number", "")): {
                "verse_mapping": p.get("verse_mapping"),
                "lines_count": p.get("lines_count"),
                "first_verse": p.get("first_verse_id"),
                "last_verse": p.get("last_verse_id"),
                "words_count": p.get("words_count"),
            }
            for p in pages_raw
            if p.get("page_number") or p.get("number")
        }
        write_json("data/mushaf/pages.json", pages)
        print(f"  ✓ data/mushaf/pages.json  ({len(pages)} pages)")
    except Exception as exc:
        print(f"  ⚠ mushaf: {exc}")
    finally:
        await _close_ctx(ctx, sem)


# ---------------------------------------------------------------------------
# Quran metadata  (verse-level: page, juz, hizb, ruku, manzil, sajdah)
# ---------------------------------------------------------------------------

async def scrape_quran_metadata(browser: Any, sem: asyncio.Semaphore) -> None:
    """Download verse metadata (page, juz, hizb, ruku, manzil, sajdah)."""
    print("\n[quran-metadata] Quran metadata …")
    ctx, page = await _new_page(browser, sem)
    btns_count = 0
    try:
        await _goto(page, f"{QUL_BASE}/resources/quran-metadata/")
        btns_count = _btn_count(
            await page.locator("a, button").filter(has_text="json").count(),
            await page.locator("a, button").filter(has_text="sqlite").or_(
                page.locator("a, button").filter(has_text=".db")
            ).count(),
        )
        print(f"  [quran-metadata] Found {btns_count} download button(s).")
    finally:
        await _close_ctx(ctx, sem)

    if not btns_count:
        return

    async def _dl_one(i: int) -> None:
        sub_ctx, sub_page = await _new_page(browser, sem)
        try:
            await _goto(sub_page, f"{QUL_BASE}/resources/quran-metadata/")
            btn, fmt = await _find_dl_btn_nth(sub_page, i)
            data = await _download_file(sub_page, btn, fmt)
            if not data:
                return
            items = data if isinstance(data, list) else data.get("verses", data.get("data", data.get("results", [])))
            if not isinstance(items, list) or not items:
                return
            first = items[0]
            if not any(k in first for k in ("page_number", "juz_number", "juz", "hizb_number")):
                return  # Not verse meta; skip this file
            meta: dict = {}
            for v in items:
                key = v.get("verse_key") or f"{v.get('chapter_id')}:{v.get('verse_number')}"
                if not key or ":" not in str(key):
                    continue
                meta[key] = {
                    "page": v.get("page_number") or v.get("page"),
                    "juz": v.get("juz_number") or v.get("juz"),
                    "hizb": v.get("hizb_number") or v.get("hizb"),
                    "rub_el_hizb": v.get("rub_el_hizb_number") or v.get("rub_el_hizb"),
                    "ruku": v.get("ruku_number") or v.get("ruku"),
                    "manzil": v.get("manzil_number") or v.get("manzil"),
                    "words_count": v.get("words_count"),
                    "sajdah": v.get("sajdah_type") if (v.get("sajdah_number") or v.get("sajdah")) else None,
                }
            if meta:
                write_json("data/verses/meta.json", meta)
                print(f"  ✓ data/verses/meta.json  ({len(meta):,} verses)")
        except Exception as exc:
            print(f"  ⚠ quran-metadata btn #{i}: {exc}")
        finally:
            await _close_ctx(sub_ctx, sem)

    await atqdm.gather(*[_dl_one(i) for i in range(btns_count)], desc="  [quran-metadata]")


# ---------------------------------------------------------------------------
# Words (Arabic text, codes, position, page, line)
# ---------------------------------------------------------------------------

async def scrape_words(browser: Any, sem: asyncio.Semaphore) -> None:
    """Word-level Arabic data: text, codes, position, page, line."""
    print("\n[words] Words (Arabic) …")
    ctx, page = await _new_page(browser, sem)
    try:
        await _goto(page, f"{QUL_BASE}/resources/word/")
        btn, fmt = await _find_dl_btn_nth(page, 0)
        avail = _btn_count(
            await page.locator("a, button").filter(has_text="json").count(),
            await page.locator("a, button").filter(has_text="sqlite").or_(
                page.locator("a, button").filter(has_text=".db")
            ).count(),
        )
        if not avail:
            print("  ⚠ [words] No download buttons found.")
            return
        data = await _download_file(page, btn, fmt)
        if not data:
            return
        items = data if isinstance(data, list) else data.get("words", data.get("data", data.get("results", [])))
        words: dict = {}
        for w in items:
            loc = w.get("location") or w.get("word_key")
            if not loc:
                continue
            words[loc] = {
                "text": w.get("text_uthmani") or w.get("text", ""),
                "text_indopak": w.get("text_indopak"),
                "code_v1": w.get("code_v1"),
                "code_v2": w.get("code_v2"),
                "position": w.get("position"),
                "page": w.get("page_number") or w.get("page"),
                "line": w.get("line_number") or w.get("line"),
                "type": w.get("char_type_name") or w.get("type"),
            }
        if words:
            write_json("data/words/arabic.json", words)
            print(f"  ✓ data/words/arabic.json  ({len(words):,} words)")
    except Exception as exc:
        print(f"  ⚠ words: {exc}")
    finally:
        await _close_ctx(ctx, sem)


# ---------------------------------------------------------------------------
# Morphology / Grammar  +  Pause marks
# ---------------------------------------------------------------------------

async def scrape_morphology(browser: Any, sem: asyncio.Semaphore) -> None:
    """Grammar/morphology: POS, root, lemma, stem; also pause marks."""
    print("\n[morphology] Morphology/grammar …")
    ctx, page = await _new_page(browser, sem)
    btns_count = 0
    try:
        await _goto(page, f"{QUL_BASE}/resources/morphology/")
        btns_count = _btn_count(
            await page.locator("a, button").filter(has_text="json").count(),
            await page.locator("a, button").filter(has_text="sqlite").or_(
                page.locator("a, button").filter(has_text=".db")
            ).count(),
        )
        print(f"  [morphology] Found {btns_count} download button(s).")
    finally:
        await _close_ctx(ctx, sem)

    if not btns_count:
        return

    async def _dl_one(i: int) -> None:
        sub_ctx, sub_page = await _new_page(browser, sem)
        try:
            await _goto(sub_page, f"{QUL_BASE}/resources/morphology/")
            btn, fmt = await _find_dl_btn_nth(sub_page, i)
            data = await _download_file(sub_page, btn, fmt)
            if not data:
                return
            items = data if isinstance(data, list) else data.get("words", data.get("data", data.get("results", [])))
            if not isinstance(items, list) or not items:
                return
            first = items[0]
            if "mark" in first or "pause_mark" in first:
                marks: dict = {
                    (pm.get("word_key") or pm.get("location")): pm.get("mark") or pm.get("pause_mark", "")
                    for pm in items
                    if pm.get("word_key") or pm.get("location")
                }
                write_json("data/morphology/pause-marks.json", marks)
                print(f"  ✓ data/morphology/pause-marks.json  ({len(marks):,} marks)")
            elif any(k in first for k in ("pos", "root", "lemma", "stem")):
                out: dict = {}
                for item in items:
                    loc = item.get("location") or item.get("word_key")
                    if not loc:
                        continue
                    out[loc] = {
                        "pos": item.get("pos"),
                        "root": item.get("root"),
                        "lemma": item.get("lemma"),
                        "stem": item.get("stem"),
                    }
                write_json("data/morphology/qul.json", out)
                print(f"  ✓ data/morphology/qul.json  ({len(out):,} records)")
        except Exception as exc:
            print(f"  ⚠ morphology btn #{i}: {exc}")
        finally:
            await _close_ctx(sub_ctx, sem)

    await atqdm.gather(*[_dl_one(i) for i in range(btns_count)], desc="  [morphology]")


# ---------------------------------------------------------------------------
# Topics and concepts
# ---------------------------------------------------------------------------

async def scrape_topics(browser: Any, sem: asyncio.Semaphore) -> None:
    """Topics and concepts in the Quran."""
    print("\n[topics] Topics …")
    ctx, page = await _new_page(browser, sem)
    try:
        await _goto(page, f"{QUL_BASE}/resources/topic/")
        btn, fmt = await _find_dl_btn_nth(page, 0)
        avail = _btn_count(
            await page.locator("a, button").filter(has_text="json").count(),
            await page.locator("a, button").filter(has_text="sqlite").or_(
                page.locator("a, button").filter(has_text=".db")
            ).count(),
        )
        if not avail:
            print("  ⚠ [topics] No download buttons found.")
            return
        data = await _download_file(page, btn, fmt)
        if not data:
            return
        items = data if isinstance(data, list) else data.get("topics", data.get("data", data.get("results", [])))
        topics: dict = {
            (t.get("slug") or str(t.get("id", ""))): {
                "name": t.get("name"),
                "verse_keys": t.get("verse_keys", []),
            }
            for t in items
            if t.get("slug") or t.get("id")
        }
        write_json("data/topics/data.json", topics)
        print(f"  ✓ data/topics/data.json  ({len(topics):,} topics)")
    except Exception as exc:
        print(f"  ⚠ topics: {exc}")
    finally:
        await _close_ctx(ctx, sem)


# ---------------------------------------------------------------------------
# Mutashabihat (similar phrases)
# ---------------------------------------------------------------------------

async def scrape_mutashabihat(browser: Any, sem: asyncio.Semaphore) -> None:
    """Mutashabihat — similar/repeated phrases across the Quran."""
    print("\n[mutashabihat] Mutashabihat …")
    ctx, page = await _new_page(browser, sem)
    try:
        await _goto(page, f"{QUL_BASE}/resources/mutashabihat/")
        avail = _btn_count(
            await page.locator("a, button").filter(has_text="json").count(),
            await page.locator("a, button").filter(has_text="sqlite").or_(
                page.locator("a, button").filter(has_text=".db")
            ).count(),
        )
        if not avail:
            print("  ⚠ [mutashabihat] No download buttons found.")
            return
        btn, fmt = await _find_dl_btn_nth(page, 0)
        data = await _download_file(page, btn, fmt)
        if not data:
            return
        items = data if isinstance(data, list) else data.get("results", data.get("data", []))
        pairs = [
            {
                "verse_key": item.get("verse_key"),
                "matched_key": item.get("matched_verse_key") or item.get("matched_key"),
                "score": item.get("score"),
                "coverage": item.get("coverage"),
                "matched_word_positions": item.get("matched_word_positions"),
            }
            for item in items
        ]
        write_json("data/mutashabihat/data.json", pairs)
        print(f"  ✓ data/mutashabihat/data.json  ({len(pairs):,} pairs)")
    except Exception as exc:
        print(f"  ⚠ mutashabihat: {exc}")
    finally:
        await _close_ctx(ctx, sem)


# ---------------------------------------------------------------------------
# Transliteration
# ---------------------------------------------------------------------------

async def scrape_transliteration(browser: Any, sem: asyncio.Semaphore) -> None:
    """Transliteration data (Quranic text in Latin script)."""
    print("\n[transliteration] Transliterations …")
    ctx, page = await _new_page(browser, sem)
    btns_count = 0
    try:
        await _goto(page, f"{QUL_BASE}/resources/transliteration/")
        btns_count = _btn_count(
            await page.locator("a, button").filter(has_text="json").count(),
            await page.locator("a, button").filter(has_text="sqlite").or_(
                page.locator("a, button").filter(has_text=".db")
            ).count(),
        )
        print(f"  [transliteration] Found {btns_count} download button(s).")
    finally:
        await _close_ctx(ctx, sem)

    if not btns_count:
        return

    index: list = []

    async def _dl_one(i: int) -> None:
        sub_ctx, sub_page = await _new_page(browser, sem)
        try:
            await _goto(sub_page, f"{QUL_BASE}/resources/transliteration/")
            btn, fmt = await _find_dl_btn_nth(sub_page, i)
            meta_info = await btn.evaluate(
                """el => {
                    const row = el.closest('tr,[data-id],.resource-row,.resource-card');
                    return {
                        id: row?.dataset?.id || row?.dataset?.resourceId || '',
                        name: (row?.querySelector('.name,td:nth-child(1)')?.textContent || '').trim(),
                        lang: (row?.querySelector('.language,[data-lang]')?.textContent || row?.dataset?.language || '').trim(),
                        type: (row?.querySelector('[data-type],td:nth-child(2)')?.textContent || '').trim().toLowerCase(),
                    };
                }"""
            )
            data = await _download_file(sub_page, btn, fmt)
            if not data:
                return
            items = data if isinstance(data, list) else data.get("transliterations", data.get("data", data.get("results", [])))
            lang = (meta_info.get("lang") or meta_info.get("name") or f"tl-{i}").lower().replace(" ", "_")
            type_hint = meta_info.get("type", "")
            out: dict = {}
            for item in items:
                key = item.get("verse_key") or item.get("location") or item.get("word_key")
                if key:
                    out[key] = item.get("text", "")
            if out:
                is_wbw = "word" in type_hint or "wbw" in type_hint
                fname = f"wbw_{lang}" if is_wbw else lang
                write_json(f"data/transliteration/{fname}.json", out)
                index.append({
                    "lang": lang,
                    "id": meta_info.get("id"),
                    "name": meta_info.get("name"),
                    "type": "word" if is_wbw else "ayah",
                })
                print(f"  ✓ data/transliteration/{fname}.json  ({len(out):,} entries)")
        except Exception as exc:
            print(f"  ⚠ transliteration btn #{i}: {exc}")
        finally:
            await _close_ctx(sub_ctx, sem)

    await atqdm.gather(*[_dl_one(i) for i in range(btns_count)], desc="  [transliteration]")
    if index:
        write_json("data/transliteration/index.json", index)
        print(f"  ✓ data/transliteration/index.json  ({len(index)} entries)")


# ---------------------------------------------------------------------------
# Surah information  (descriptions, themes, revelation context per language)
# ---------------------------------------------------------------------------

async def scrape_surah_info(browser: Any, sem: asyncio.Semaphore) -> None:
    """Surah/chapter information in multiple languages."""
    print("\n[surah-info] Surah information …")
    ctx, page = await _new_page(browser, sem)
    btns_count = 0
    try:
        await _goto(page, f"{QUL_BASE}/resources/chapter-info/")
        btns_count = _btn_count(
            await page.locator("a, button").filter(has_text="json").count(),
            await page.locator("a, button").filter(has_text="sqlite").or_(
                page.locator("a, button").filter(has_text=".db")
            ).count(),
        )
        print(f"  [surah-info] Found {btns_count} download button(s).")
    finally:
        await _close_ctx(ctx, sem)

    if not btns_count:
        return

    index: list = []

    async def _dl_one(i: int) -> None:
        sub_ctx, sub_page = await _new_page(browser, sem)
        try:
            await _goto(sub_page, f"{QUL_BASE}/resources/chapter-info/")
            btn, fmt = await _find_dl_btn_nth(sub_page, i)
            meta_info = await btn.evaluate(
                """el => {
                    const row = el.closest('tr,[data-id],.resource-row,.resource-card');
                    return {
                        lang: (row?.querySelector('.language,[data-lang]')?.textContent || row?.dataset?.language || '').trim(),
                        name: (row?.querySelector('.name,td:nth-child(1)')?.textContent || '').trim(),
                    };
                }"""
            )
            data = await _download_file(sub_page, btn, fmt)
            if not data:
                return
            items = data if isinstance(data, list) else data.get("chapter_infos", data.get("data", data.get("results", [])))
            lang = (meta_info.get("lang") or meta_info.get("name") or f"lang-{i}").lower().replace(" ", "_")
            out: dict = {}
            for item in items:
                surah_num = str(item.get("chapter_id") or item.get("surah_number") or item.get("id", ""))
                if not surah_num:
                    continue
                out[surah_num] = {
                    "name": item.get("name") or item.get("chapter_name"),
                    "short_intro": item.get("short_intro") or item.get("intro"),
                    "description": item.get("info") or item.get("description") or item.get("text"),
                    "language": lang,
                }
            if out:
                write_json(f"data/surah-info/{lang}.json", out)
                index.append({"lang": lang, "name": meta_info.get("name")})
                print(f"  ✓ data/surah-info/{lang}.json  ({len(out)} surahs)")
        except Exception as exc:
            print(f"  ⚠ surah-info btn #{i}: {exc}")
        finally:
            await _close_ctx(sub_ctx, sem)

    await atqdm.gather(*[_dl_one(i) for i in range(btns_count)], desc="  [surah-info]")
    if index:
        write_json("data/surah-info/index.json", index)
        print(f"  ✓ data/surah-info/index.json  ({len(index)} languages)")


# ---------------------------------------------------------------------------
# Similar ayahs  (distinct from Mutashabihat)
# ---------------------------------------------------------------------------

async def scrape_similar_ayahs(browser: Any, sem: asyncio.Semaphore) -> None:
    """Similar ayahs — ayahs sharing meaning, context, or wording."""
    print("\n[similar-ayahs] Similar ayahs …")
    ctx, page = await _new_page(browser, sem)
    try:
        await _goto(page, f"{QUL_BASE}/resources/similar-ayah/")
        avail = _btn_count(
            await page.locator("a, button").filter(has_text="json").count(),
            await page.locator("a, button").filter(has_text="sqlite").or_(
                page.locator("a, button").filter(has_text=".db")
            ).count(),
        )
        if not avail:
            print("  ⚠ [similar-ayahs] No download buttons found.")
            return
        btn, fmt = await _find_dl_btn_nth(page, 0)
        data = await _download_file(page, btn, fmt)
        if not data:
            return
        items = data if isinstance(data, list) else data.get("similar_ayahs", data.get("results", data.get("data", [])))
        pairs = [
            {
                "verse_key": item.get("verse_key"),
                "similar_key": item.get("similar_verse_key") or item.get("similar_key"),
                "score": item.get("score"),
            }
            for item in items
        ]
        write_json("data/similar-ayahs/data.json", pairs)
        print(f"  ✓ data/similar-ayahs/data.json  ({len(pairs):,} pairs)")
    except Exception as exc:
        print(f"  ⚠ similar-ayahs: {exc}")
    finally:
        await _close_ctx(ctx, sem)


# ---------------------------------------------------------------------------
# Ayah themes
# ---------------------------------------------------------------------------

async def scrape_ayah_themes(browser: Any, sem: asyncio.Semaphore) -> None:
    """Core themes and topics of each ayah."""
    print("\n[ayah-themes] Ayah themes …")
    ctx, page = await _new_page(browser, sem)
    try:
        await _goto(page, f"{QUL_BASE}/resources/ayah-theme/")
        avail = _btn_count(
            await page.locator("a, button").filter(has_text="json").count(),
            await page.locator("a, button").filter(has_text="sqlite").or_(
                page.locator("a, button").filter(has_text=".db")
            ).count(),
        )
        if not avail:
            print("  ⚠ [ayah-themes] No download buttons found.")
            return
        btn, fmt = await _find_dl_btn_nth(page, 0)
        data = await _download_file(page, btn, fmt)
        if not data:
            return
        items = data if isinstance(data, list) else data.get("ayah_themes", data.get("results", data.get("data", [])))
        themes: dict = {}
        for item in items:
            key = item.get("verse_key") or item.get("ayah_key")
            if not key:
                continue
            theme = item.get("theme") or item.get("name")
            themes.setdefault(key, [])
            if theme and theme not in themes[key]:
                themes[key].append(theme)
        write_json("data/ayah-themes/data.json", themes)
        print(f"  ✓ data/ayah-themes/data.json  ({len(themes):,} ayahs with themes)")
    except Exception as exc:
        print(f"  ⚠ ayah-themes: {exc}")
    finally:
        await _close_ctx(ctx, sem)


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

SCRAPERS: dict[str, Any] = {
    "quran-scripts": scrape_quran_scripts,
    "quran-metadata": scrape_quran_metadata,
    "words": scrape_words,
    "morphology": scrape_morphology,
    "translations": scrape_translations,
    "tafsirs": scrape_tafsirs,
    "word-translations": scrape_word_translations,
    "recitations": scrape_recitations,
    "mushaf": scrape_mushaf,
    "topics": scrape_topics,
    "mutashabihat": scrape_mutashabihat,
    "transliteration": scrape_transliteration,
    "surah-info": scrape_surah_info,
    "similar-ayahs": scrape_similar_ayahs,
    "ayah-themes": scrape_ayah_themes,
}


async def main(resources: list[str], headless: bool, max_contexts: int) -> None:
    global _STORAGE_STATE, _CTX_POOL

    try:
        from playwright.async_api import async_playwright
    except ImportError:
        print("ERROR: playwright not installed.  Run: pip install playwright && playwright install chromium")
        sys.exit(1)

    t0 = time.time()
    print(f"Starting QUL scrape: {', '.join(resources)}  (headless={headless}, contexts={NUM_CONTEXTS}, tabs={MAX_TABS})")

    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=headless)

        # Login once in a temporary context, capture storage state
        login_ctx = await browser.new_context(
            user_agent="Mozilla/5.0 (compatible; quran-api-sync/2.0)",
            accept_downloads=True,
        )
        login_page = await login_ctx.new_page()
        await login_page.goto(QUL_BASE, wait_until="domcontentloaded")
        await _login(login_page)
        _STORAGE_STATE = await login_ctx.storage_state()
        await login_ctx.close()

        # Create context pool — tabs are distributed round-robin across them
        ctx_kwargs: dict = {
            "user_agent": "Mozilla/5.0 (compatible; quran-api-sync/2.0)",
            "accept_downloads": True,
            "storage_state": _STORAGE_STATE,
        }
        _CTX_POOL = [await browser.new_context(**ctx_kwargs) for _ in range(NUM_CONTEXTS)]
        print(f"  {NUM_CONTEXTS} contexts ready, {MAX_TABS} max concurrent tabs.")

        sem = asyncio.Semaphore(MAX_TABS)

        unknown = [n for n in resources if n not in SCRAPERS]
        if unknown:
            print(f"  ⚠ Unknown resource(s): {', '.join(unknown)}  (available: {', '.join(SCRAPERS)})")

        await asyncio.gather(*[
            SCRAPERS[name](browser, sem)
            for name in resources
            if name in SCRAPERS
        ])
        for ctx in _CTX_POOL:
            await ctx.close()
        await browser.close()

    print(f"\n✓ QUL scrape complete. ({time.time() - t0:.0f}s)")


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
    parser.add_argument(
        "--contexts",
        type=int,
        default=NUM_CONTEXTS,
        metavar="N",
        help=f"Max parallel browser contexts (default: {NUM_CONTEXTS})",
    )
    args = parser.parse_args()

    res_list = list(SCRAPERS) if args.resources == "all" else [r.strip() for r in args.resources.split(",")]
    asyncio.run(main(res_list, headless=args.headless.lower() == "true", max_contexts=args.contexts))
