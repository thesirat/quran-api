"""
Sync data from Quranic Universal Library (QUL) — qul.tarteel.ai/resources/.
License: MIT (Tarteel Inc.)

QUL exposes a resources API that lists downloadable datasets.
Each resource has a JSON export URL we can fetch directly.

Outputs:
  data/quran/{script}.json              verse_key → text  (uthmani, indopak, etc.)
  data/verses/meta.json                 verse_key → { page, juz, hizb, ruku, manzil, words_count, sajdah }
  data/words/arabic.json                word_key  → { text, position, page, line, code_v1, code_v2 }
  data/words/translations/{lang}.json   word_key  → text
  data/morphology/qul.json              word_key  → { pos, root, lemma, stem }
  data/morphology/pause-marks.json      word_key  → mark symbol
  data/translations/index.json          translation catalog
  data/translations/{id}.json           verse_key → { text, footnotes? }
  data/tafsirs/index.json               tafsir catalog
  data/tafsirs/{id}/{surah}.json        grouped tafsir ayahs
  data/audio/recitations.json           recitation catalog
  data/audio/segments/{id}.json         verse_key → word timing array
  data/topics/data.json                 topic_slug → { name, verse_keys }
  data/mutashabihat/data.json           list of similar phrase pairs
  data/mushaf/pages.json                page_number → { verse_mapping, lines_count, ... }
"""
from __future__ import annotations

import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from typing import Any

sys.path.insert(0, str(Path(__file__).parent))
from utils import fetch_json, write_json, parallel_download  # noqa: E402

# ---------------------------------------------------------------------------
# QUL API base
# ---------------------------------------------------------------------------
QUL_API = "https://qul.tarteel.ai/api/v1"
QUL_CDN = "https://static-cdn.tarteel.ai/qul"

RESOURCE_TYPES = {
    "quran-script": "quran_scripts",
    "translation": "translations",
    "tafsir": "tafsirs",
    "recitation": "recitations",
    "word-translation": "word_translations",
    "mushaf": "mushafs",
}


def _qul_resources(resource_type: str) -> list[dict]:
    try:
        data = fetch_json(f"{QUL_API}/resources/{resource_type}?page_size=500")
        return data.get("results", data) if isinstance(data, dict) else data
    except Exception as exc:
        print(f"  ⚠ Could not fetch QUL resources/{resource_type}: {exc}")
        return []


# ---------------------------------------------------------------------------
# Shared pagination helper
# ---------------------------------------------------------------------------

def _fetch_all_pages(url_template: str, items_key: str, workers: int = 20) -> list[dict]:
    """
    Fetch page 1 to learn the total, then fetch all remaining pages in parallel.
    url_template must contain a '{page}' placeholder.
    """
    first = fetch_json(url_template.format(page=1))
    items = first.get(items_key, first.get("results", []))
    meta = first.get("meta", {})
    total_pages = meta.get("total_pages") or 1
    if meta.get("total_count") and not meta.get("total_pages"):
        # Derive total pages from page_size in URL
        import re
        m = re.search(r"page_size=(\d+)", url_template)
        page_size = int(m.group(1)) if m else 300
        total_pages = -(-meta["total_count"] // page_size)  # ceiling division

    if total_pages <= 1:
        return items

    print(f"    {total_pages} pages — fetching {total_pages - 1} remaining in parallel …")

    def _get_page(p: int) -> list[dict]:
        try:
            resp = fetch_json(url_template.format(page=p))
            return resp.get(items_key, resp.get("results", []))
        except Exception as exc:
            print(f"  ⚠ page {p}: {exc}")
            return []

    with ThreadPoolExecutor(max_workers=min(workers, total_pages - 1)) as pool:
        futures = {pool.submit(_get_page, p): p for p in range(2, total_pages + 1)}
        for fut in as_completed(futures):
            items.extend(fut.result())

    return items


# ---------------------------------------------------------------------------
# Quran scripts (text editions)
# ---------------------------------------------------------------------------
SCRIPT_SLUG_MAP = {
    "quran-uthmani-hafs": "uthmani",
    "quran-simple": "simple",
    "quran-indopak": "indopak",
    "quran-uthmani-tajweed": "tajweed",
    "quran-qpc-hafs": "qpc-hafs",
}


def _fetch_and_write_script(r: dict) -> None:
    slug = r.get("slug", "")
    name = SCRIPT_SLUG_MAP.get(slug, slug.replace("quran-", ""))
    dl_url = r.get("file") or r.get("download_url")
    if not dl_url:
        return
    try:
        data = fetch_json(dl_url)
        if isinstance(data, list):
            out = {f"{v['chapter_id']}:{v['verse_number']}": v.get("text", "") for v in data}
        elif isinstance(data, dict) and "data" in data:
            out = data["data"]
        else:
            out = data
        write_json(f"data/quran/{name}.json", out)
        print(f"  ✓ data/quran/{name}.json  ({len(out):,} verses)")
    except Exception as exc:
        print(f"  ⚠ script {slug}: {exc}")


def sync_quran_scripts() -> None:
    print("\n[1/9] Quran scripts …")
    resources = _qul_resources("quran-script")
    with ThreadPoolExecutor(max_workers=min(10, len(resources) or 1)) as pool:
        list(pool.map(_fetch_and_write_script, resources))


# ---------------------------------------------------------------------------
# Verse metadata
# ---------------------------------------------------------------------------
_VERSE_META_URL = (
    f"{QUL_API}/verses?page={{page}}&page_size=300"
    "&fields=verse_key,verse_number,page_number,juz_number,hizb_number,"
    "rub_el_hizb_number,ruku_number,manzil_number,words_count,sajdah_number,sajdah_type"
)


def sync_verse_meta() -> None:
    print("\n[2/9] Verse metadata …")
    try:
        items = _fetch_all_pages(_VERSE_META_URL, "verses", workers=10)
        meta: dict = {}
        for v in items:
            key = v.get("verse_key") or f"{v['chapter_id']}:{v['verse_number']}"
            meta[key] = {
                "page": v.get("page_number"),
                "juz": v.get("juz_number"),
                "hizb": v.get("hizb_number"),
                "rub_el_hizb": v.get("rub_el_hizb_number"),
                "ruku": v.get("ruku_number"),
                "manzil": v.get("manzil_number"),
                "words_count": v.get("words_count"),
                "sajdah": v.get("sajdah_type") if v.get("sajdah_number") else None,
            }
        write_json("data/verses/meta.json", meta)
        print(f"  ✓ data/verses/meta.json  ({len(meta):,} verses)")
    except Exception as exc:
        print(f"  ⚠ verse meta: {exc}")


# ---------------------------------------------------------------------------
# Words (Arabic)
# ---------------------------------------------------------------------------
_WORDS_URL = (
    f"{QUL_API}/words?page={{page}}&page_size=500"
    "&fields=location,text_uthmani,text_indopak,code_v1,code_v2,position,page_number,line_number,char_type_name"
)


def sync_words_arabic() -> None:
    print("\n[3/9] Words (Arabic) …")
    try:
        items = _fetch_all_pages(_WORDS_URL, "words", workers=15)
        words: dict = {}
        for w in items:
            loc = w.get("location") or w.get("word_key")
            if not loc:
                continue
            words[loc] = {
                "text": w.get("text_uthmani", ""),
                "text_indopak": w.get("text_indopak"),
                "code_v1": w.get("code_v1"),
                "code_v2": w.get("code_v2"),
                "position": w.get("position"),
                "page": w.get("page_number"),
                "line": w.get("line_number"),
                "type": w.get("char_type_name"),
            }
        write_json("data/words/arabic.json", words)
        print(f"  ✓ data/words/arabic.json  ({len(words):,} words)")
    except Exception as exc:
        print(f"  ⚠ words arabic: {exc}")


# ---------------------------------------------------------------------------
# Translations (verse-level)
# ---------------------------------------------------------------------------

def _fetch_translation(entry: dict) -> tuple[int, dict | None]:
    tid = entry["id"]
    try:
        items = _fetch_all_pages(
            f"{QUL_API}/quran/translations/{tid}?page={{page}}&page_size=300",
            "translations",
            workers=5,
        )
        out: dict = {}
        for item in items:
            key = item.get("verse_key") or f"{item.get('chapter_id')}:{item.get('verse_number')}"
            out[key] = {"text": item.get("text", "")}
            if item.get("footnotes"):
                out[key]["footnotes"] = item["footnotes"]
        return tid, out if out else None
    except Exception as exc:
        print(f"  ⚠ translation {tid}: {exc}")
        return tid, None


def sync_translations() -> None:
    print("\n[4/9] Translations …")
    try:
        catalog_raw = fetch_json(f"{QUL_API}/resources/translations?page_size=500")
        catalog_items = catalog_raw.get("translations", catalog_raw.get("results", []))
    except Exception as exc:
        print(f"  ⚠ translation catalog: {exc}")
        return

    catalog = [
        {
            "id": t["id"],
            "name": t.get("name") or t.get("translated_name", {}).get("name"),
            "language": t.get("language_name"),
            "author": t.get("author_name"),
            "direction": t.get("direction", "ltr"),
        }
        for t in catalog_items
    ]
    write_json("data/translations/index.json", catalog)
    print(f"  ✓ data/translations/index.json  ({len(catalog)} entries)")

    from tqdm import tqdm

    written = 0
    with ThreadPoolExecutor(max_workers=20) as pool:
        futures = {pool.submit(_fetch_translation, entry): entry["id"] for entry in catalog}
        with tqdm(total=len(futures), desc="  translations", unit="file") as bar:
            for fut in as_completed(futures):
                tid, out = fut.result()
                if out:
                    write_json(f"data/translations/{tid}.json", out)
                    written += 1
                bar.update(1)
    print(f"  ✓ {written}/{len(catalog)} translation files written")


# ---------------------------------------------------------------------------
# Tafsirs
# ---------------------------------------------------------------------------

MULTILANG_TAFSIR_IDS: list[int] = [
    # Turkish
    306, 258, 484,
    # Indonesian
    41, 260, 503,
    # Persian / Farsi
    263, 485,
    # French
    259,
    # Spanish
    268,
    # Bosnian
    252,
    # Italian
    253,
    # Chinese
    264,
    # Japanese
    265,
    # Hindi
    535,
    # Filipino / Tagalog
    254,
    # Uzbek / Kyrgyz / Azeri / Uyghur / Pashto
    538, 536, 537, 539, 533,
    # South / Southeast Asian
    256, 540, 554, 255, 453, 257, 541, 261,
    # Serbian / Kurdish (additional)
    543, 542,
    # Russian (ensure present)
    170, 307, 262,
]


def _fetch_tafsir_surah(tid: int, surah: int) -> tuple[int, int, list | None]:
    try:
        resp = fetch_json(f"{QUL_API}/quran/tafsirs/{tid}?chapter_number={surah}")
        ayahs = resp.get("tafsirs", resp.get("data", []))
        return tid, surah, ayahs if ayahs else None
    except Exception:
        return tid, surah, None


def sync_tafsirs(ids: list[int] | None = None, workers: int = 20) -> None:
    print("\n[5/9] Tafsirs …")
    try:
        catalog_raw = fetch_json(f"{QUL_API}/resources/tafsirs?page_size=500")
        catalog_items = catalog_raw.get("tafsirs", catalog_raw.get("results", []))
    except Exception as exc:
        print(f"  ⚠ tafsir catalog: {exc}")
        return

    catalog = [
        {
            "id": t["id"],
            "name": t.get("name") or t.get("translated_name", {}).get("name"),
            "language": t.get("language_name"),
            "author": t.get("author_name"),
            "type": t.get("type", "detailed"),
        }
        for t in catalog_items
    ]
    write_json("data/tafsirs/index.json", catalog)
    print(f"  ✓ data/tafsirs/index.json  ({len(catalog)} entries)")

    id_set = set(ids) if ids is not None else None
    target = [e for e in catalog if id_set is None or e["id"] in id_set]
    if id_set:
        missing = id_set - {e["id"] for e in catalog}
        if missing:
            print(f"  ⚠ IDs not found in catalog: {sorted(missing)}")
    print(f"  Fetching {len(target)} tafsir(s) × 114 surahs ({len(target) * 114} requests, {workers} workers) …")

    from tqdm import tqdm

    tasks = [(e["id"], s) for e in target for s in range(1, 115)]
    written = 0

    with ThreadPoolExecutor(max_workers=workers) as pool:
        futures = {pool.submit(_fetch_tafsir_surah, tid, surah): (tid, surah) for tid, surah in tasks}
        with tqdm(total=len(futures), desc="  tafsirs", unit="req") as bar:
            for future in as_completed(futures):
                tid, surah, ayahs = future.result()
                if ayahs:
                    write_json(f"data/tafsirs/{tid}/{surah}.json", {"ayahs": ayahs})
                    written += 1
                bar.update(1)

    print(f"  ✓ {written} tafsir chapter files written under data/tafsirs/")


# ---------------------------------------------------------------------------
# Word-by-word translations
# ---------------------------------------------------------------------------

def _fetch_word_translation(wt: dict) -> None:
    wid = wt["id"]
    lang = wt.get("language_name", str(wid))
    try:
        items = _fetch_all_pages(
            f"{QUL_API}/quran/word-translations/{wid}?page={{page}}&page_size=1000",
            "word_translations",
            workers=5,
        )
        out: dict = {
            (item.get("location") or item.get("word_key")): item.get("text", "")
            for item in items
            if item.get("location") or item.get("word_key")
        }
        if out:
            write_json(f"data/words/translations/{lang}.json", out)
            print(f"  ✓ data/words/translations/{lang}.json  ({len(out):,} words)")
    except Exception as exc:
        print(f"  ⚠ word translation {wid}/{lang}: {exc}")


def sync_word_translations() -> None:
    print("\n[6/9] Word translations …")
    try:
        catalog_raw = fetch_json(f"{QUL_API}/resources/word-translations?page_size=100")
        wt_list = catalog_raw.get("word_translations", catalog_raw.get("results", []))
    except Exception as exc:
        print(f"  ⚠ word translation catalog: {exc}")
        return

    with ThreadPoolExecutor(max_workers=min(10, len(wt_list) or 1)) as pool:
        list(pool.map(_fetch_word_translation, wt_list))

    # Write catalog index so the API can discover available languages
    index = []
    for wt in wt_list:
        lang = wt.get("language_name", str(wt.get("id", "")))
        direction = wt.get("direction") or ("rtl" if wt.get("language_name", "").lower() in ("arabic", "urdu", "persian", "farsi") else "ltr")
        index.append({
            "lang": lang,
            "id": wt.get("id"),
            "name": wt.get("name") or wt.get("translated_name", {}).get("name") or lang,
            "direction": direction,
        })
    if index:
        write_json("data/words/translations/index.json", index)
        print(f"  ✓ data/words/translations/index.json  ({len(index)} languages)")


# ---------------------------------------------------------------------------
# Morphology / Grammar
# ---------------------------------------------------------------------------
_MORPH_URL = (
    f"{QUL_API}/grammar/words?page={{page}}&page_size=1000"
    "&fields=location,pos,root,lemma,stem"
)


def sync_morphology() -> None:
    print("\n[7/9] QUL morphology/grammar …")
    try:
        items = _fetch_all_pages(_MORPH_URL, "words", workers=10)
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
        print(f"  ⚠ QUL morphology: {exc}")


# ---------------------------------------------------------------------------
# Topics
# ---------------------------------------------------------------------------
_TOPICS_URL = f"{QUL_API}/topics?page={{page}}&page_size=500&include_verse_keys=true"


def sync_topics() -> None:
    print("\n[8/9] Topics …")
    try:
        items = _fetch_all_pages(_TOPICS_URL, "topics", workers=10)
        topics: dict = {
            (t.get("slug") or str(t.get("id"))): {
                "name": t.get("name"),
                "verse_keys": t.get("verse_keys", []),
            }
            for t in items
        }
        write_json("data/topics/data.json", topics)
        print(f"  ✓ data/topics/data.json  ({len(topics):,} topics)")
    except Exception as exc:
        print(f"  ⚠ topics: {exc}")


# ---------------------------------------------------------------------------
# Recitations + Segmented audio timestamps
# ---------------------------------------------------------------------------

def _fetch_recitation_segments(rec: dict) -> None:
    rid = rec["id"]
    try:
        items = _fetch_all_pages(
            f"{QUL_API}/recitations/{rid}/audio_files?page={{page}}&page_size=300",
            "audio_files",
            workers=5,
        )
        segments: dict = {
            (af.get("verse_key") or f"{af.get('chapter_id')}:{af.get('verse_number')}"): af["segments"]
            for af in items
            if af.get("segments")
        }
        if segments:
            write_json(f"data/audio/segments/{rid}.json", segments)
    except Exception as exc:
        print(f"  ⚠ segments recitation {rid}: {exc}")


def sync_audio() -> None:
    print("\n[9/9] Recitations + audio segments …")
    try:
        catalog_raw = fetch_json(f"{QUL_API}/resources/recitations?page_size=500")
        rec_list = catalog_raw.get("recitations", catalog_raw.get("results", []))
    except Exception as exc:
        print(f"  ⚠ recitation catalog: {exc}")
        return

    catalog = [
        {
            "id": r["id"],
            "name": r.get("name"),
            "reciter": r.get("reciter_name"),
            "style": r.get("style"),
            "segments_count": r.get("segments_count", 0),
            "files_count": r.get("files_count"),
            "relative_path": r.get("relative_path"),
            "audio_format": r.get("audio_format", "mp3"),
        }
        for r in rec_list
    ]
    write_json("data/audio/recitations.json", catalog)
    print(f"  ✓ data/audio/recitations.json  ({len(catalog)} reciters)")

    segmented = [r for r in catalog if r.get("segments_count", 0) > 0]
    print(f"  Fetching segments for {len(segmented)} segmented reciters …")
    with ThreadPoolExecutor(max_workers=min(10, len(segmented) or 1)) as pool:
        list(pool.map(_fetch_recitation_segments, segmented))
    print("  ✓ audio segments written under data/audio/segments/")


# ---------------------------------------------------------------------------
# Mushaf page layouts  (604 pages — parallelised with ThreadPoolExecutor)
# ---------------------------------------------------------------------------

def _fetch_mushaf_page(p: int) -> tuple[int, dict | None]:
    try:
        resp = fetch_json(f"{QUL_API}/mushaf_pages/{p}")
        return p, {
            "verse_mapping": resp.get("verse_mapping"),
            "lines_count": resp.get("lines_count"),
            "first_verse": resp.get("first_verse_id"),
            "last_verse": resp.get("last_verse_id"),
            "words_count": resp.get("words_count"),
        }
    except Exception:
        return p, None


def sync_mushaf() -> None:
    print("\n[bonus] Mushaf page layouts …")
    try:
        pages: dict = {}
        with ThreadPoolExecutor(max_workers=30) as pool:
            futures = {pool.submit(_fetch_mushaf_page, p): p for p in range(1, 605)}
            for fut in as_completed(futures):
                p, data = fut.result()
                if data:
                    pages[str(p)] = data
        write_json("data/mushaf/pages.json", pages)
        print(f"  ✓ data/mushaf/pages.json  ({len(pages)} pages)")
    except Exception as exc:
        print(f"  ⚠ mushaf pages: {exc}")


# ---------------------------------------------------------------------------
# Pause marks
# ---------------------------------------------------------------------------
_PAUSE_URL = f"{QUL_API}/pause_marks?page={{page}}&page_size=1000"


def sync_pause_marks() -> None:
    print("\n[bonus] Pause marks …")
    try:
        items = _fetch_all_pages(_PAUSE_URL, "pause_marks", workers=10)
        marks: dict = {
            (pm.get("word_key") or pm.get("location")): pm.get("mark", "")
            for pm in items
            if pm.get("word_key") or pm.get("location")
        }
        write_json("data/morphology/pause-marks.json", marks)
        print(f"  ✓ data/morphology/pause-marks.json  ({len(marks):,} marks)")
    except Exception as exc:
        print(f"  ⚠ pause marks: {exc}")


# ---------------------------------------------------------------------------
# Mutashabihat
# ---------------------------------------------------------------------------
_MUTASH_URL = f"{QUL_API}/morphology_matching_verses?page={{page}}&page_size=500&approved=true"


def sync_mutashabihat() -> None:
    print("\n[bonus] Mutashabihat …")
    try:
        items = _fetch_all_pages(_MUTASH_URL, "results", workers=10)
        pairs = [
            {
                "verse_key": item.get("verse_key"),
                "matched_key": item.get("matched_verse_key"),
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


def main() -> None:
    import argparse

    parser = argparse.ArgumentParser(description="Sync data from Quranic Universal Library (QUL)")
    parser.add_argument("--tafsirs-only", action="store_true")
    parser.add_argument("--multilang-tafsirs", action="store_true")
    parser.add_argument("--tafsir-ids", metavar="ID,...")
    parser.add_argument("--workers", type=int, default=20, metavar="N")
    parser.add_argument("--verse-meta", action="store_true",
                        help="Sync only verse metadata → data/verses/meta.json")
    parser.add_argument("--quran-scripts", action="store_true",
                        help="Sync only Quran text scripts → data/quran/*.json")
    args = parser.parse_args()

    tafsir_ids: list[int] | None = None
    if args.tafsir_ids:
        tafsir_ids = [int(x.strip()) for x in args.tafsir_ids.split(",") if x.strip()]
    elif args.multilang_tafsirs:
        tafsir_ids = MULTILANG_TAFSIR_IDS

    tafsirs_only = args.tafsirs_only or args.multilang_tafsirs or bool(args.tafsir_ids)

    t0 = time.time()
    if args.verse_meta:
        sync_verse_meta()
    elif args.quran_scripts:
        sync_quran_scripts()
    elif tafsirs_only:
        sync_tafsirs(ids=tafsir_ids, workers=args.workers)
    else:
        sync_quran_scripts()
        sync_verse_meta()
        sync_words_arabic()
        sync_translations()
        sync_tafsirs(ids=tafsir_ids, workers=args.workers)
        sync_word_translations()
        sync_morphology()
        sync_topics()
        sync_audio()
        sync_mushaf()
        sync_pause_marks()
        sync_mutashabihat()

    print(f"\n✓ QUL sync complete. ({time.time() - t0:.0f}s)")


if __name__ == "__main__":
    main()
