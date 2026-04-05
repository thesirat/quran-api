import pandas as pd
import requests
import re
import json

# --- 1. REGEX FOR FEATURES ---
_FEAT_RE = re.compile(r"([A-Z0-9]+):(.+)|([A-Z0-9]+)")

def _parse_features(raw: str) -> dict:
    """Parse pipe-delimited feature string into a dict."""
    feats = {}
    for token in raw.split("|"):
        token = token.strip()
        if not token: continue
        m = _FEAT_RE.match(token)
        if not m: continue
        if m.group(3): # Flag
            feats[m.group(3)] = True
        else: # Key:Value
            key_map = {"ROOT": "root", "LEM": "lemma", "SP": "special", "VF": "verb_form", "DP": "dep"}
            k = key_map.get(m.group(1), m.group(1).lower())
            feats[k] = m.group(2)
    return feats

# --- 2. POS PARSER (THE MISSING PIECE) ---
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
    result = {"pos": pos_labels.get(tag, tag.lower())}

    # Gender
    if "M" in feats: result["gender"] = "masculine"
    elif "F" in feats: result["gender"] = "feminine"

    # Number
    if "S" in feats: result["number"] = "singular"
    elif "D" in feats: result["number"] = "dual"
    elif "P" in feats and not feats.get("PREF") and not feats.get("SUFF"):
        result["number"] = "plural"

    # Case
    case_map = {"NOM": "nominative", "ACC": "accusative", "GEN": "genitive"}
    for k, v in case_map.items():
        if k in feats:
            result["case"] = v
            break

    # State
    if "DEF" in feats: result["state"] = "definite"
    elif "INDEF" in feats: result["state"] = "indefinite"

    # Verb-specific
    if tag == "V":
        aspects = {"PERF": "perfect", "IMPF": "imperfect", "IMPV": "imperative"}
        for k, v in aspects.items():
            if k in feats: result["aspect"] = v
        if "ACT" in feats: result["voice"] = "active"
        elif "PASS" in feats: result["voice"] = "passive"

        # Mood & Person
        moods = {"IND": "indicative", "SUBJ": "subjunctive", "JUS": "jussive"}
        for k, v in moods.items():
            if k in feats: result["mood"] = v

        persons = {"1": "first", "2": "second", "3": "third"}
        for k, v in persons.items():
            if k in feats: result["person"] = v

    # Segment type
    result["segment_type"] = "prefix" if feats.get("PREF") else "suffix" if feats.get("SUFF") else "stem"

    if "root" in feats: result["root"] = feats["root"]
    if "lemma" in feats: result["lemma"] = feats["lemma"]

    return result

# --- 3. MAIN FETCH & MERGE ---
def fetch_and_combine_data():
    masaq_url = "https://raw.githubusercontent.com/umarcodes/masaq-quran-morphology-csv/main/MASAQ.csv"
    mustafa_url = "https://raw.githubusercontent.com/mustafa0x/quran-morphology/master/quran-morphology.txt"

    print("📥 Downloading datasets...")
    masaq_df = pd.read_csv(masaq_url, low_memory=False)
    # Clean headers
    masaq_df.columns = masaq_df.columns.str.strip().str.replace('﻿', '')

    print("🏗️ Parsing morphological refinements...")
    mustafa_text = requests.get(mustafa_url).content.decode('utf-8')

    morph_lookup = {}
    for line in mustafa_text.splitlines():
        if not line or line.startswith("#"): continue
        cols = line.split("\t")
        if len(cols) < 4: continue

        loc_key = cols[0]
        pos_tag = cols[2]
        feat_raw = cols[3]

        feats = _parse_features(feat_raw)
        morph_lookup[loc_key] = _parse_pos(pos_tag, feats)

    print("🔗 Merging with MASAQ syntax...")
    combined = []
    for _, row in masaq_df.iterrows():
        try:
            # Using actual MASAQ headers
            s, v, w, seg = int(row['Sura_No']), int(row['Verse_No']), int(row['Word_No']), int(row['Segment_No'])
            key = f"{s}:{v}:{w}:{seg}"

            # Lookup high-fidelity morph data
            morph = morph_lookup.get(key, {"pos": str(row['Morph_Tag']).lower()})

            record = {
                "id": key,
                "form": row['Segmented_Word'],
                "morphology": morph,
                "syntax": {
                    "role_ar": row['Syntactic_Role'],
                    "declinability": row['Invariable_Declinable'],
                    "case_mood": row.get('Case_Mood', ''),
                    "gloss": row.get('Gloss', '')
                }
            }
            combined.append(record)
        except Exception as e:
            continue

    with open("data/morhology/enriched_data.json", "w", encoding="utf-8") as f:
        json.dump(combined, f, ensure_ascii=False, indent=2)

    print(f"✅ Success! Generated {len(combined)} enriched segments.")

if __name__ == "__main__":
    fetch_and_combine_data()