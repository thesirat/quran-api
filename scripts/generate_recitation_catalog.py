"""Generate data/audio/recitations.json from data/recitations/<id>/ directories."""
from __future__ import annotations

import json
import re
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
RECITATIONS_DIR = REPO_ROOT / "data" / "recitations"
OUTPUT_PATH = REPO_ROOT / "data" / "audio" / "recitations.json"


def _camel_to_words(s: str) -> str:
    """Convert camelCase to space-separated lowercase words."""
    return re.sub(r"([a-z])([A-Z])", r"\1 \2", s).lower().replace("_", " ")


def _titleize(s: str) -> str:
    skip = {"al", "al-", "ar", "as", "w", "and", "with", "bin", "ibn"}
    words = s.split()
    return " ".join(w.capitalize() if i == 0 or w not in skip else w for i, w in enumerate(words))


def _extract_name_from_url(url: str) -> tuple[str | None, str | None]:
    """Extract reciter name and style from known audio CDN URL patterns."""
    # tarteel.ai/quran/surah/<reciter>/<style>/mp3/...
    m = re.search(r"tarteel\.ai/quran/surah/([^/]+)/([^/]+)/", url)
    if m:
        reciter = _camel_to_words(m.group(1))
        style = m.group(2).replace("_", " ")
        return reciter, style if style != "mp3" else None

    # tarteel.ai/quran/surah/<reciter>/NNN.mp3
    m = re.search(r"tarteel\.ai/quran/surah/([^/]+)/\d+\.mp3", url)
    if m:
        return _camel_to_words(m.group(1)), None

    # tarteel.ai/quran/<reciter>/...
    m = re.search(r"tarteel\.ai/quran/([^/]+)/", url)
    if m and m.group(1) != "surah":
        return _camel_to_words(m.group(1)), None

    # quranicaudio.com/quran/<reciter>/...
    m = re.search(r"quranicaudio\.com/quran/([^/]+)", url)
    if m:
        return m.group(1).replace("_", " "), None

    # quranicaudio.com/qdc/<reciter>/<style>/...
    m = re.search(r"quranicaudio\.com/qdc/([^/]+)/([^/]+)", url)
    if m:
        return m.group(1).replace("_", " "), m.group(2).replace("_", " ")

    # everyayah.com/data/<reciter>/...
    m = re.search(r"everyayah\.com/data/([^/]+)", url)
    if m:
        return m.group(1).replace("_", " "), None

    return None, None


def _get_info_from_ayah_json(rid_dir: Path) -> tuple[str, bool] | None:
    """Extract reciter info from ayah-recitation-*.json files."""
    ayah_files = list(rid_dir.glob("ayah-recitation-*.json"))
    if not ayah_files:
        return None

    fname = ayah_files[0].stem  # without .json
    name = fname.replace("ayah-recitation-", "").replace("-", " ")
    # Strip "hafs NNN" suffix but keep style (murattal/mujawwad)
    name = re.sub(r"\s+hafs\s+\d+$", "", name)
    name = re.sub(r"\s+recitation$", "", name)

    # Extract style and format as "Name (style)"
    style_match = re.search(r"\b(murattal|mujawwad)\b", name)
    if style_match:
        style = style_match.group(1)
        name = re.sub(r"\s*" + style + r"\s*", " ", name).strip()
        name = f"{_titleize(name)} ({style})"
    else:
        name = _titleize(name.strip())

    with open(ayah_files[0], encoding="utf-8") as f:
        data = json.load(f)
    first = next(iter(data.values()), {})
    has_seg = isinstance(first.get("segments"), list) and len(first.get("segments", [])) > 0
    return name, has_seg


def _get_info_from_surah_json(rid_dir: Path) -> tuple[str, bool] | None:
    """Extract reciter info from surah.json + audio URL."""
    surah_file = rid_dir / "surah.json"
    if not surah_file.exists():
        return None

    with open(surah_file, encoding="utf-8") as f:
        data = json.load(f)
    first = next(iter(data.values()), {})
    url = first.get("audio_url", "")

    reciter, style = _extract_name_from_url(url)
    if reciter:
        name = _titleize(reciter)
        if style and style not in ("mp3",):
            name = f"{name} ({style})"
    else:
        name = f"Recitation {rid_dir.name}"

    seg_file = rid_dir / "segments.json"
    has_seg = seg_file.exists() and seg_file.stat().st_size > 10
    return name, has_seg


def build_catalog() -> list[dict]:
    catalog = []
    for entry in sorted(RECITATIONS_DIR.iterdir()):
        if not entry.is_dir() or not entry.name.isdigit():
            continue

        info = _get_info_from_ayah_json(entry) or _get_info_from_surah_json(entry)
        if not info:
            continue

        name, has_seg = info
        catalog.append({
            "id": int(entry.name),
            "reciter": name,
            "name": name,
            "segments_count": 1 if has_seg else 0,
        })

    return sorted(catalog, key=lambda x: x["id"])


def main() -> None:
    if not RECITATIONS_DIR.exists():
        print(f"No recitations directory at {RECITATIONS_DIR}")
        return

    catalog = build_catalog()
    with_seg = sum(1 for c in catalog if c["segments_count"] > 0)
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(catalog, f, ensure_ascii=False, indent=2)
    print(f"Wrote {len(catalog)} recitations ({with_seg} with timestamps) → {OUTPUT_PATH.relative_to(REPO_ROOT)}")


if __name__ == "__main__":
    main()
