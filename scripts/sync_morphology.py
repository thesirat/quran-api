"""
Sync morphological data from mustafa0x/quran-morphology (corpus.quran.com v0.4).

Downloads the TSV file (~6MB) and converts it to:
  data/morphology/corpus.json   — word key → list of morphological segments
  data/morphology/roots.json    — Arabic root → sorted list of word keys (surah:ayah:word)
  data/morphology/lemmas.json   — lemma → sorted list of word keys
"""
from __future__ import annotations

import re
import sys
import time
from collections import defaultdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from utils import fetch, write_json

TSV_URL = (
    "https://raw.githubusercontent.com/mustafa0x/quran-morphology"
    "/master/quran-morphology.txt"
)

# Feature token regex: KEY:VALUE or plain FLAG
_FEAT_RE = re.compile(r"([A-Z0-9]+):(.+)|([A-Z0-9]+)")


def _parse_features(raw: str) -> dict[str, str | bool]:
    """
    Parse pipe-delimited feature string into a dict.
    E.g. "P|PREF|LEM:ب" → {"type":"P","flags":["PREF"],"lemma":"ب"}
    We flatten into a simple dict.
    """
    feats: dict[str, str | bool] = {}
    for token in raw.split("|"):
        token = token.strip()
        if not token:
            continue
        m = _FEAT_RE.match(token)
        if not m:
            continue
        if m.group(3):          # plain flag e.g. PREF, SUFF, DEF
            feats[m.group(3)] = True
        else:                   # key:value e.g. LEM:اِسم
            key_map = {
                "ROOT": "root", "LEM": "lemma", "SP": "special",
                "VF": "verb_form", "DP": "dep",
            }
            k = key_map.get(m.group(1), m.group(1).lower())
            feats[k] = m.group(2)
    return feats


def _parse_pos(tag: str, feats: dict) -> dict:
    """Expand top-level POS into structured morphological properties."""
    pos_labels = {
        "N": "noun", "PN": "proper_noun", "ADJ": "adjective",
        "IMPN": "imperative_verbal_noun", "PRON": "pronoun",
        "DEM": "demonstrative", "REL": "relative", "T": "time_adverb",
        "LOC": "location_adverb", "V": "verb", "P": "preposition",
        "CONJ": "conjunction", "SUB": "subordinating_conjunction",
        "NEG": "negative_particle", "INT": "intensifier",
        "INTG": "interrogative", "FUT": "future_particle",
        "COND": "conditional", "VOC": "vocative_particle",
        "INL": "quranic_initial", "AMD": "amendment",
        "ANS": "answer_particle", "AVR": "aversion",
        "CERT": "certainty_particle", "CIRC": "circumstantial",
        "COM": "comitative", "EXH": "exhortation",
        "EXL": "explanation", "EXP": "exposition",
        "INC": "inceptive", "INTERJ": "interjection",
        "PREV": "preventive", "PRO": "prohibition",
        "RES": "restriction", "RET": "retraction",
        "REM": "resumption", "SUP": "supplemental",
        "SUR": "surprise", "TRANS": "transition",
    }
    result: dict = {"pos": pos_labels.get(tag, tag.lower())}

    # Gender
    if "M" in feats:
        result["gender"] = "masculine"
    elif "F" in feats:
        result["gender"] = "feminine"

    # Number (S / D / P in the morphology stream)
    # Note: prefix lines use "P|PREF|…" where the leading P is not plural — same key "P" in feats.
    # Only treat P as plural when this segment is not explicitly a prefix/suffix piece.
    if "S" in feats:
        result["number"] = "singular"
    elif "D" in feats:
        result["number"] = "dual"
    elif "P" in feats and not feats.get("PREF") and not feats.get("SUFF"):
        result["number"] = "plural"

    # Case
    case_map = {"NOM": "nominative", "ACC": "accusative", "GEN": "genitive"}
    for k, v in case_map.items():
        if k in feats:
            result["case"] = v
            break

    # State
    if "DEF" in feats:
        result["state"] = "definite"
    elif "INDEF" in feats:
        result["state"] = "indefinite"

    # Verb-specific
    if tag == "V":
        if "PERF" in feats:
            result["aspect"] = "perfect"
        elif "IMPF" in feats:
            result["aspect"] = "imperfect"
        elif "IMPV" in feats:
            result["aspect"] = "imperative"
        if "ACT" in feats:
            result["voice"] = "active"
        elif "PASS" in feats:
            result["voice"] = "passive"
        if "IND" in feats:
            result["mood"] = "indicative"
        elif "SUBJ" in feats:
            result["mood"] = "subjunctive"
        elif "JUS" in feats:
            result["mood"] = "jussive"
        if "1" in feats:
            result["person"] = "first"
        elif "2" in feats:
            result["person"] = "second"
        elif "3" in feats:
            result["person"] = "third"
        if "verb_form" in feats:
            result["verb_form"] = feats["verb_form"]

    # Segment type
    if feats.get("PREF"):
        result["segment_type"] = "prefix"
    elif feats.get("SUFF"):
        result["segment_type"] = "suffix"
    else:
        result["segment_type"] = "stem"

    if "root" in feats:
        result["root"] = feats["root"]
    if "lemma" in feats:
        result["lemma"] = feats["lemma"]

    return result


def parse_tsv(text: str) -> tuple[dict, dict, dict]:
    """
    Returns (corpus, roots_index, lemmas_index).
    corpus: {"1:1:1": {"segments": [...]}}   — 3-part word key
    roots:  {"سمو": ["1:1:1", ...]}
    lemmas: {"اِسم": ["1:1:1", ...]}
    """
    corpus: dict[str, dict] = {}
    roots: dict[str, list[str]] = defaultdict(list)
    lemmas: dict[str, list[str]] = defaultdict(list)

    for raw_line in text.splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#"):
            continue
        cols = line.split("\t")
        if len(cols) < 3:
            continue

        ref, form, pos_tag = cols[0], cols[1], cols[2]
        feat_raw = cols[3] if len(cols) > 3 else ""

        # ref is "S:A:W:SEG" — we group by S:A:W (word key)
        parts = ref.split(":")
        if len(parts) < 3:
            continue
        word_key = f"{parts[0]}:{parts[1]}:{parts[2]}"

        feats = _parse_features(feat_raw)
        seg = {"form": form, **_parse_pos(pos_tag, feats)}

        corpus.setdefault(word_key, {"segments": []})
        corpus[word_key]["segments"].append(seg)

        # Index root and lemma under the word key
        if seg.get("root"):
            if not roots[seg["root"]] or roots[seg["root"]][-1] != word_key:
                roots[seg["root"]].append(word_key)
        if seg.get("lemma"):
            if not lemmas[seg["lemma"]] or lemmas[seg["lemma"]][-1] != word_key:
                lemmas[seg["lemma"]].append(word_key)

    return corpus, dict(roots), dict(lemmas)


def _assert_morphology_not_mojibake(corpus: dict[str, dict]) -> None:
    """
    Fail fast if the TSV was mis-decoded (common when using requests Response.text on
    application/octet-stream): Arabic UTF-8 misread often lands in the CJK Unicode block.
    """
    row = corpus.get("1:1:1")
    if not row:
        return
    segs = row.get("segments") or []
    if not segs:
        return
    form = (segs[0].get("form") or "").strip()
    if not form:
        return
    has_arabic = any(0x0600 <= ord(c) <= 0x06FF for c in form)
    looks_cjk = any(0x4E00 <= ord(c) <= 0x9FFF for c in form)
    if looks_cjk and not has_arabic:
        raise RuntimeError(
            "Morphology sanity check failed: word 1:1:1 'form' looks like CJK mojibake, not Arabic. "
            "Fix: decode the download as UTF-8 (e.g. response.content.decode('utf-8')), not Response.text."
        )


def main() -> None:
    t0 = time.time()
    print("Downloading quran-morphology.txt …")
    # raw.githubusercontent.com serves this as application/octet-stream with no charset.
    # Using Response.text lets requests/chardet pick a wrong encoding and turns Arabic into mojibake
    # (often showing as random CJK). Always decode the UTF-8 bytes explicitly.
    resp = fetch(TSV_URL, timeout=120)
    text = resp.content.decode("utf-8")
    print(f"  {len(text):,} characters downloaded ({time.time() - t0:.1f}s) — parsing …")

    t1 = time.time()
    corpus, roots, lemmas = parse_tsv(text)
    print(f"  {len(corpus):,} word keys  |  {len(roots):,} roots  |  {len(lemmas):,} lemmas  ({time.time() - t1:.1f}s)")

    _assert_morphology_not_mojibake(corpus)

    write_json("data/morphology/corpus.json", corpus)
    write_json("data/morphology/roots.json", roots)
    write_json("data/morphology/lemmas.json", lemmas)
    print("  ✓ data/morphology/corpus.json")
    print("  ✓ data/morphology/roots.json")
    print(f"  ✓ data/morphology/lemmas.json  (total: {time.time() - t0:.0f}s)")


if __name__ == "__main__":
    main()
