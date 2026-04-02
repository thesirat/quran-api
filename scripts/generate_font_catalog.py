#!/usr/bin/env python3
"""Write data/fonts/catalog.json for remote data mode (GitHub raw, R2, etc.)."""

from __future__ import annotations

import json
import sys
from pathlib import Path


def main() -> int:
    root = Path(__file__).resolve().parent.parent
    fonts_dir = root / "data" / "fonts"
    if not fonts_dir.is_dir():
        print("No data/fonts directory — skipping catalog", file=sys.stderr)
        return 0

    rows: list[dict] = []
    for child in sorted(fonts_dir.iterdir(), key=lambda p: p.name):
        if not child.is_dir() or not child.name.isdigit():
            continue
        manifest_path = child / "manifest.json"
        detail_url: str | None = None
        files_from_manifest: list[str] | None = None
        if manifest_path.is_file():
            try:
                m = json.loads(manifest_path.read_text(encoding="utf-8"))
            except (json.JSONDecodeError, OSError):
                m = {}
            if isinstance(m, dict):
                du = m.get("detail_url")
                if isinstance(du, str):
                    detail_url = du
                raw_files = m.get("files")
                if isinstance(raw_files, list):
                    files_from_manifest = [str(x) for x in raw_files if x]

        if files_from_manifest:
            files = sorted(files_from_manifest)
        else:
            names: list[str] = []
            try:
                for f in child.rglob("*"):
                    if not f.is_file():
                        continue
                    rel = f.relative_to(child).as_posix()
                    if rel == "manifest.json":
                        continue
                    names.append(rel)
            except OSError:
                names = []
            files = sorted(names)

        row: dict = {"id": child.name, "files": files}
        if detail_url:
            row["detail_url"] = detail_url
        rows.append(row)

    out = fonts_dir / "catalog.json"
    out.write_text(json.dumps(rows, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {out} ({len(rows)} font dirs)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
