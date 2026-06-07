#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Cursor Agent — calculate 단계만 실행해 result.json 저장."""
from __future__ import annotations

import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENGINE_DIR = os.path.join(ROOT, "engine")
sys.path.insert(0, ROOT)
sys.path.insert(0, ENGINE_DIR)

from financial_diagnosis import run as engine_run  # noqa: E402
from harness import schema  # noqa: E402


def main() -> int:
    if len(sys.argv) != 3:
        print(
            "사용법: python scripts/cursor_calculate.py <extracted.json> <result.json>",
            file=sys.stderr,
        )
        return 2

    with open(sys.argv[1], encoding="utf-8") as f:
        extracted = json.load(f)

    schema.validate_extracted(extracted)
    result = engine_run(extracted)

    with open(sys.argv[2], "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    stock = (result.get("tax_valuation") or {}).get("주당평가액")
    print(f"[OK] result 저장 → {sys.argv[2]} (주당평가액: {stock})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
