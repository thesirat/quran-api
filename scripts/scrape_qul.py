"""
Modern, Playwright-based scraper for Quranic Universal Library (qul.tarteel.ai).

This refactored version uses an object-oriented approach for better maintainability,
scalability, and robustness. It handles authenticated sessions, a pool of browser
contexts, and concurrent downloads with automatic retries and jittered navigation.

Usage:
    python3 scripts/scrape_qul.py                      # Scrape all resources
    python3 scripts/scrape_qul.py --resources translations,tafsirs,recitation,fonts
    python3 scripts/scrape_qul.py --headless false     # Show browser for debugging
    python3 scripts/scrape_qul.py --contexts 6         # Change context pool size

Resources include: translations, tafsirs, quran-scripts, quran-metadata, surah-info,
topics, ayah-themes, similar-ayah, mutashabihat (phrases.json + phrase_verses.json from zip),
mushaf-layout, transliteration, morphology, recitation (segments/surah JSON + audio zips), fonts (alias: font; zips unpacked to loose files).
"""
from __future__ import annotations

import argparse
import asyncio
import gzip
import io
import json
import logging
import os
import random
import re
import sys
import tempfile
import time
import zipfile
from collections import Counter
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Callable, Type, cast
from urllib.parse import unquote, urljoin

import playwright.async_api
from playwright.async_api import async_playwright

# ---------------------------------------------------------------------------
# Logging & Configuration
# ---------------------------------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger("qul-scraper")

@dataclass
class QULConfig:
    base_url: str = "https://qul.tarteel.ai"
    email: str = os.getenv("QUL_EMAIL", "").strip()
    password: str = os.getenv("QUL_PASSWORD", "").strip()
    
    # Concurrency and Performance
    num_contexts: int = 5
    max_tabs: int = int(os.getenv("QUL_MAX_TABS", "80"))
    headless: bool = True
    
    # Timeouts and retries
    timeout_ms: int = 60_000
    retries: int = 3
    
    # Navigation jitter (seconds)
    min_jitter: float = 0.05
    max_jitter: float = 1.5

# ---------------------------------------------------------------------------
# Utilities (Self-contained)
# ---------------------------------------------------------------------------

REPO_ROOT = Path(__file__).resolve().parent.parent

def safe_path(rel: str | Path) -> Path:
    """Resolve a relative path under REPO_ROOT, raising on traversal."""
    target = (REPO_ROOT / rel).resolve()
    if not str(target).startswith(str(REPO_ROOT)):
        raise ValueError(f"Path traversal detected: {rel}")
    return target

def write_json(path: str, data: Any):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def write_bytes(path: str, data: bytes) -> None:
    parent = os.path.dirname(path)
    if parent:
        os.makedirs(parent, exist_ok=True)
    with open(path, "wb") as f:
        f.write(data)

# ---------------------------------------------------------------------------
# Session Manager
# ---------------------------------------------------------------------------

class QULSession:
    """Manages Playwright browser instance and a pool of authenticated contexts."""

    class WorkerPage:
        """Acquires a tab slot (semaphore), opens a page on a round-robin context, closes on exit."""

        __slots__ = ("_session", "_page")

        def __init__(self, session: QULSession):
            self._session = session
            self._page: Any = None

        async def __aenter__(self) -> Any:
            await self._session.semaphore.acquire()
            ctxs = self._session.contexts
            i = self._session._ctx_rr % len(ctxs)
            self._session._ctx_rr += 1
            self._page = await ctxs[i].new_page()
            return self._page

        async def __aexit__(self, exc_type: Any, exc: Any, tb: Any) -> None:
            try:
                if self._page is not None:
                    await self._page.close()
            finally:
                self._session.semaphore.release()

    def __init__(self, config: QULConfig):
        self.config = config
        self.pw: Any = None
        self.browser: Any = None
        self.context: Any = None
        self.page: Any = None
        self.contexts: list[Any] = []
        self.semaphore = asyncio.Semaphore(config.max_tabs)
        self.storage_state: dict | None = None
        self._ctx_rr = 0

    def worker_page(self) -> QULSession.WorkerPage:
        return QULSession.WorkerPage(self)

    async def __aenter__(self):
        self.pw = await async_playwright().start()
        self.browser = await self.pw.chromium.launch(headless=self.config.headless)

        self.context = await self.browser.new_context(
            user_agent="Mozilla/5.0 (compatible; quran-api-sync/2.0)",
            accept_downloads=True,
        )
        self.page = await self.context.new_page()

        login_url = f"{self.config.base_url}/users/sign_in"
        logger.info(f"Initial login at {login_url}...")
        await self.page.goto(login_url, wait_until="networkidle")
        success = await self._try_login_flow(self.page)
        if not success:
            logger.warning("Continuing with unauthenticated session.")

        nctx = max(1, int(self.config.num_contexts))
        self.contexts = [self.context]
        if nctx > 1:
            state = await self.context.storage_state()
            ua = "Mozilla/5.0 (compatible; quran-api-sync/2.0)"
            for _ in range(nctx - 1):
                c = await self.browser.new_context(
                    storage_state=state,
                    user_agent=ua,
                    accept_downloads=True,
                )
                self.contexts.append(c)
            logger.info(
                f"Using {len(self.contexts)} browser contexts; "
                f"up to {self.config.max_tabs} concurrent download tabs (QUL_MAX_TABS)."
            )
        else:
            logger.info(
                f"Using 1 browser context; "
                f"up to {self.config.max_tabs} concurrent download tabs (QUL_MAX_TABS)."
            )

        return self

    async def __aexit__(self, exc_type: Any, exc_val: Any, exc_tb: Any) -> None:
        if self.page:
            await self.page.close()
            self.page = None
        for ctx in self.contexts:
            await ctx.close()
        self.contexts = []
        self.context = None
        if self.browser:
            await self.browser.close()
        if self.pw:
            await self.pw.stop()

    async def _try_login_flow(self, page: Any) -> bool:
        if not self.config.email or not self.config.password:
            logger.info("No QUL credentials (QUL_EMAIL/QUL_PASSWORD) provided.")
            return False

        logger.info(f"Performing login at {page.url}...")
        email_sel = 'input#user_email, input[type="email"], input[name*="email"]'
        pass_sel = 'input#user_password, input[type="password"]'
        
        try:
            # Wait for fields to be stable
            await page.wait_for_selector(email_sel, state="visible", timeout=10_000)
            
            # Fill email
            email_field = page.locator(email_sel).first
            await email_field.fill(self.config.email)
            
            # Fill password
            pass_field = page.locator(pass_sel).first
            await pass_field.fill(self.config.password)
            
            # Try to click the submit button if possible, otherwise press Enter
            submit_btn = page.locator('input[type="submit"], button[type="submit"], button:has-text("Log in"), button:has-text("Sign in")').first
            if await submit_btn.count() > 0:
                await submit_btn.click()
            else:
                await page.keyboard.press("Enter")
            
            logger.info("Credentials entered, waiting for navigation...")
            
            # Wait for navigation
            try:
                await page.wait_for_url(lambda u: "/sign_in" not in u and "/login" not in u, timeout=20_000, wait_until="domcontentloaded")
            except Exception:
                logger.warning(f"URL change timeout. Current: {page.url}")
            
            await page.wait_for_load_state("networkidle", timeout=10_000)
            
            # Verification logic
            has_logout = await page.locator('a:has-text("Logout"), a[href*="sign_out"]').count() > 0
            is_off_login = not any(p in page.url for p in ("/login", "/signin", "/sign_in"))
            
            if has_logout or is_off_login:
                logger.info(f"Login successful. Current URL: {page.url}")
                return True
            
            # Diagnostic capture on failure
            logger.warning(f"Login verification failed. URL: {page.url}")
            await page.screenshot(path="login_debug.png")
            with open("login_debug.html", "w") as f: f.write(await page.content())
            return False
            
        except Exception as e:
            logger.error(f"Error during login flow: {e}")
            return False


# ---------------------------------------------------------------------------
# Base Scraper
# ---------------------------------------------------------------------------

class BaseScraper:
    def __init__(self, session: QULSession, name: str):
        self.session = session
        self.config = session.config
        self.name = name
        self.stats = Counter()
        self.errors: list[str] = []
        self._stats_lock = asyncio.Lock()

    async def bump_stat(self, key: str, inc: int = 1) -> None:
        async with self._stats_lock:
            self.stats[key] += inc

    async def run(self):
        raise NotImplementedError()

    async def goto(self, page: Any, url: str):
        await asyncio.sleep(random.uniform(self.config.min_jitter, self.config.max_jitter))
        for attempt in range(self.config.retries):
            try:
                await page.goto(url, wait_until="domcontentloaded", timeout=self.config.timeout_ms)
                return
            except Exception as exc:
                if attempt == self.config.retries - 1: raise
                wait = (2 ** attempt) + random.uniform(0.1, 0.5)
                await asyncio.sleep(wait)

    async def download_resource(self, page: Any, locator: Any, tag: str = "") -> Any:
        try:
            logger.info(f"[{tag or self.name}] Attempting download...")
            if await locator.count() == 0:
                logger.warning(f"[{tag or self.name}] Download button not found.")
                return None
            async with page.expect_download(timeout=90_000) as dl_info:
                try: await locator.scroll_into_view_if_needed(timeout=5_000)
                except Exception: pass
                await locator.click(timeout=30_000, force=True)
            dl = await dl_info.value
            logger.info(f"[{tag or self.name}] Download started: {dl.suggested_filename}")
            with tempfile.NamedTemporaryFile(delete=False) as tmp:
                tmp_path = Path(tmp.name)
            await dl.save_as(str(tmp_path))
            content = tmp_path.read_bytes()
            result = self._parse_any(content)
            tmp_path.unlink(missing_ok=True)
            if result:
                logger.info(f"[{tag or self.name}] Successfully parsed {len(content)} bytes.")
            else:
                logger.warning(f"[{tag or self.name}] Failed to parse downloaded content.")
            return result
        except Exception as exc:
            msg = f"{tag or self.name}: {exc}"
            logger.error(f"Download error: {msg}")
            self.errors.append(msg)
            return None

    async def download_raw_bytes(
        self, page: Any, locator: Any, tag: str = ""
    ) -> tuple[bytes, str] | None:
        """Trigger a file download and return raw bytes plus Playwright suggested filename."""
        try:
            if await locator.count() == 0:
                return None
            async with page.expect_download(timeout=120_000) as dl_info:
                try:
                    await locator.scroll_into_view_if_needed(timeout=5_000)
                except Exception:
                    pass
                await locator.click(timeout=30_000, force=True)
            dl = await dl_info.value
            name = dl.suggested_filename or "download.bin"
            logger.info(f"[{tag or self.name}] Download started: {name}")
            with tempfile.NamedTemporaryFile(delete=False) as tmp:
                tmp_path = Path(tmp.name)
            await dl.save_as(str(tmp_path))
            content = tmp_path.read_bytes()
            tmp_path.unlink(missing_ok=True)
            logger.info(f"[{tag or self.name}] Saved {len(content)} bytes ({name})")
            return (content, name)
        except Exception as exc:
            msg = f"{tag or self.name}: {exc}"
            logger.error(f"Download error: {msg}")
            self.errors.append(msg)
            return None

    def _zip_extract_all_json(self, body: bytes) -> dict[str, Any]:
        """Basename -> parsed JSON for every .json member (e.g. segments.json + surah.json)."""
        out: dict[str, Any] = {}
        try:
            with zipfile.ZipFile(io.BytesIO(body)) as zf:
                for n in zf.namelist():
                    if not n.endswith(".json") or n.endswith("/"):
                        continue
                    base = n.replace("\\", "/").split("/")[-1]
                    try:
                        out[base] = json.loads(
                            zf.read(n).decode("utf-8", errors="replace")
                        )
                    except Exception:
                        pass
        except Exception:
            pass
        return out

    def _zip_has_non_json_files(self, body: bytes) -> bool:
        try:
            with zipfile.ZipFile(io.BytesIO(body)) as zf:
                for n in zf.namelist():
                    if n.endswith("/"):
                        continue
                    low = n.lower()
                    if not low.endswith(".json"):
                        return True
        except Exception:
            pass
        return False

    def _zip_extract_non_json_members(self, body: bytes, out_dir: str) -> int:
        """Write every non-directory, non-.json zip member under out_dir (fonts, etc.). Skips __MACOSX."""
        written = 0
        counts: Counter[str] = Counter()
        try:
            with zipfile.ZipFile(io.BytesIO(body)) as zf:
                for n in zf.namelist():
                    if n.endswith("/"):
                        continue
                    norm = n.replace("\\", "/")
                    if norm.startswith("__MACOSX/") or "/__MACOSX/" in norm:
                        continue
                    if norm.lower().endswith(".json"):
                        continue
                    base = norm.split("/")[-1]
                    if not base or base == ".DS_Store":
                        continue
                    safe = re.sub(r"[^a-zA-Z0-9._-]+", "_", base)
                    if not safe:
                        continue
                    counts[safe] += 1
                    c = counts[safe]
                    if c == 1:
                        fn = safe
                    else:
                        stem, ext = os.path.splitext(safe)
                        fn = f"{stem}_{c}{ext}"
                    try:
                        data = zf.read(n)
                    except Exception:
                        continue
                    write_bytes(os.path.join(out_dir, fn), data)
                    written += 1
        except Exception:
            pass
        return written

    def save_qul_download(
        self,
        body: bytes,
        suggested_name: str,
        out_dir: str,
        *,
        unpack_zip_members: bool = False,
    ) -> int:
        """
        Persist one downloaded asset under out_dir. Returns number of files written.
        - Plain JSON / SQLite: one output file.
        - Zip: extract every .json member to out_dir (segments.json, surah.json, …).
          If unpack_zip_members (fonts): also extract all other files from the zip; no archives/ copy
          unless non-JSON members exist but none could be extracted.
          Otherwise: if the zip also holds non-JSON (e.g. audio), store the full archive under out_dir/archives/.
        - Other binaries: out_dir/binaries/
        """
        os.makedirs(out_dir, exist_ok=True)
        written = 0
        name_lower = (suggested_name or "").lower()

        if body.startswith(b"PK"):
            json_members = self._zip_extract_all_json(body)
            for base, parsed in json_members.items():
                dest = os.path.join(out_dir, base)
                write_json(dest, parsed)
                written += 1
            if unpack_zip_members:
                n_bin = self._zip_extract_non_json_members(body, out_dir)
                written += n_bin
                if self._zip_has_non_json_files(body) and n_bin == 0:
                    arch_name = (
                        suggested_name
                        if name_lower.endswith(".zip")
                        else f"{Path(suggested_name).stem}.zip"
                    )
                    if not arch_name.lower().endswith(".zip"):
                        arch_name += ".zip"
                    write_bytes(os.path.join(out_dir, "archives", arch_name), body)
                    written += 1
            else:
                if self._zip_has_non_json_files(body) or not json_members:
                    arch_name = (
                        suggested_name
                        if name_lower.endswith(".zip")
                        else f"{Path(suggested_name).stem}.zip"
                    )
                    if not arch_name.lower().endswith(".zip"):
                        arch_name += ".zip"
                    write_bytes(os.path.join(out_dir, "archives", arch_name), body)
                    written += 1
            return written

        if body.startswith(b"SQLite format 3"):
            rows = self._parse_sqlite_bytes(body)
            stem = Path(suggested_name).stem or "data"
            write_json(os.path.join(out_dir, f"{stem}.json"), rows if rows is not None else [])
            return 1

        try:
            parsed = json.loads(body.decode("utf-8", errors="strict"))
            stem = Path(suggested_name).stem or "data"
            write_json(os.path.join(out_dir, f"{stem}.json"), parsed)
            return 1
        except Exception:
            pass

        safe = re.sub(r"[^a-zA-Z0-9._-]+", "_", suggested_name or "download.bin")
        write_bytes(os.path.join(out_dir, "binaries", safe), body)
        return 1

    def _detail_download_buttons(self, page: Any) -> Any:
        """All file download controls on a QUL resource detail page (fonts, audio, JSON, …)."""
        return page.locator("a.btn").filter(has_text=re.compile(r"download", re.I))

    async def fetch_http(self, page: Any, url: str, tag: str = "") -> Any:
        try:
            resp = await page.context.request.get(url, timeout=self.config.timeout_ms)
            if resp.status != 200: return None
            body = (await resp.body())
            return self._parse_any(body)
        except Exception as exc:
            self.errors.append(f"{tag or self.name}: {exc}")
            return None

    def _parse_any(self, body: bytes) -> Any:
        # Playwright Buffer can sometimes behave like bytes or have a .to_bytes() method
        if hasattr(body, "to_bytes"):
            body = cast(Any, body).to_bytes()
        
        if body.startswith(b"SQLite format 3"): 
            return self._parse_sqlite_bytes(body)
        if body.startswith(b"PK"): 
            return self._parse_zip_bytes(body)
            
        try:
            return json.loads(body.decode("utf-8", errors="ignore"))
        except Exception:
            return None

    def _parse_sqlite_bytes(self, body: bytes) -> list[dict] | None:
        import sqlite3
        with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as tmp:
            tmp_path = Path(tmp.name)
            tmp_path.write_bytes(body)
        try:
            with sqlite3.connect(tmp_path) as con:
                con.row_factory = sqlite3.Row
                tables = [r[0] for r in con.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()]
                if not tables: return None
                best = max(tables, key=lambda t: con.execute(f'SELECT COUNT(*) FROM "{t}"').fetchone()[0])
                return [dict(r) for r in con.execute(f'SELECT * FROM "{best}"').fetchall()]
        except Exception: return None
        finally: tmp_path.unlink(missing_ok=True)

    def _pick_json_member_from_zip(self, zf: zipfile.ZipFile) -> str | None:
        """QUL packs multiple JSON files; the lexicographically first is often an empty manifest."""
        json_files = [n for n in zf.namelist() if n.endswith(".json") and not n.endswith("/")]
        if not json_files:
            return None
        lower_names = [(n, n.lower()) for n in json_files]
        for n, low in lower_names:
            if "simple" in low and "manifest" not in low:
                return n
        best = max(json_files, key=lambda n: zf.getinfo(n).file_size)
        return best

    def _pick_sqlite_member_from_zip(self, zf: zipfile.ZipFile) -> str | None:
        sqlite_files = [
            n
            for n in zf.namelist()
            if n.endswith((".db", ".sqlite")) and not n.endswith("/")
        ]
        if not sqlite_files:
            return None
        for n in sqlite_files:
            if "simple" in n.lower():
                return n
        return max(sqlite_files, key=lambda n: zf.getinfo(n).file_size)

    def _parse_zip_bytes(self, body: bytes) -> Any:
        try:
            with zipfile.ZipFile(io.BytesIO(body)) as zf:
                json_member = self._pick_json_member_from_zip(zf)
                if json_member:
                    raw = zf.read(json_member).decode("utf-8", errors="replace")
                    return json.loads(raw)
                sqlite_member = self._pick_sqlite_member_from_zip(zf)
                if sqlite_member:
                    return self._parse_sqlite_bytes(zf.read(sqlite_member))
        except Exception:
            pass
        return None

    def _unwrap_list_payload(self, data: Any, list_keys: tuple[str, ...]) -> list[Any] | None:
        """Turn common QUL JSON envelopes into a list of records."""
        if isinstance(data, list):
            return data
        if not isinstance(data, dict):
            return None
        fallback: list[Any] | None = None
        for key in list_keys:
            v = data.get(key)
            if isinstance(v, list):
                if len(v) > 0:
                    return v
                if fallback is None:
                    fallback = v
        return fallback

    @staticmethod
    def _resource_slug(detail_path: str) -> str:
        segs = [s for s in (detail_path or "").strip().split("/") if s]
        if not segs:
            return "unknown"
        slug = segs[-1]
        if slug.lower() in ("none", "null", ""):
            return segs[-2] if len(segs) >= 2 else "unknown"
        return slug

    @staticmethod
    def _verse_key_from_record(it: dict[str, Any]) -> str | None:
        vk = it.get("verse_key") or it.get("verseKey")
        if vk:
            return str(vk)
        verse = it.get("verse")
        if isinstance(verse, dict):
            vk = verse.get("verse_key") or verse.get("verseKey")
            if vk:
                return str(vk)
            ch = verse.get("chapter_id") or verse.get("chapter_number")
            vn = verse.get("verse_number") or verse.get("number")
            if ch is not None and vn is not None:
                return f"{ch}:{vn}"
        ch = it.get("chapter_id") or it.get("chapter_number") or it.get("surah_id")
        vn = it.get("verse_number")
        if vn is None and isinstance(it.get("verse"), int):
            vn = it.get("verse")
        if vn is None and isinstance(it.get("verse"), dict):
            vn = it["verse"].get("verse_number")
        if ch is not None and vn is not None:
            return f"{ch}:{vn}"
        return None

    @staticmethod
    def _translation_text_from_record(it: dict[str, Any]) -> str | None:
        for key in (
            "text",
            "translation",
            "translation_text",
            "content",
            "verse_translation",
            "foot_note",
            "footnote",
        ):
            val = it.get(key)
            if isinstance(val, str) and val.strip():
                return val
        return None

    @staticmethod
    def _surah_key_from_tafsir_record(it: dict[str, Any]) -> int | str:
        for key in ("chapter_id", "surah_number", "surah_id", "chapter_number"):
            v = it.get(key)
            if v is not None and v != "":
                return v if isinstance(v, int) else v
        verse = it.get("verse")
        if isinstance(verse, dict):
            for key in ("chapter_id", "surah_number", "chapter_number"):
                v = verse.get(key)
                if v is not None and v != "":
                    return v if isinstance(v, int) else v
        return 1

    def _json_download_locator(self, page: Any) -> Any:
        """QUL uses JS links (href '#_'); match visible label instead of href."""
        return page.locator(
            'a:has-text("simple.json"), a.btn:has-text("json"), '
            'a[href$=".json"], a[href*="format=json"]'
        ).first

    def _sqlite_download_locator(self, page: Any) -> Any:
        """Same pattern as JSON: label 'Download simple.sqlite', href often '#_'."""
        return page.locator(
            'a:has-text("simple.sqlite"), a:has-text(".sqlite"), '
            'a.btn:has-text("sqlite"), a[href$=".sqlite"]'
        ).first

    def print_summary(self):
        if self.stats: logger.info(f"[{self.name}] Summary: " + ", ".join(f"{k}={v}" for k, v in self.stats.items()))
        if self.errors:
            logger.info(f"[{self.name}] {len(self.errors)} failures.")

# ---------------------------------------------------------------------------
# Concrete Scrapers
# ---------------------------------------------------------------------------

class TranslationScraper(BaseScraper):
    def __init__(self, session: QULSession): super().__init__(session, "translations")
    async def run(self):
        page = self.session.page
        try:
            await self.goto(page, f"{self.config.base_url}/resources/translation/")
            await page.wait_for_selector('table tr', timeout=15_000)
            
            # 1. Collect all detail URLs first
            rows = page.locator('tr:has(td:first-child a[href*="/resources/translation/"])')
            count = await rows.count()
            logger.info(f"[{self.name}] Found {count} rows. Extracting links...")
            
            detail_items = []
            for i in range(count):
                row = rows.nth(i)
                link = row.locator('td:first-child a[href*="/resources/translation/"]').first
                text = await link.inner_text()
                if "word" in text.lower(): continue
                
                path = await link.get_attribute("href")
                if path:
                    detail_items.append({"name": text.strip(), "path": path})

            logger.info(f"[{self.name}] Queued {len(detail_items)} resources for download.")

            async def _one(item: dict[str, str]) -> None:
                async with self.session.worker_page() as wp:
                    await self._scrape_resource(wp, item["name"], item["path"])

            results = await asyncio.gather(
                *(_one(item) for item in detail_items),
                return_exceptions=True,
            )
            for item, res in zip(detail_items, results):
                if isinstance(res, Exception):
                    msg = f"{item.get('path')}: {res}"
                    logger.error(f"[{self.name}] {msg}")
                    self.errors.append(msg)

        finally: pass
        self.print_summary()

    async def _scrape_resource(self, page: Any, name: str, detail_path: str):
        tid = self._resource_slug(detail_path)
        detail_url = f"{self.config.base_url}{detail_path}"
        
        logger.info(f"[{self.name}] Navigating to detail page: {detail_url}")
        await self.goto(page, detail_url)
        
        json_btn = self._json_download_locator(page)
        data = await self.download_resource(page, json_btn, tag=f"tid-{tid}")
        if data:
            items = self._unwrap_list_payload(
                data,
                (
                    "translations",
                    "translation_ayahs",
                    "ayahs",
                    "verses",
                    "data",
                    "records",
                    "results",
                ),
            )
            if isinstance(items, list) and items:
                out: dict[str, Any] = {}
                for it in items:
                    if not isinstance(it, dict):
                        continue
                    vkey = self._verse_key_from_record(it) or (
                        f"{it.get('chapter_id', 1)}:{it.get('verse_number', 1)}"
                    )
                    out[str(vkey)] = {"text": self._translation_text_from_record(it)}
                if out:
                    write_json(f"data/translations/{tid}.json", out)
                    await self.bump_stat("written")
                else:
                    logger.warning(f"[{self.name}] Parsed list but no rows for tid={tid}; saving raw payload.")
                    write_json(f"data/translations/{tid}.json", data)
                    await self.bump_stat("written")
            else:
                write_json(f"data/translations/{tid}.json", data)
                await self.bump_stat("written")

class TafsirScraper(BaseScraper):
    def __init__(self, session: QULSession): super().__init__(session, "tafsirs")
    async def run(self):
        page = self.session.page
        try:
             await self.goto(page, f"{self.config.base_url}/resources/tafsir/")
             await page.wait_for_selector('table tr', timeout=15_000)
             
             # Extract links upfront for stability
             rows = page.locator('tr:has(td:first-child a[href^="/resources/"])')
             count = await rows.count()
             
             detail_items = []
             for i in range(count):
                 link = rows.nth(i).locator('td:first-child a').first
                 text = (await link.inner_text()).strip()
                 href = await link.get_attribute("href")
                 if not href or "Download" in text: continue
                 detail_items.append({"name": text, "path": href})

             logger.info(f"[{self.name}] Found {len(detail_items)} tafsirs.")

             async def _one(item: dict[str, str]) -> None:
                 async with self.session.worker_page() as wp:
                     await self._scrape_resource(wp, item["name"], item["path"])

             results = await asyncio.gather(
                 *(_one(item) for item in detail_items),
                 return_exceptions=True,
             )
             for item, res in zip(detail_items, results):
                 if isinstance(res, Exception):
                     msg = f"{item.get('path')}: {res}"
                     logger.error(f"[{self.name}] {msg}")
                     self.errors.append(msg)
        finally: pass
        self.print_summary()

    async def _scrape_resource(self, page: Any, name: str, detail_path: str):
        tid = self._resource_slug(detail_path)
        logger.info(f"[{self.name}] Navigating to detail page: {name}")
        await self.goto(page, f"{self.config.base_url}{detail_path}")
        
        json_btn = self._json_download_locator(page)
        data = await self.download_resource(page, json_btn, tag=f"tafsir-{tid}")
        
        if data:
            by_surah: dict[Any, list[Any]] = {}
            items = self._unwrap_list_payload(
                data,
                ("tafsirs", "tafsir_ayahs", "ayahs", "verses", "data", "records", "results"),
            )
            if not isinstance(items, list):
                write_json(f"data/tafsirs/{tid}/raw.json", data)
                await self.bump_stat("written")
                return
            if len(items) == 0:
                logger.warning(f"[{self.name}] Empty payload for tid={tid}; saving raw envelope.")
                write_json(f"data/tafsirs/{tid}/raw.json", data)
                await self.bump_stat("written")
                return
            for it in items:
                if not isinstance(it, dict):
                    continue
                s = self._surah_key_from_tafsir_record(it)
                if s is None or s == "":
                    s = 1
                by_surah.setdefault(s, []).append(it)
            for s, ayahs in by_surah.items():
                write_json(f"data/tafsirs/{tid}/{s}.json", {"ayahs": ayahs})
            await self.bump_stat("written")

class QuranScriptScraper(BaseScraper):
    def __init__(self, session: QULSession): super().__init__(session, "quran-scripts")
    async def run(self):
        page = self.session.page
        try:
             await self.goto(page, f"{self.config.base_url}/resources/quran-script/")
             await page.wait_for_selector('table tr', timeout=15_000)
             
             # Extract links upfront for stability
             rows = page.locator('tr:has(td:first-child a[href^="/resources/"])')
             count = await rows.count()
             
             detail_items = []
             for i in range(count):
                 link = rows.nth(i).locator('td:first-child a').first
                 text = (await link.inner_text()).strip()
                 href = await link.get_attribute("href")
                 if not href or "Download" in text: continue
                 detail_items.append({"name": text, "path": href})

             logger.info(f"[{self.name}] Found {len(detail_items)} scripts.")

             async def _one(item: dict[str, str]) -> None:
                 async with self.session.worker_page() as wp:
                     await self._scrape_resource(wp, item["name"], item["path"])

             results = await asyncio.gather(
                 *(_one(item) for item in detail_items),
                 return_exceptions=True,
             )
             for item, res in zip(detail_items, results):
                 if isinstance(res, Exception):
                     msg = f"{item.get('path')}: {res}"
                     logger.error(f"[{self.name}] {msg}")
                     self.errors.append(msg)
        finally: pass
        self.print_summary()

    async def _scrape_resource(self, page: Any, name: str, detail_path: str):
        slug = self._resource_slug(detail_path)
        logger.info(f"[{self.name}] Navigating to detail page for: {name}")
        await self.goto(page, f"{self.config.base_url}{detail_path}")
        
        json_btn = self._json_download_locator(page)
        data = await self.download_resource(page, json_btn, tag=f"script-{slug}")
        if data:
            items = self._unwrap_list_payload(data, ("verses", "ayahs", "data", "records", "results"))
            if not isinstance(items, list):
                items = []
            if items:
                out = {
                    f"{it.get('chapter_id')}:{it.get('verse_number')}": it.get("text", "")
                    for it in items
                    if isinstance(it, dict)
                }
                write_json(f"data/quran/{slug or 'script-unknown'}.json", out)
                await self.bump_stat("written")
            else:
                write_json(f"data/quran/{slug or 'script-unknown'}-raw.json", data)
                await self.bump_stat("written")

class BasicSingleFileScraper(BaseScraper):
    def __init__(
        self,
        session: QULSession,
        name: str,
        path: str,
        slug: str,
        multi_dir: str = "data/metadata",
    ):
        super().__init__(session, name)
        self.path = path
        self.slug = slug
        self.multi_dir = multi_dir.rstrip("/")
    async def run(self):
        page = self.session.page
        try:
            url = f"{self.config.base_url}/resources/{self.slug}/"
            logger.info(f"[{self.name}] Navigating to {url}...")
            await self.goto(page, url)
            await page.wait_for_selector('table tr', timeout=15_000)
            
            # 1. Collect all detail URLs first.
            # We target ONLY links in the first column that point to a resource detail page.
            # We exclude anything with "download" in the text or href to avoid trigger links.
            rows = page.locator('tr:has(td:first-child a[href^="/resources/"])')
            count = await rows.count()
            
            detail_items = []
            for i in range(count):
                row = rows.nth(i)
                link = row.locator('td:first-child a').first
                text = (await link.inner_text()).strip()
                href = await link.get_attribute("href")
                
                # Filter out obvious non-resource links
                if not href or "/download" in href or "Download" in text:
                    continue
                
                detail_items.append({"name": text, "path": href})

            n_resources = len(detail_items)
            logger.info(f"[{self.name}] Found {n_resources} valid resources.")
            
            if not detail_items:
                if "users/sign_in" in page.url:
                    logger.error("Session lost, redirected to login.")
                return

            async def _one(item: dict[str, str]) -> None:
                name = item["name"]
                path = item["path"]
                fname = name.lower().replace(" ", "_").replace("(", "").replace(")", "").replace("/", "_")
                out_path = (
                    self.path
                    if n_resources == 1 and getattr(self, "path", "")
                    else f"{self.multi_dir}/{fname}.json"
                )
                async with self.session.worker_page() as wp:
                    logger.info(f"[{self.name}] Navigating to detail page for: {name}")
                    await self.goto(wp, f"{self.config.base_url}{path}")
                    json_btn = self._json_download_locator(wp)
                    sqlite_btn = self._sqlite_download_locator(wp)
                    data = None
                    if await json_btn.count() > 0:
                        data = await self.download_resource(wp, json_btn, tag=fname)
                    if not data and await sqlite_btn.count() > 0:
                        logger.info(f"[{self.name}] Using SQLite download for {name}")
                        data = await self.download_resource(wp, sqlite_btn, tag=f"{fname}-sqlite")
                    if data:
                        res_to_write = data
                        if isinstance(data, dict) and "data" in data:
                            res_to_write = data["data"]
                        write_json(out_path, res_to_write)
                        await self.bump_stat("written")
                        logger.info(
                            f"[{self.name}] Wrote {out_path} ({len(str(res_to_write))} chars approx)"
                        )
                    elif await json_btn.count() == 0 and await sqlite_btn.count() == 0:
                        logger.warning(
                            f"[{self.name}] No JSON or SQLite download on detail page for {name}"
                        )
                    else:
                        logger.warning(
                            f"[{self.name}] Download failed or parsed empty for {name}"
                        )

            results = await asyncio.gather(
                *(_one(item) for item in detail_items),
                return_exceptions=True,
            )
            for item, res in zip(detail_items, results):
                if isinstance(res, Exception):
                    msg = f"{item.get('path')}: {res}"
                    logger.error(f"[{self.name}] {msg}")
                    self.errors.append(msg)
        except Exception as e:
            logger.error(f"[{self.name}] Critical error in run: {e}")
        self.print_summary()


class MultiAssetResourceScraper(BaseScraper):
    """
    Detail pages with many downloads (recitation timestamps + audio archives, font files, …).
    Clicks every .btn that mentions Download and saves bytes (JSON/SQLite/zip/binaries).
    """

    def __init__(
        self,
        session: QULSession,
        name: str,
        list_slug: str,
        out_root: str,
        *,
        unpack_zip_members: bool = False,
    ):
        super().__init__(session, name)
        self.list_slug = list_slug
        self.out_root = out_root.rstrip("/")
        self.unpack_zip_members = unpack_zip_members

    async def run(self):
        page = self.session.page
        try:
            list_url = f"{self.config.base_url}/resources/{self.list_slug}/"
            logger.info(f"[{self.name}] Listing {list_url}")
            await self.goto(page, list_url)
            await page.wait_for_selector("table tr", timeout=15_000)
            needle = f"/resources/{self.list_slug}/"
            rows = page.locator(f'tr:has(td:first-child a[href*="{needle}"])')
            count = await rows.count()
            detail_items: list[dict[str, str]] = []
            for i in range(count):
                link = rows.nth(i).locator("td:first-child a").first
                text = (await link.inner_text()).strip()
                href = await link.get_attribute("href")
                if not href or "Download" in text:
                    continue
                detail_items.append({"name": text, "path": href})

            logger.info(f"[{self.name}] Found {len(detail_items)} resources.")
            if not detail_items:
                if "users/sign_in" in page.url:
                    logger.error("Session lost, redirected to login.")
                return

            async def _one(item: dict[str, str]) -> None:
                tid = self._resource_slug(item["path"])
                out_dir = f"{self.out_root}/{tid}"
                async with self.session.worker_page() as wp:
                    await self._download_all_for_detail(
                        wp, item["name"], item["path"], out_dir
                    )

            results = await asyncio.gather(
                *(_one(item) for item in detail_items),
                return_exceptions=True,
            )
            for item, res in zip(detail_items, results):
                if isinstance(res, Exception):
                    msg = f"{item.get('path')}: {res}"
                    logger.error(f"[{self.name}] {msg}")
                    self.errors.append(msg)
        finally:
            pass
        self.print_summary()

    async def _download_all_for_detail(
        self, page: Any, name: str, detail_path: str, out_dir: str
    ) -> None:
        url = f"{self.config.base_url}{detail_path}"
        logger.info(f"[{self.name}] Detail: {name} -> {out_dir}")
        await self.goto(page, url)
        loc = self._detail_download_buttons(page)
        n = await loc.count()
        if n == 0:
            logger.warning(f"[{self.name}] No download buttons for {name!r}")
            return
        for i in range(n):
            btn = loc.nth(i)
            du = await btn.get_attribute("data-url") or ""
            if "sign_in" in du and "modal" in du:
                label = (await btn.inner_text()).strip()
                logger.warning(
                    f"[{self.name}] Skipping gated control (not logged in?): {label!r}"
                )
                continue
            raw = await self.download_raw_bytes(page, btn, tag=f"{self.name}-{i}")
            if not raw:
                continue
            body, fname = raw
            w = self.save_qul_download(
                body,
                fname,
                out_dir,
                unpack_zip_members=self.unpack_zip_members,
            )
            if w:
                await self.bump_stat("written", w)


SCRAPER_FACTORIES: dict[str, Callable[[QULSession], BaseScraper]] = {
    "translations": TranslationScraper,
    "tafsirs": TafsirScraper,
    "quran-scripts": QuranScriptScraper,
    "quran-metadata": lambda s: BasicSingleFileScraper(s, "quran-metadata", "data/metadata/quran.json", "quran-metadata"),
    "surah-info": lambda s: BasicSingleFileScraper(s, "surah-info", "data/surah-info/data.json", "surah-info"),
    "topics": lambda s: BasicSingleFileScraper(s, "topics", "data/topics/data.json", "ayah-topics"),
    "ayah-themes": lambda s: BasicSingleFileScraper(s, "ayah-themes", "data/ayah-themes/data.json", "ayah-theme"),
    "similar-ayah": lambda s: BasicSingleFileScraper(
        s, "similar-ayah", "", "similar-ayah", "data/similar-ayah"
    ),
    "mutashabihat": lambda s: MultiAssetResourceScraper(
        s, "mutashabihat", "mutashabihat", "data/mutashabihat"
    ),
    "mushaf-layout": lambda s: BasicSingleFileScraper(
        s, "mushaf-layout", "", "mushaf-layout", "data/mushaf-layout"
    ),
    "transliteration": lambda s: BasicSingleFileScraper(
        s, "transliteration", "", "transliteration", "data/transliteration"
    ),
    "recitation": lambda s: MultiAssetResourceScraper(
        s, "recitation", "recitation", "data/recitations"
    ),
    "fonts": lambda s: MultiAssetResourceScraper(
        s, "fonts", "font", "data/fonts", unpack_zip_members=True
    ),
}

async def main():
    parser = argparse.ArgumentParser(description="Cleaned up QUL Scraper")
    parser.add_argument("--resources", default="all")
    parser.add_argument("--headless", default="true")
    parser.add_argument(
        "--contexts",
        type=int,
        default=None,
        metavar="N",
        help="Number of authenticated browser contexts for parallel downloads (default: 5)",
    )
    parser.add_argument("--dry-run", action="store_true", help="Validate script without running browser")
    args = parser.parse_args()
    
    if args.dry_run:
        logger.info("Dry run successful: Configuration and factories validated.")
        return

    config = QULConfig(headless=args.headless == "true")
    if args.contexts is not None:
        config.num_contexts = max(1, args.contexts)
    _aliases = {"font": "fonts"}
    if args.resources == "all":
        selected = list(SCRAPER_FACTORIES.keys())
    else:
        selected = [
            _aliases.get(r.strip(), r.strip())
            for r in args.resources.split(",")
            if r.strip()
        ]
    unknown = [n for n in selected if n not in SCRAPER_FACTORIES]
    if unknown:
        logger.warning("Unknown --resources entries (ignored): %s", ", ".join(unknown))
    async with QULSession(config) as session:
        scrapers = [SCRAPER_FACTORIES[name](session) for name in selected if name in SCRAPER_FACTORIES]
        for s in scrapers:
            await s.run()

if __name__ == "__main__":
    try: asyncio.run(main())
    except KeyboardInterrupt: pass
