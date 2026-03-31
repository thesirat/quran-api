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
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from utils import fetch_json, write_json, parallel_download

# ---------------------------------------------------------------------------
# QUL API base
# ---------------------------------------------------------------------------
QUL_API = "https://qul.tarteel.ai/api/v1"
QUL_CDN = "https://static-cdn.tarteel.ai/qul"

# Known QUL resource type slugs (from resources portal)
RESOURCE_TYPES = {
    "quran-script": "quran_scripts",
    "translation": "translations",
    "tafsir": "tafsirs",
    "recitation": "recitations",
    "word-translation": "word_translations",
    "mushaf": "mushafs",
}


def _qul_resources(resource_type: str) -> list[dict]:
    """Fetch catalog for a QUL resource type."""
    try:
        data = fetch_json(f"{QUL_API}/resources/{resource_type}?page_size=500")
        return data.get("results", data) if isinstance(data, dict) else data
    except Exception as exc:
        print(f"  ⚠ Could not fetch QUL resources/{resource_type}: {exc}")
        return []


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

def sync_quran_scripts() -> None:
    print("\n[1/9] Quran scripts …")
    resources = _qul_resources("quran-script")
    for r in resources:
        slug = r.get("slug", "")
        name = SCRIPT_SLUG_MAP.get(slug, slug.replace("quran-", ""))
        dl_url = r.get("file") or r.get("download_url")
        if not dl_url:
            continue
        try:
            data = fetch_json(dl_url)
            # Normalise to { verse_key: text }
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


# ---------------------------------------------------------------------------
# Verse metadata
# ---------------------------------------------------------------------------
def sync_verse_meta() -> None:
    print("\n[2/9] Verse metadata …")
    # QUL exposes verses endpoint
    try:
        meta: dict = {}
        page = 1
        while True:
            resp = fetch_json(f"{QUL_API}/verses?page={page}&page_size=300&fields=verse_key,verse_number,page_number,juz_number,hizb_number,rub_el_hizb_number,ruku_number,manzil_number,words_count,sajdah_number,sajdah_type")
            items = resp.get("verses", resp.get("results", []))
            if not items:
                break
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
            if not resp.get("meta", {}).get("next_page"):
                break
            page += 1
        write_json("data/verses/meta.json", meta)
        print(f"  ✓ data/verses/meta.json  ({len(meta):,} verses)")
    except Exception as exc:
        print(f"  ⚠ verse meta: {exc}")


# ---------------------------------------------------------------------------
# Words (Arabic)
# ---------------------------------------------------------------------------
def sync_words_arabic() -> None:
    print("\n[3/9] Words (Arabic) …")
    try:
        words: dict = {}
        page = 1
        while True:
            resp = fetch_json(
                f"{QUL_API}/words?page={page}&page_size=500"
                "&fields=location,text_uthmani,text_indopak,code_v1,code_v2,position,page_number,line_number,char_type_name"
            )
            items = resp.get("words", resp.get("results", []))
            if not items:
                break
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
            if not resp.get("meta", {}).get("next_page"):
                break
            page += 1
        write_json("data/words/arabic.json", words)
        print(f"  ✓ data/words/arabic.json  ({len(words):,} words)")
    except Exception as exc:
        print(f"  ⚠ words arabic: {exc}")


# ---------------------------------------------------------------------------
# Translations (verse-level)
# ---------------------------------------------------------------------------
def sync_translations() -> None:
    print("\n[4/9] Translations …")
    try:
        catalog_raw = fetch_json(f"{QUL_API}/resources/translations?page_size=500")
        catalog_items = catalog_raw.get("translations", catalog_raw.get("results", []))
    except Exception as exc:
        print(f"  ⚠ translation catalog: {exc}")
        return

    catalog = []
    for t in catalog_items:
        catalog.append({
            "id": t["id"],
            "name": t.get("name") or t.get("translated_name", {}).get("name"),
            "language": t.get("language_name"),
            "author": t.get("author_name"),
            "direction": t.get("direction", "ltr"),
        })
    write_json("data/translations/index.json", catalog)
    print(f"  ✓ data/translations/index.json  ({len(catalog)} entries)")

    for entry in catalog:
        tid = entry["id"]
        try:
            out: dict = {}
            page = 1
            while True:
                resp = fetch_json(f"{QUL_API}/quran/translations/{tid}?page={page}&page_size=300")
                items = resp.get("translations", resp.get("results", []))
                if not items:
                    break
                for item in items:
                    key = item.get("verse_key") or f"{item.get('chapter_id')}:{item.get('verse_number')}"
                    out[key] = {"text": item.get("text", "")}
                    if item.get("footnotes"):
                        out[key]["footnotes"] = item["footnotes"]
                if not resp.get("meta", {}).get("next_page"):
                    break
                page += 1
            if out:
                write_json(f"data/translations/{tid}.json", out)
        except Exception as exc:
            print(f"  ⚠ translation {tid}: {exc}")
    print(f"  ✓ {len(catalog)} translation files written")


# ---------------------------------------------------------------------------
# Tafsirs
# ---------------------------------------------------------------------------
def sync_tafsirs() -> None:
    print("\n[5/9] Tafsirs …")
    try:
        catalog_raw = fetch_json(f"{QUL_API}/resources/tafsirs?page_size=500")
        catalog_items = catalog_raw.get("tafsirs", catalog_raw.get("results", []))
    except Exception as exc:
        print(f"  ⚠ tafsir catalog: {exc}")
        return

    catalog = []
    for t in catalog_items:
        catalog.append({
            "id": t["id"],
            "name": t.get("name") or t.get("translated_name", {}).get("name"),
            "language": t.get("language_name"),
            "author": t.get("author_name"),
            "type": t.get("type", "detailed"),
        })
    write_json("data/tafsirs/index.json", catalog)
    print(f"  ✓ data/tafsirs/index.json  ({len(catalog)} entries)")

    for entry in catalog:
        tid = entry["id"]
        for surah in range(1, 115):
            try:
                resp = fetch_json(f"{QUL_API}/quran/tafsirs/{tid}?chapter_number={surah}")
                ayahs = resp.get("tafsirs", resp.get("data", []))
                if ayahs:
                    write_json(f"data/tafsirs/{tid}/{surah}.json", {"ayahs": ayahs})
            except Exception:
                pass  # sparse coverage is expected
    print(f"  ✓ tafsir files written under data/tafsirs/")


# ---------------------------------------------------------------------------
# Word-by-word translations
# ---------------------------------------------------------------------------
def sync_word_translations() -> None:
    print("\n[6/9] Word translations …")
    try:
        catalog_raw = fetch_json(f"{QUL_API}/resources/word-translations?page_size=100")
        wt_list = catalog_raw.get("word_translations", catalog_raw.get("results", []))
    except Exception as exc:
        print(f"  ⚠ word translation catalog: {exc}")
        return

    for wt in wt_list:
        wid = wt["id"]
        lang = wt.get("language_name", str(wid))
        try:
            out: dict = {}
            page = 1
            while True:
                resp = fetch_json(f"{QUL_API}/quran/word-translations/{wid}?page={page}&page_size=1000")
                items = resp.get("word_translations", resp.get("results", []))
                if not items:
                    break
                for item in items:
                    loc = item.get("location") or item.get("word_key")
                    if loc:
                        out[loc] = item.get("text", "")
                if not resp.get("meta", {}).get("next_page"):
                    break
                page += 1
            if out:
                write_json(f"data/words/translations/{lang}.json", out)
                print(f"  ✓ data/words/translations/{lang}.json  ({len(out):,} words)")
        except Exception as exc:
            print(f"  ⚠ word translation {wid}/{lang}: {exc}")


# ---------------------------------------------------------------------------
# Morphology / Grammar
# ---------------------------------------------------------------------------
def sync_morphology() -> None:
    print("\n[7/9] QUL morphology/grammar …")
    try:
        out: dict = {}
        page = 1
        while True:
            resp = fetch_json(
                f"{QUL_API}/grammar/words?page={page}&page_size=1000"
                "&fields=location,pos,root,lemma,stem"
            )
            items = resp.get("words", resp.get("results", []))
            if not items:
                break
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
            if not resp.get("meta", {}).get("next_page"):
                break
            page += 1
        write_json("data/morphology/qul.json", out)
        print(f"  ✓ data/morphology/qul.json  ({len(out):,} records)")
    except Exception as exc:
        print(f"  ⚠ QUL morphology: {exc}")


# ---------------------------------------------------------------------------
# Topics
# ---------------------------------------------------------------------------
def sync_topics() -> None:
    print("\n[8/9] Topics …")
    try:
        topics: dict = {}
        page = 1
        while True:
            resp = fetch_json(f"{QUL_API}/topics?page={page}&page_size=500&include_verse_keys=true")
            items = resp.get("topics", resp.get("results", []))
            if not items:
                break
            for t in items:
                slug = t.get("slug") or str(t.get("id"))
                topics[slug] = {
                    "name": t.get("name"),
                    "verse_keys": t.get("verse_keys", []),
                }
            if not resp.get("meta", {}).get("next_page"):
                break
            page += 1
        write_json("data/topics/data.json", topics)
        print(f"  ✓ data/topics/data.json  ({len(topics):,} topics)")
    except Exception as exc:
        print(f"  ⚠ topics: {exc}")


# ---------------------------------------------------------------------------
# Recitations + Segmented audio timestamps
# ---------------------------------------------------------------------------
def sync_audio() -> None:
    print("\n[9/9] Recitations + audio segments …")
    try:
        catalog_raw = fetch_json(f"{QUL_API}/resources/recitations?page_size=500")
        rec_list = catalog_raw.get("recitations", catalog_raw.get("results", []))
    except Exception as exc:
        print(f"  ⚠ recitation catalog: {exc}")
        return

    catalog = []
    for r in rec_list:
        catalog.append({
            "id": r["id"],
            "name": r.get("name"),
            "reciter": r.get("reciter_name"),
            "style": r.get("style"),
            "segments_count": r.get("segments_count", 0),
            "files_count": r.get("files_count"),
            "relative_path": r.get("relative_path"),
            "audio_format": r.get("audio_format", "mp3"),
        })
    write_json("data/audio/recitations.json", catalog)
    print(f"  ✓ data/audio/recitations.json  ({len(catalog)} reciters)")

    segmented = [r for r in catalog if r.get("segments_count", 0) > 0]
    print(f"  Fetching segments for {len(segmented)} segmented reciters …")
    for rec in segmented:
        rid = rec["id"]
        try:
            segments: dict = {}
            page = 1
            while True:
                resp = fetch_json(
                    f"{QUL_API}/recitations/{rid}/audio_files?page={page}&page_size=300"
                )
                items = resp.get("audio_files", resp.get("results", []))
                if not items:
                    break
                for af in items:
                    key = af.get("verse_key") or f"{af.get('chapter_id')}:{af.get('verse_number')}"
                    if af.get("segments"):
                        segments[key] = af["segments"]
                if not resp.get("meta", {}).get("next_page"):
                    break
                page += 1
            if segments:
                write_json(f"data/audio/segments/{rid}.json", segments)
        except Exception as exc:
            print(f"  ⚠ segments recitation {rid}: {exc}")
    print(f"  ✓ audio segments written under data/audio/segments/")


# ---------------------------------------------------------------------------
# Mushaf page layouts
# ---------------------------------------------------------------------------
def sync_mushaf() -> None:
    print("\n[bonus] Mushaf page layouts …")
    try:
        # Use the default approved Mushaf (id=1 = Medina Mushaf)
        pages: dict = {}
        for p in range(1, 605):
            try:
                resp = fetch_json(f"{QUL_API}/mushaf_pages/{p}")
                pages[str(p)] = {
                    "verse_mapping": resp.get("verse_mapping"),
                    "lines_count": resp.get("lines_count"),
                    "first_verse": resp.get("first_verse_id"),
                    "last_verse": resp.get("last_verse_id"),
                    "words_count": resp.get("words_count"),
                }
            except Exception:
                pass
        write_json("data/mushaf/pages.json", pages)
        print(f"  ✓ data/mushaf/pages.json  ({len(pages)} pages)")
    except Exception as exc:
        print(f"  ⚠ mushaf pages: {exc}")


# ---------------------------------------------------------------------------
# Pause marks
# ---------------------------------------------------------------------------
def sync_pause_marks() -> None:
    print("\n[bonus] Pause marks …")
    try:
        marks: dict = {}
        page = 1
        while True:
            resp = fetch_json(f"{QUL_API}/pause_marks?page={page}&page_size=1000")
            items = resp.get("pause_marks", resp.get("results", []))
            if not items:
                break
            for pm in items:
                key = pm.get("word_key") or pm.get("location")
                if key:
                    marks[key] = pm.get("mark", "")
            if not resp.get("meta", {}).get("next_page"):
                break
            page += 1
        write_json("data/morphology/pause-marks.json", marks)
        print(f"  ✓ data/morphology/pause-marks.json  ({len(marks):,} marks)")
    except Exception as exc:
        print(f"  ⚠ pause marks: {exc}")


# ---------------------------------------------------------------------------
# Mutashabihat
# ---------------------------------------------------------------------------
def sync_mutashabihat() -> None:
    print("\n[bonus] Mutashabihat …")
    try:
        pairs = []
        page = 1
        while True:
            resp = fetch_json(
                f"{QUL_API}/morphology_matching_verses?page={page}&page_size=500&approved=true"
            )
            items = resp.get("results", resp if isinstance(resp, list) else [])
            if not items:
                break
            for item in items:
                pairs.append({
                    "verse_key": item.get("verse_key"),
                    "matched_key": item.get("matched_verse_key"),
                    "score": item.get("score"),
                    "coverage": item.get("coverage"),
                    "matched_word_positions": item.get("matched_word_positions"),
                })
            if not (resp.get("meta", {}).get("next_page") if isinstance(resp, dict) else False):
                break
            page += 1
        write_json("data/mutashabihat/data.json", pairs)
        print(f"  ✓ data/mutashabihat/data.json  ({len(pairs):,} pairs)")
    except Exception as exc:
        print(f"  ⚠ mutashabihat: {exc}")


def main() -> None:
    sync_quran_scripts()
    sync_verse_meta()
    sync_words_arabic()
    sync_translations()
    sync_tafsirs()
    sync_word_translations()
    sync_morphology()
    sync_topics()
    sync_audio()
    sync_mushaf()
    sync_pause_marks()
    sync_mutashabihat()
    print("\n✓ QUL sync complete.")


if __name__ == "__main__":
    main()
