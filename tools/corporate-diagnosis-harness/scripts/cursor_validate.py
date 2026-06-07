#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Cursor Agent — 추출 JSON 스키마·재무 정합성 검증."""
from __future__ import annotations

import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)

from harness import schema  # noqa: E402


def main() -> int:
    if len(sys.argv) != 2:
        print("사용법: python scripts/cursor_validate.py <extracted.json>", file=sys.stderr)
        return 2

    path = sys.argv[1]
    with open(path, encoding="utf-8") as f:
        data = json.load(f)

    try:
        schema.validate_extracted(data)
    except ValueError as error:
        print(f"[실패] 스키마: {error}", file=sys.stderr)
        return 1

    warnings = schema.sanity_check_financials(data)
    print("[OK] 추출 JSON 스키마 통과")
    if warnings:
        print("[경고]")
        for warning in warnings:
            print(f"  - {warning}")
    else:
        print("[경고] 없음")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
