#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
기업경영진단 하네스 CLI
=======================
세 가지 실행 모드

1) 실서류 + 실모델 (ANTHROPIC_API_KEY 필요)
   python run.py --docs 사업자등록증.pdf 주주명부.pdf 재무제표.pdf --out 진단서.xlsx

2) 이미 추출된 입력 JSON 으로 실행(모델 추출 건너뜀; 계산/렌더 검증용)
   python run.py --input examples/sample_input.json --out 진단서.xlsx --no-commentary

3) 키 없이 배선 검증(Mock)
   python run.py --mock --input examples/sample_input.json --out 진단서.xlsx

공통 옵션
   --no-commentary   : 코멘트(LLM) 단계 생략
   --strict          : 그라운딩 위반 시 코멘트 단계 실패 처리
   --trace trace.json: 실행 트레이스 저장

4) Cursor Agent 모드 (LLM 단계는 에이전트, 계산/렌더는 본 CLI)
   python run.py --input _workspace/corporate-diagnosis/01_extracted.json \\
     --commentary-file _workspace/corporate-diagnosis/02_commentary.json \\
     --out _workspace/corporate-diagnosis/report.xlsx --mock
"""
from __future__ import annotations
import argparse
import json
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from harness.core import Context                    # noqa: E402
from harness.pipeline import build_pipeline         # noqa: E402
from harness.llm import AnthropicClient, MockClient  # noqa: E402


def _mock_client(preset: dict | None):
    """추출 라우트는 preset JSON 을, 코멘트 라우트는 결과 기반 더미를 반환."""
    def commentary(_user: str) -> str:
        return json.dumps({
            "overview": "본 코멘트는 Mock 모드 산출물입니다.",
            "stability": "계산결과의 안정성 지표를 근거로 한 서술이 들어갑니다.",
            "profitability": "수익성 지표 서술.",
            "funding": "자금조달 진단 서술.",
            "tax": "세무진단은 상증법 보충적 평가 기준 자체 추정치입니다.",
            "summary": "외부 데이터(동종평균·신용등급)는 N/A 로 처리되었습니다.",
        }, ensure_ascii=False)
    routes = [("진단 코멘트", commentary), ("재무 분석가", commentary)]
    if preset is not None:
        routes.insert(0, ("JSON 만 출력", json.dumps(preset, ensure_ascii=False)))
    return MockClient(routes)


def main() -> int:
    ap = argparse.ArgumentParser(description="기업경영진단 하네스")
    ap.add_argument("--docs", nargs="*", default=[], help="서류 파일 경로(pdf/png/jpg)")
    ap.add_argument("--input", help="미리 추출된 입력 JSON(모델 추출 생략)")
    ap.add_argument("--out", default="report.xlsx", help="출력 xlsx 경로")
    ap.add_argument("--mock", action="store_true", help="Mock LLM 사용(키 불필요)")
    ap.add_argument("--model", default="claude-opus-4-8")
    ap.add_argument("--no-commentary", action="store_true")
    ap.add_argument("--strict", action="store_true", help="그라운딩 엄격모드")
    ap.add_argument("--trace", help="트레이스 JSON 저장 경로")
    ap.add_argument("--commentary-file", help="Cursor Agent가 작성한 코멘트 JSON(LLM 단계 생략)")
    ap.add_argument(
        "--cursor",
        action="store_true",
        help="Cursor Agent 모드: extract/commentary는 파일·에이전트 산출물만 사용(API 호출 없음)",
    )
    args = ap.parse_args()

    preset = None
    if args.input:
        with open(args.input, encoding="utf-8") as f:
            preset = json.load(f)

    preset_commentary = None
    if args.commentary_file:
        with open(args.commentary_file, encoding="utf-8") as f:
            preset_commentary = json.load(f)

    if args.cursor and preset is None:
        print("[중단] --cursor 모드는 --input(01_extracted.json)이 필요합니다.", file=sys.stderr)
        return 2

    if args.mock or args.cursor:
        client = _mock_client(preset)
    else:
        client = AnthropicClient(model=args.model)

    pipe = build_pipeline(
        client,
        with_commentary=not args.no_commentary,
        strict_grounding=args.strict,
    )

    ctx = Context()
    ctx.put("doc_paths", args.docs)
    ctx.put("out_path", args.out)
    if preset is not None:
        ctx.put("preset_extracted", preset)
    if preset_commentary is not None:
        ctx.put("preset_commentary", preset_commentary)

    try:
        pipe.run(ctx)
    except Exception as e:  # noqa: BLE001
        print(f"\n[중단] {type(e).__name__}: {e}")
        if args.trace:
            _save_trace(ctx, args.trace)
        return 1

    print("\n=== QA 리포트 ===")
    print(json.dumps(ctx.get("qa_report"), ensure_ascii=False, indent=2))
    print(f"\n[완료] 진단서 → {ctx.get('output_path')}")
    if args.trace:
        _save_trace(ctx, args.trace)
    return 0


def _save_trace(ctx: Context, path: str) -> None:
    with open(path, "w", encoding="utf-8") as f:
        json.dump({"trace": ctx.trace_dict(), "qa": ctx.get("qa_report")},
                  f, ensure_ascii=False, indent=2)
    print(f"[트레이스] {path}")


if __name__ == "__main__":
    raise SystemExit(main())
