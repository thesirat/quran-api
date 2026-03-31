"""
Sync structural metadata and Quran text from Tanzil (tanzil.net).

Downloads:
  - quran-data.js  → data/structure/meta.json
    (surah list + juz/hizb/rub-el-hizb/manzil/ruku/page/sajda boundaries)
  - Uthmani text   → data/quran/tanzil-uthmani.json  (verse_key → text)
  - Simple text    → data/quran/tanzil-simple.json
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from utils import fetch, write_json

# Tanzil provides quran-data.js as a JS object literal; we strip the var declaration.
QURAN_DATA_URL = "https://tanzil.net/res/text/metadata/quran-data.js"
UTHMANI_URL = "https://tanzil.net/pub/download/index.php?quranType=uthmani&outType=txt-2"
SIMPLE_URL = "https://tanzil.net/pub/download/index.php?quranType=simple&outType=txt-2"


def _strip_js_var(text: str) -> str:
    """Strip 'var QuranData = ' prefix and trailing ';' to get raw JS object."""
    text = text.strip()
    text = re.sub(r"^var\s+\w+\s*=\s*", "", text)
    text = text.rstrip(";").strip()
    return text


def _js_to_json(js: str) -> str:
    """
    Convert a JS object literal to valid JSON:
    - quote unquoted keys
    - replace single-quoted strings with double-quoted
    - remove trailing commas
    """
    # quote unquoted keys: word:  →  "word":
    js = re.sub(r"([{,]\s*)([A-Za-z_]\w*)(\s*:)", r'\1"\2"\3', js)
    # single-quoted values → double-quoted
    js = re.sub(r"'([^']*)'", r'"\1"', js)
    # trailing commas before } or ]
    js = re.sub(r",(\s*[}\]])", r"\1", js)
    return js


def parse_quran_data(raw: str) -> dict:
    """Parse the Tanzil quran-data.js into a Python dict."""
    obj_str = _strip_js_var(raw)
    json_str = _js_to_json(obj_str)
    try:
        return json.loads(json_str)
    except json.JSONDecodeError:
        # Fallback: try to eval-style parse (Python ast)
        import ast
        return ast.literal_eval(obj_str)


def parse_text_file(raw: str) -> dict[str, str]:
    """
    Parse a Tanzil plain-text Quran download.
    Format: lines that are either comments (|…) or  'surah|ayah|text'
    Returns {verse_key: text}.
    """
    verses: dict[str, str] = {}
    for line in raw.splitlines():
        line = line.strip()
        if not line or line.startswith("|") or line.startswith("#"):
            continue
        parts = line.split("|", 2)
        if len(parts) == 3:
            s, a, text = parts
            verses[f"{s}:{a}"] = text.strip()
    return verses


def main() -> None:
    print("Downloading quran-data.js from Tanzil …")
    raw_js = fetch(QURAN_DATA_URL, timeout=60).text
    data = parse_quran_data(raw_js)
    write_json("data/structure/meta.json", data)
    print("  ✓ data/structure/meta.json")

    print("Downloading Uthmani text from Tanzil …")
    try:
        uthmani_raw = fetch(UTHMANI_URL, timeout=120).text
        uthmani = parse_text_file(uthmani_raw)
        if uthmani:
            write_json("data/quran/tanzil-uthmani.json", uthmani)
            print(f"  ✓ data/quran/tanzil-uthmani.json  ({len(uthmani):,} verses)")
        else:
            print("  ⚠ Uthmani text download returned no verse data (may require manual download).")
    except Exception as exc:
        print(f"  ⚠ Uthmani text skipped: {exc}")

    print("Downloading Simple text from Tanzil …")
    try:
        simple_raw = fetch(SIMPLE_URL, timeout=120).text
        simple = parse_text_file(simple_raw)
        if simple:
            write_json("data/quran/tanzil-simple.json", simple)
            print(f"  ✓ data/quran/tanzil-simple.json  ({len(simple):,} verses)")
        else:
            print("  ⚠ Simple text download returned no verse data (may require manual download).")
    except Exception as exc:
        print(f"  ⚠ Simple text skipped: {exc}")


if __name__ == "__main__":
    main()
