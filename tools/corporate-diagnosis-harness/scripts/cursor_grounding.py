#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Cursor Agent — 코멘트 그라운딩 가드 검사."""
from __future__ import annotations

import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)

from harness import schema  # noqa: E402

COMMENTARY_KEYS = ("overview", "stability", "profitability", "funding", "tax", "summary")


def main() -> int:
    if len(sys.argv) != 3:
        print(
            "사용법: python scripts/cursor_grounding.py <result.json> <commentary.json>",
            file=sys.stderr,
        )
        return 2

    with open(sys.argv[1], encoding="utf-8") as f:
        result = json.load(f)
    with open(sys.argv[2], encoding="utf-8") as f:
        commentary = json.load(f)

    missing = [key for key in COMMENTARY_KEYS if key not in commentary]
    if missing:
        print(f"[실패] commentary 필수 키 누락: {missing}", file=sys.stderr)
        return 1

    joined = " ".join(str(commentary[key]) for key in COMMENTARY_KEYS)
    violations = schema.grounding_violations(joined, result)

    if violations:
        print("[실패] 그라운딩 위반 — 계산결과에 없는 숫자:")
        for value in violations:
            print(f"  - {value}")
        return 1

    print("[OK] 그라운딩 검사 통과")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
