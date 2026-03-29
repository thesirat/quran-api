#!/usr/bin/env python3
"""
Download assets.

Default origins (same as typical app defaults):
  https://static.quranwbw.com/data/v4  — JSON, fonts metadata paths in app
  https://audios.quranwbw.com/words    — per-word MP3 (--word-audio)

Mirror layout under --output (no vendor name in defaults):
  {--static-subpath}/...  — static JSON tree (default data/v4, same as upstream CDN paths)
  {--static-subpath}/tafsirs/... — with --tafsir
  {--audio-subpath}/...   — per-word MP3s with --word-audio (default audio/words)

Override --static-subpath e.g. api/v1/data/v4 if your host serves files under that prefix;
set PUBLIC_STATIC_DATA_BASE to match (e.g. https://example.com/api/v1/data/v4).

Tafsir chapters mirrored on the static CDN only (--tafsir), not third-party CDNs.

Does not fetch: jsDelivr/spa5k, everyayah.com, GitHub Pages, or other non-quranwbw hosts.

Sync point: resource IDs / versions should match apps/web-assirat/src/data/options.ts
and staticMirrorEditions (tafsir slugs).

Usage:
  python3 scripts/download_data.py -o ./cdn-mirror
  python3 scripts/download_data.py -o ./cdn-mirror --tafsir
  python3 scripts/download_data.py -o ./public --static-subpath api/v1/data/v4
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from typing import Iterable

# ---------------------------------------------------------------------------
# Defaults — QuranWBW domains only (see apps/web-assirat/src/config/site.ts)
# ---------------------------------------------------------------------------
DEFAULT_STATIC_BASE = "https://static.quranwbw.com/data/v4"
DEFAULT_WORDS_AUDIO_BASE = "https://audios.quranwbw.com/words"

USER_AGENT = "Safari/1.0"


def parse_rel_subpath(label: str, raw: str) -> Path:
    """Relative path only; used under --output."""
    p = Path(raw.strip())
    if not raw.strip() or p == Path("."):
        raise SystemExit(f"{label} must be a non-empty relative path")
    if p.is_absolute():
        raise SystemExit(f"{label} must be relative, got {raw!r}")
    return p


def default_io_workers() -> int:
    """
    Thread count for parallel HTTP downloads (I/O-bound).
    Scales with CPU count but capped so we do not open excessive connections by default.
    """
    n = os.cpu_count() or 4
    return min(64, max(16, n * 8))


def _host_is_quranwbw(netloc: str) -> bool:
    host = netloc.split("@")[-1].split(":")[0].lower()
    return host == "quranwbw.com" or host.endswith(".quranwbw.com")


def assert_quranwbw_http_url(url: str, label: str) -> None:
    parsed = urllib.parse.urlparse(url)
    if parsed.scheme not in ("http", "https"):
        raise SystemExit(f"{label} must be http(s): {url!r}")
    if not _host_is_quranwbw(parsed.netloc):
        raise SystemExit(f"{label} must be a quranwbw.com host (got {parsed.netloc!r}): {url!r}")

# Unique Arabic bundle files: (font_id_on_cdn, version) — from selectableFontTypes inner `id` + `version`
ARABIC_WBW: list[tuple[int, int]] = [
    (1, 5),
    (2, 5),
    (3, 7),
    (5, 5),
    (6, 7),
    (9, 2),
]

# Word translations: (id, version) — selectableWordTranslationsData
WORD_TRANSLATIONS: list[tuple[int, int]] = [
    (1, 4),
    (2, 1),
    (3, 1),
    (4, 1),
    (5, 1),
    (6, 1),
    (7, 1),
    (8, 1),
    (11, 1),
    (12, 1),
    (13, 1),
    (14, 1),
    (15, 1),
    (16, 1),
    (17, 1),
    (18, 1),
    (19, 1),
    (20, 1),
    (21, 1),
    (22, 1),
]

# Word transliterations: (id, version)
WORD_TRANSLITERATIONS: list[tuple[int, int]] = [
    (1, 1),
    (2, 1),
    (3, 1),
    (4, 1),
]

# Verse translations: (resource_id, version) — selectableVerseTranslationsData
VERSE_TRANSLATIONS: list[tuple[int, int]] = [
    (88, 1),
    (161, 1),
    (163, 1),
    (162, 1),
    (213, 1),
    (56, 1),
    (109, 1),
    (86, 1),
    (840, 1),
    (131, 1),
    (20, 1),
    (84, 1),
    (85, 1),
    (95, 1),
    (19, 1),
    (22, 1),
    (203, 1),
    (779, 1),
    (136, 1),
    (31, 1),
    (208, 1),
    (27, 1),
    (122, 1),
    (134, 1),
    (33, 1),
    (141, 1),
    (224, 1),
    (80, 1),
    (37, 1),
    (135, 1),
    (29, 1),
    (79, 1),
    (78, 1),
    (45, 1),
    (238, 1),
    (229, 1),
    (50, 1),
    (133, 1),
    (1, 2),
    (3, 2),
    (57, 2),
    (4, 1),
    (210, 1),
    (77, 1),
    (52, 1),
    (112, 1),
    (124, 1),
    (156, 1),
    (97, 1),
    (234, 1),
    (158, 1),
    (151, 1),
    (54, 1),
    (819, 1),
    (831, 1),
]

# Tafsir JSON on static.quranwbw.com — staticMirrorEditions.ts (quranwbwStatic source)
TAFSIR_QURANWBW_SLUGS: list[str] = [
    "sq-ibn-kathir",
    "sq-al-saddi",
    "ur-tafheem-ul-quran",
]


def tafsir_base_from_static_base(static_base: str) -> str:
    """https://static.quranwbw.com/data/v4 -> .../data/v4/tafsirs"""
    return f"{static_base.rstrip('/')}/tafsirs"


# Fixed paths under static base (websiteSettings.ts, endpoints.ts, morphologyDataUrls)
FIXED_STATIC_PATHS: list[tuple[str, int]] = [
    ("full-quran/uthmani.json", 1),
    ("meta/verseKeyData.json", 2),
    ("meta/keysInJuz.json", 1),
    ("meta/keysInPage.json", 2),
    ("tajweed/tajweed-rules.json", 3),
    ("others/quran-topics.json", 1),
    ("morphology-data/word-verbs.json", 1),
    ("morphology-data/words-with-same-root-keys.json", 3),
    ("morphology-data/word-uthmani-and-roots.json", 1),
    ("morphology-data/exact-words-keys.json", 1),
    ("timestamps/timestamps.json", 2),
]


def collect_static_jobs(static_base: str, static_subpath: Path) -> list[tuple[str, Path]]:
    """Return (url, relative_path_under_output) for all static JSON."""
    base = static_base.rstrip("/")
    root = static_subpath
    jobs: list[tuple[str, Path]] = []

    for path, ver in FIXED_STATIC_PATHS:
        url = f"{base}/{path}?version={ver}"
        jobs.append((url, root / path))

    for fid, ver in ARABIC_WBW:
        name = f"words-data/arabic/{fid}.json"
        jobs.append((f"{base}/{name}?version={ver}", root / name))

    for tid, ver in WORD_TRANSLATIONS:
        name = f"words-data/translations/{tid}.json"
        jobs.append((f"{base}/{name}?version={ver}", root / name))

    for tid, ver in WORD_TRANSLITERATIONS:
        name = f"words-data/transliterations/{tid}.json"
        jobs.append((f"{base}/{name}?version={ver}", root / name))

    for rid, ver in VERSE_TRANSLATIONS:
        name = f"verse-translations/{rid}.json"
        jobs.append((f"{base}/{name}?version={ver}", root / name))

    for ch in range(1, 115):
        path = f"lexicon/word-summaries/{ch}.json"
        jobs.append((f"{base}/{path}?version=2", root / path))

    return jobs


def collect_tafsir_jobs(tafsir_base: str, tafsirs_subpath: Path) -> list[tuple[str, Path]]:
    """Chapters 1–114 for each edition on static CDN .../tafsirs."""
    jobs: list[tuple[str, Path]] = []
    tb = tafsir_base.rstrip("/")
    for slug in TAFSIR_QURANWBW_SLUGS:
        for chapter in range(1, 115):
            url = f"{tb}/{slug}/{chapter}.json"
            jobs.append((url, tafsirs_subpath / slug / f"{chapter}.json"))
    return jobs


def download_one(
    url: str,
    dest: Path,
    timeout: float,
    retries: int,
) -> tuple[str, bool, str]:
    dest.parent.mkdir(parents=True, exist_ok=True)
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    last_err = ""
    for attempt in range(retries + 1):
        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                data = resp.read()
            dest.write_bytes(data)
            return (url, True, "")
        except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError, OSError) as e:
            last_err = str(e)
            if attempt < retries:
                time.sleep(1.5 * (attempt + 1))
    return (url, False, last_err)


def load_word_index_for_audio(static_base: str, timeout: float) -> dict | None:
    """Fetch verseKeyData.json to discover word counts per verse for --word-audio."""
    base = static_base.rstrip("/")
    url = f"{base}/meta/verseKeyData.json?version=2"
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except Exception:
        return None


def collect_word_audio_jobs(
    words_audio_base: str,
    verse_key_data: dict,
    surahs: Iterable[int] | None,
    audio_subpath: Path,
) -> list[tuple[str, Path]]:
    """
    Build per-word MP3 URLs. verse_key_data matches the app: {"1:1": {"words": n, ...}, ...}.
    """
    jobs: list[tuple[str, Path]] = []
    base = words_audio_base.rstrip("/")

    data = verse_key_data.get("data", verse_key_data)
    if not isinstance(data, dict):
        return []

    for verse_key, meta in data.items():
        if not isinstance(verse_key, str) or ":" not in verse_key:
            continue
        parts = verse_key.split(":")
        if len(parts) != 2 or not parts[0].isdigit() or not parts[1].isdigit():
            continue
        ch, v = int(parts[0]), int(parts[1])
        if surahs is not None and ch not in surahs:
            continue
        if not isinstance(meta, dict):
            continue
        w = meta.get("words")
        if not isinstance(w, int) or w < 1:
            continue
        cpad = str(ch).zfill(3)
        vpad = str(v).zfill(3)
        for wi in range(1, w + 1):
            wpad = str(wi).zfill(3)
            rel_audio = f"{ch}/{cpad}_{vpad}_{wpad}.mp3"
            url = f"{base}/{rel_audio}?version=2"
            jobs.append((url, audio_subpath / rel_audio))
    return jobs


def main() -> int:
    p = argparse.ArgumentParser(
        description="Download QuranWBW-hosted data only (static.quranwbw.com, audios.quranwbw.com)."
    )
    p.add_argument(
        "-o",
        "--output",
        type=Path,
        default=Path("./cdn-mirror"),
        help="Output directory root (neutral default: ./cdn-mirror)",
    )
    p.add_argument(
        "--static-subpath",
        default="data/v4",
        metavar="REL",
        help="Path under --output for JSON (default data/v4). Example: api/v1/data/v4",
    )
    p.add_argument(
        "--audio-subpath",
        default="audio/words",
        metavar="REL",
        help="Path under --output for --word-audio (default audio/words)",
    )
    p.add_argument(
        "--static-base",
        default=DEFAULT_STATIC_BASE,
        help="Static JSON base (must be *.quranwbw.com), default static.quranwbw.com/data/v4",
    )
    p.add_argument(
        "--workers",
        type=int,
        default=None,
        metavar="N",
        help=f"Parallel download threads (default: auto ≈ {default_io_workers()} on this machine; I/O-bound, try 32–64)",
    )
    p.add_argument("--timeout", type=float, default=120.0)
    p.add_argument("--retries", type=int, default=2)
    p.add_argument("--dry-run", action="store_true", help="Only print job counts")
    p.add_argument(
        "--tafsir",
        action="store_true",
        help="Include tafsir JSON from static CDN (data/v4/tafsirs), 114 chapters × editions",
    )
    p.add_argument(
        "--tafsir-base",
        default="",
        help="Override tafsir root URL (default: {static-base}/tafsirs); must be *.quranwbw.com",
    )
    p.add_argument("--word-audio", action="store_true", help="Download all per-word MP3s from audios.quranwbw.com (huge)")
    p.add_argument(
        "--words-audio-base",
        default=DEFAULT_WORDS_AUDIO_BASE,
        help="Per-word audio base (must be *.quranwbw.com)",
    )
    p.add_argument(
        "--word-audio-surahs",
        type=str,
        default="",
        help="Comma surah numbers for --word-audio only, e.g. 1,2,114 (default: all)",
    )
    args = p.parse_args()
    out: Path = args.output.resolve()

    static_subpath = parse_rel_subpath("--static-subpath", args.static_subpath)
    audio_subpath = parse_rel_subpath("--audio-subpath", args.audio_subpath)

    assert_quranwbw_http_url(args.static_base, "--static-base")
    assert_quranwbw_http_url(args.words_audio_base, "--words-audio-base")

    tafsir_base = args.tafsir_base.strip() or tafsir_base_from_static_base(args.static_base)
    if args.tafsir:
        assert_quranwbw_http_url(tafsir_base, "--tafsir-base")

    jobs = collect_static_jobs(args.static_base, static_subpath)
    if args.tafsir:
        jobs.extend(collect_tafsir_jobs(tafsir_base, static_subpath / "tafsirs"))

    if args.word_audio:
        surahs_set: set[int] | None = None
        if args.word_audio_surahs.strip():
            surahs_set = {int(x.strip()) for x in args.word_audio_surahs.split(",") if x.strip()}
        meta = load_word_index_for_audio(args.static_base, args.timeout)
        if not meta:
            print("Warning: could not load verseKeyData.json; skipping --word-audio", file=sys.stderr)
        else:
            jobs.extend(
                collect_word_audio_jobs(args.words_audio_base, meta, surahs_set, audio_subpath)
            )

    resolved = [(u, out / rel) for u, rel in jobs]

    print(f"Jobs: {len(resolved)}")
    print(f"Output: {out}")
    print(f"Static subpath: {static_subpath.as_posix()}", flush=True)
    if args.word_audio:
        print(f"Audio subpath: {audio_subpath.as_posix()}", flush=True)
    if args.dry_run:
        return 0

    workers = args.workers if args.workers is not None else default_io_workers()
    workers = max(1, workers)

    ok = 0
    fail = 0
    errors: list[str] = []

    # Chunk size: large enough to keep the thread pool busy; bounded so we do not
    # materialize millions of Future objects at once (--word-audio).
    chunk_size = max(workers * 100, 2000)

    print(f"Downloading with {workers} threads (chunks of up to {chunk_size} jobs)", flush=True)

    with ThreadPoolExecutor(max_workers=workers, thread_name_prefix="qwbw-dl") as executor:
        for offset in range(0, len(resolved), chunk_size):
            batch = resolved[offset : offset + chunk_size]
            futures = [
                executor.submit(download_one, url, dest, args.timeout, args.retries)
                for url, dest in batch
            ]
            for fut in as_completed(futures):
                url, success, err = fut.result()
                if success:
                    ok += 1
                    if ok % 500 == 0:
                        print(f"  … {ok} ok", flush=True)
                else:
                    fail += 1
                    errors.append(f"{url} :: {err}")

    print(f"Done. OK={ok} FAIL={fail}")
    if errors:
        err_file = out / "download_errors.txt"
        err_file.write_text("\n".join(errors[:5000]), encoding="utf-8")
        print(f"First failures logged to {err_file} (max 5000 lines)")
    return 1 if fail else 0


if __name__ == "__main__":
    raise SystemExit(main())
