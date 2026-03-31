"""Shared utilities: concurrent HTTP downloader, retry, progress, path safety."""
from __future__ import annotations

import json
import os
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from typing import Any, Callable
from urllib.parse import urlparse

import requests
from tqdm import tqdm

SESSION = requests.Session()
SESSION.headers.update({"User-Agent": "quran-api-sync/1.0"})

REPO_ROOT = Path(__file__).resolve().parent.parent


def safe_path(rel: str | Path) -> Path:
    """Resolve a relative path under REPO_ROOT, raising on traversal."""
    target = (REPO_ROOT / rel).resolve()
    if not str(target).startswith(str(REPO_ROOT)):
        raise ValueError(f"Path traversal detected: {rel}")
    return target


def fetch(url: str, retries: int = 3, timeout: int = 60) -> requests.Response:
    """GET with exponential back-off retry."""
    for attempt in range(retries):
        try:
            r = SESSION.get(url, timeout=timeout)
            r.raise_for_status()
            return r
        except requests.RequestException as exc:
            if attempt == retries - 1:
                raise
            wait = 2 ** attempt
            print(f"  ↻ retry {attempt+1}/{retries} for {url} ({exc}) — waiting {wait}s")
            time.sleep(wait)
    raise RuntimeError("unreachable")


def fetch_json(url: str, **kwargs: Any) -> Any:
    return fetch(url, **kwargs).json()


def write_json(rel: str | Path, data: Any, indent: int | None = None) -> None:
    path = safe_path(rel)
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=indent, separators=(",", ":") if indent is None else None)


def read_json(rel: str | Path) -> Any:
    path = safe_path(rel)
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def parallel_download(
    tasks: list[tuple[str, str | Path]],
    workers: int = 16,
    desc: str = "Downloading",
) -> list[tuple[str, str | Path, Exception | None]]:
    """
    Download a list of (url, dest_path) pairs concurrently.
    Returns list of (url, dest, error_or_None).
    """
    results = []

    def _dl(url: str, dest: str | Path) -> tuple[str, str | Path, Exception | None]:
        try:
            resp = fetch(url)
            path = safe_path(dest)
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(resp.content)
            return url, dest, None
        except Exception as exc:
            return url, dest, exc

    with ThreadPoolExecutor(max_workers=workers) as pool:
        futures = {pool.submit(_dl, url, dest): (url, dest) for url, dest in tasks}
        with tqdm(total=len(futures), desc=desc, unit="file") as bar:
            for future in as_completed(futures):
                results.append(future.result())
                bar.update(1)

    errors = [(u, d, e) for u, d, e in results if e]
    if errors:
        for url, dest, err in errors:
            print(f"  ✗ {url} → {err}")
        print(f"  {len(errors)} / {len(tasks)} downloads failed.")

    return results
