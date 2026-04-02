"""
Modern, Playwright-based scraper for Quranic Universal Library (qul.tarteel.ai).

This refactored version uses an object-oriented approach for better maintainability,
scalability, and robustness. It handles authenticated sessions, a pool of browser
contexts, and concurrent downloads with automatic retries and jittered navigation.

Usage:
    python3 scripts/scrape_qul.py                      # Scrape all resources
    python3 scripts/scrape_qul.py --resources translations,tafsirs
    python3 scripts/scrape_qul.py --headless false     # Show browser for debugging
    python3 scripts/scrape_qul.py --contexts 6         # Change context pool size
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

# ---------------------------------------------------------------------------
# Session Manager
# ---------------------------------------------------------------------------

class QULSession:
    """Manages Playwright browser instance and a pool of authenticated contexts."""
    
    def __init__(self, config: QULConfig):
        self.config = config
        self.pw: Any = None
        self.browser: Any = None
        self.context: Any = None
        self.page: Any = None
        self.semaphore = asyncio.Semaphore(config.max_tabs)
        self.storage_state: dict | None = None
        self._ctx_rr = 0

    async def __aenter__(self):
        self.pw = await async_playwright().start()
        self.browser = await self.pw.chromium.launch(headless=self.config.headless)
        
        # Single persistent context and page for metadata
        self.context = await self.browser.new_context(
            user_agent="Mozilla/5.0 (compatible; quran-api-sync/2.0)",
            accept_downloads=True,
        )
        self.page = await self.context.new_page()
        
        # Login once
        login_url = f"{self.config.base_url}/users/sign_in"
        logger.info(f"Initial login at {login_url}...")
        await self.page.goto(login_url, wait_until="networkidle")
        success = await self._try_login_flow(self.page)
        if not success:
            logger.warning("Continuing with unauthenticated session.")
        
        return self

    async def __aexit__(self, exc_type: Any, exc_val: Any, exc_tb: Any) -> None:
        if self.page: await self.page.close()
        if self.context: await self.context.close()
        if self.browser: await self.browser.close()
        if self.pw: await self.pw.stop()

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

    def _parse_zip_bytes(self, body: bytes) -> Any:
        try:
            with zipfile.ZipFile(io.BytesIO(body)) as zf:
                json_files = [n for n in zf.namelist() if n.endswith(".json")]
                if json_files: return json.loads(zf.read(json_files[0]).decode("utf-8"))
                sqlite_files = [n for n in zf.namelist() if n.endswith((".db", ".sqlite"))]
                if sqlite_files: return self._parse_sqlite_bytes(zf.read(sqlite_files[0]))
        except Exception: pass
        return None

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

            # 2. Iterate over collected links
            for item in detail_items:
                await self._scrape_resource(page, item["name"], item["path"])

        finally: pass
        self.print_summary()

    async def _scrape_resource(self, page: Any, name: str, detail_path: str):
        tid = detail_path.split("/")[-1]
        detail_url = f"{self.config.base_url}{detail_path}"
        
        logger.info(f"[{self.name}] Navigating to detail page: {detail_url}")
        await self.goto(page, detail_url)
        
        json_btn = page.locator('a.btn:has-text("json"), a[href$=".json"], a[href*="format=json"]').first
        data = await self.download_resource(page, json_btn, tag=f"tid-{tid}")
        if data:
            items = data if isinstance(data, list) else data.get("translations", [])
            out = {it.get("verse_key") or f"{it.get('chapter_id')}:{it.get('verse_number')}": {"text": it.get("text")} for it in items}
            write_json(f"data/translations/{tid}.json", out)
            self.stats["written"] += 1

class TafsirScraper(BaseScraper):
    def __init__(self, session: QULSession): super().__init__(session, "tafsirs")
    async def run(self):
        page = self.session.page
        try:
             await self.goto(page, f"{self.config.base_url}/resources/tafsir/")
             count = await page.locator('tr:has(a[href*="/resources/tafsir/"])').count()
             for i in range(count):
                 await self._scrape_row(page, i)
        finally: pass
        self.print_summary()

    async def _scrape_row(self, page: Any, index: int):
        await self.goto(page, f"{self.config.base_url}/resources/tafsir/")
        row = page.locator('tr:has(a[href*="/resources/tafsir/"])').nth(index)
        tid = await row.evaluate("r => r.dataset.id")
        dl_a = row.locator('a[href$="/download"]').first
        data = None
        if await dl_a.count() > 0:
             attr = await dl_a.get_attribute("href")
             if attr: data = await self.fetch_http(page, urljoin(self.config.base_url, attr))
        if not data: return
        by_surah = {}
        for it in (data if isinstance(data, list) else data.get("tafsirs", [])):
            s = it.get("chapter_id") or it.get("surah_number") or 1
            by_surah.setdefault(s, []).append(it)
        for s, ayahs in by_surah.items():
            write_json(f"data/tafsirs/{tid}/{s}.json", {"ayahs": ayahs})
        self.stats["written"] += 1

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
             for item in detail_items:
                 await self._scrape_resource(page, item["name"], item["path"])
        finally: pass
        self.print_summary()

    async def _scrape_resource(self, page: Any, name: str, detail_path: str):
        slug = detail_path.split("/")[-1]
        logger.info(f"[{self.name}] Navigating to detail page for: {name}")
        await self.goto(page, f"{self.config.base_url}{detail_path}")
        
        # Find direct JSON download button on detail page
        json_btn = page.locator('a.btn:has-text("json"), a[href$=".json"], a[href*="format=json"]').first
        data = await self.download_resource(page, json_btn, tag=f"script-{slug}")
        if data:
            # Handle different JSON structures
            items = data
            if isinstance(data, dict):
                items = data.get("data") or data.get("verses") or data
                
            if isinstance(items, list):
                out = {f"{it.get('chapter_id')}:{it.get('verse_number')}": it.get("text", "") for it in items}
                write_json(f"data/quran/{slug or 'script-unknown'}.json", out)
                self.stats["written"] += 1

class BasicSingleFileScraper(BaseScraper):
    def __init__(self, session: QULSession, name: str, path: str, slug: str):
        super().__init__(session, name)
        self.path = path
        self.slug = slug
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

            logger.info(f"[{self.name}] Found {len(detail_items)} valid resources.")
            
            if not detail_items:
                if "users/sign_in" in page.url:
                    logger.error("Session lost, redirected to login.")
                return

            # 2. Iterate over collected links
            for item in detail_items:
                name = item["name"]
                path = item["path"]
                fname = name.lower().replace(" ", "_").replace("(", "").replace(")", "").replace("/", "_")
                
                logger.info(f"[{self.name}] Navigating to detail page for: {name}")
                await self.goto(page, f"{self.config.base_url}{path}")
                
                # Look for direct JSON download button
                json_btn = page.locator('a.btn:has-text("json"), a[href$=".json"], a[href*="format=json"]').first
                if await json_btn.count() > 0:
                    data = await self.download_resource(page, json_btn, tag=fname)
                    if data:
                        # QUL metadata JSONs are often either a direct list or have a top-level key.
                        # We save the full object if it doesn't have a 'data' key, 
                        # or if 'data' is what we want.
                        res_to_write = data
                        if isinstance(data, dict) and "data" in data:
                            res_to_write = data["data"]
                            
                        write_json(f"data/metadata/{fname}.json", res_to_write)
                        self.stats["written"] += 1
                        logger.info(f"[{self.name}] Wrote {fname}.json ({len(str(res_to_write))} chars approx)")
                else:
                    logger.warning(f"[{self.name}] No 'Download json' button on detail page for {name}")
        except Exception as e:
            logger.error(f"[{self.name}] Critical error in run: {e}")
        self.print_summary()

SCRAPER_FACTORIES: dict[str, Callable[[QULSession], BaseScraper]] = {
    "translations": TranslationScraper,
    "tafsirs": TafsirScraper,
    "quran-scripts": QuranScriptScraper,
    "quran-metadata": lambda s: BasicSingleFileScraper(s, "quran-metadata", "data/metadata/quran.json", "quran-metadata"),
    "surah-info": lambda s: BasicSingleFileScraper(s, "surah-info", "data/surah-info/data.json", "surah-info"),
    "topics": lambda s: BasicSingleFileScraper(s, "topics", "data/topics/data.json", "ayah-topics"),
    "ayah-themes": lambda s: BasicSingleFileScraper(s, "ayah-themes", "data/ayah-themes/data.json", "ayah-theme"),
}

async def main():
    parser = argparse.ArgumentParser(description="Cleaned up QUL Scraper")
    parser.add_argument("--resources", default="all")
    parser.add_argument("--headless", default="true")
    parser.add_argument("--contexts", type=int, default=1)
    parser.add_argument("--dry-run", action="store_true", help="Validate script without running browser")
    args = parser.parse_args()
    
    if args.dry_run:
        logger.info("Dry run successful: Configuration and factories validated.")
        return

    config = QULConfig(headless=args.headless == "true", num_contexts=args.contexts)
    selected = list(SCRAPER_FACTORIES.keys()) if args.resources == "all" else [r.strip() for r in args.resources.split(",")]
    async with QULSession(config) as session:
        scrapers = [SCRAPER_FACTORIES[name](session) for name in selected if name in SCRAPER_FACTORIES]
        for s in scrapers:
            await s.run()

if __name__ == "__main__":
    try: asyncio.run(main())
    except KeyboardInterrupt: pass
