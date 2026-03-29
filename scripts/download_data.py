#!/usr/bin/env python3
"""
Download assets

Font URLs match apps/web-assirat: JSON under {static_base}/..., fonts under {static_base}/fonts/...

Examples:
  python3 scripts/download_data.py
  python3 scripts/download_data.py --fonts
  python3 scripts/download_data.py -o ./mirror --static-subpath data/v4 --fonts-subpath data/v4/fonts --fonts
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

DEFAULT_STATIC_BASE = "https://static.quranwbw.com/data/v4"
DEFAULT_WORDS_AUDIO_BASE = "https://audios.quranwbw.com/words"
USER_AGENT = "Safari/1.0"


def parse_rel_subpath(label: str, raw: str, *, allow_dot: bool = False) -> Path:
    s = raw.strip()
    if not s or s == ".":
        if allow_dot:
            return Path(".")
        raise SystemExit(f"{label} must be a non-empty relative path (or pass allow_dot)")
    p = Path(s)
    if p.is_absolute():
        raise SystemExit(f"{label} must be relative, got {raw!r}")
    return p


def default_io_workers() -> int:
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


def fonts_base_from_static_base(static_base: str) -> str:
    return f"{static_base.rstrip('/')}/fonts"


ARABIC_WBW: list[tuple[int, int]] = [
    (1, 5),
    (2, 5),
    (3, 7),
    (5, 5),
    (6, 7),
    (9, 2),
]

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

WORD_TRANSLITERATIONS: list[tuple[int, int]] = [
    (1, 1),
    (2, 1),
    (3, 1),
    (4, 1),
]

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

TAFSIR_QURANWBW_SLUGS: list[str] = [
    "sq-ibn-kathir",
    "sq-al-saddi",
    "ur-tafheem-ul-quran",
]

# websiteSettings.ts / Bismillah.svelte (unique files, v13) + chapter header (v12)
FONTS_EXTRAS: list[tuple[str, int]] = [
    ("Extras/bismillah/qcf-bismillah-normal.woff2", 13),
    ("Extras/bismillah/QCF_Bismillah_COLOR-Regular.woff2", 13),
    ("Extras/bismillah/IndopakBismillah-Arabic.woff2", 13),
    ("Extras/bismillah/Qcf-nastaleeq-bismillah-normal.woff2", 13),
    ("Extras/bismillah/qcf-bismillah-bold.woff2", 13),
    ("Extras/bismillah/Qcf-nastaleeq-bismillah-bold.woff2", 13),
    ("Extras/bismillah/MisbahBismillah-Arabic.woff2", 13),
    ("Extras/bismillah/QCF_Bismillah_COLOR-Dark-FF-Regular.woff2", 13),
    ("Extras/chapter-headers/NeoHeader_COLOR-Regular.woff2", 12),
]

FONTS_HAFS_V4: list[tuple[str, int, int]] = [
    ("Hafs/KFGQPC-v4", 12, 12),
]


def tafsir_base_from_static_base(static_base: str) -> str:
    return f"{static_base.rstrip('/')}/tafsirs"


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
    base = static_base.rstrip("/")
    root = static_subpath
    jobs: list[tuple[str, Path]] = []

    for path, ver in FIXED_STATIC_PATHS:
        jobs.append((f"{base}/{path}?version={ver}", root / path))

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


def collect_font_jobs(fonts_base: str, fonts_subpath: Path) -> list[tuple[str, Path]]:
    base = fonts_base.rstrip("/")
    root = fonts_subpath
    jobs: list[tuple[str, Path]] = []

    for path, ver in FONTS_EXTRAS:
        jobs.append((f"{base}/{path}?version={ver}", root / path))

    for subpath, ver_norm, ver_color in FONTS_HAFS_V4:
        for page in range(1, 605):
            page_str = str(page).zfill(3)
            p_norm = f"{subpath}/QCF4{page_str}-Regular.woff2"
            jobs.append((f"{base}/{p_norm}?version={ver_norm}", root / p_norm))
            p_color = f"{subpath}/COLRv1/QCF4{page_str}_COLOR-Regular.woff2"
            jobs.append((f"{base}/{p_color}?version={ver_color}", root / p_color))

    return jobs


def collect_tafsir_jobs(tafsir_base: str, tafsirs_subpath: Path) -> list[tuple[str, Path]]:
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
                dest.write_bytes(resp.read())
            return (url, True, "")
        except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError, OSError) as e:
            last_err = str(e)
            if attempt < retries:
                time.sleep(1.5 * (attempt + 1))
    return (url, False, last_err)


def load_word_index_for_audio(static_base: str, timeout: float) -> dict | None:
    url = f"{static_base.rstrip('/')}/meta/verseKeyData.json?version=2"
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
        cpad, vpad = str(ch).zfill(3), str(v).zfill(3)
        for wi in range(1, w + 1):
            wpad = str(wi).zfill(3)
            rel_audio = f"{ch}/{cpad}_{vpad}_{wpad}.mp3"
            jobs.append((f"{base}/{rel_audio}?version=2", audio_subpath / rel_audio))
    return jobs


def main() -> int:
    p = argparse.ArgumentParser(
        description="Download QuranWBW-hosted data (static.quranwbw.com, audios.quranwbw.com)."
    )
    p.add_argument("-o", "--output", type=Path, default=Path("."))
    p.add_argument(
        "--static-subpath",
        default="",
        metavar="REL",
        help="Path under -o for JSON (default: output root). Example: data/v4",
    )
    p.add_argument(
        "--fonts-subpath",
        default="fonts",
        metavar="REL",
        help="Path under -o for --fonts (default: fonts). Example: data/v4/fonts",
    )
    p.add_argument("--audio-subpath", default="audio/words", metavar="REL")
    p.add_argument("--static-base", default=DEFAULT_STATIC_BASE)
    p.add_argument(
        "--fonts-base",
        default="",
        help="Override fonts URL root (default: {--static-base}/fonts)",
    )
    p.add_argument("--workers", type=int, default=None, metavar="N")
    p.add_argument("--timeout", type=float, default=120.0)
    p.add_argument("--retries", type=int, default=2)
    p.add_argument("--dry-run", action="store_true")
    p.add_argument("--tafsir", action="store_true")
    p.add_argument("--fonts", action="store_true")
    p.add_argument("--tafsir-base", default="")
    p.add_argument("--word-audio", action="store_true")
    p.add_argument("--words-audio-base", default=DEFAULT_WORDS_AUDIO_BASE)
    p.add_argument("--word-audio-surahs", type=str, default="")
    args = p.parse_args()

    out: Path = args.output.resolve()
    static_subpath = parse_rel_subpath("--static-subpath", args.static_subpath, allow_dot=True)
    fonts_subpath = parse_rel_subpath("--fonts-subpath", args.fonts_subpath, allow_dot=True)
    audio_subpath = parse_rel_subpath("--audio-subpath", args.audio_subpath)

    assert_quranwbw_http_url(args.static_base, "--static-base")
    assert_quranwbw_http_url(args.words_audio_base, "--words-audio-base")

    fonts_base = (args.fonts_base or "").strip() or fonts_base_from_static_base(args.static_base)
    if args.fonts:
        assert_quranwbw_http_url(fonts_base, "--fonts-base")

    tafsir_base = args.tafsir_base.strip() or tafsir_base_from_static_base(args.static_base)
    if args.tafsir:
        assert_quranwbw_http_url(tafsir_base, "--tafsir-base")

    jobs: list[tuple[str, Path]] = collect_static_jobs(args.static_base, static_subpath)
    if args.tafsir:
        jobs.extend(collect_tafsir_jobs(tafsir_base, static_subpath / "tafsirs"))
    if args.fonts:
        jobs.extend(collect_font_jobs(fonts_base, fonts_subpath))

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
    print(f"Static subpath: {static_subpath.as_posix()!r}")
    if args.fonts:
        print(f"Fonts base URL: {fonts_base}")
        print(f"Fonts subpath: {fonts_subpath.as_posix()!r}")
    if args.dry_run:
        return 0

    workers = max(1, args.workers if args.workers is not None else default_io_workers())
    chunk_size = max(workers * 100, 2000)
    print(f"Downloading with {workers} threads (chunks up to {chunk_size})", flush=True)

    ok = fail = 0
    errors: list[str] = []

    with ThreadPoolExecutor(max_workers=workers, thread_name_prefix="qwbw-dl") as ex:
        for offset in range(0, len(resolved), chunk_size):
            batch = resolved[offset : offset + chunk_size]
            futures = [ex.submit(download_one, url, dest, args.timeout, args.retries) for url, dest in batch]
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