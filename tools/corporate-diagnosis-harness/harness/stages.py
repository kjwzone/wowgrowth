# -*- coding: utf-8 -*-
"""
기업경영진단 파이프라인 단계 정의
=================================
각 단계는 Stage 를 상속한다. LLM 단계와 결정적 단계가 명확히 구분된다.

    ingest(D) → extract(LLM) → validate_input(D) → calculate(D)
              → commentary(LLM) → render(D) → qa(D)

(D)=Deterministic. 계산·검증·렌더는 전부 결정적이며 기존 검증엔진을 재사용한다.
"""
from __future__ import annotations
import json
import os
import re
import sys

# 엔진(검증 완료) 재사용
_ENGINE_DIR = os.path.join(os.path.dirname(__file__), "..", "engine")
sys.path.insert(0, os.path.abspath(_ENGINE_DIR))
from financial_diagnosis import run as engine_run          # noqa: E402
from build_xlsx import build_workbook                       # noqa: E402

from .core import Stage, StageKind, Context                 # noqa: E402
from .llm import LLMClient, Doc                             # noqa: E402
from . import schema                                        # noqa: E402

_PROMPT_DIR = os.path.join(os.path.dirname(__file__), "..", "prompts")
_TEMPLATE = os.path.join(os.path.dirname(__file__), "..", "examples", "input_template.json")


def _load_prompt(name: str) -> str:
    with open(os.path.join(_PROMPT_DIR, name), encoding="utf-8") as f:
        return f.read()


def _strip_json(text: str) -> dict:
    """모델 출력에서 JSON 본문만 안전 파싱(코드펜스/잡설 제거)."""
    t = text.strip()
    t = re.sub(r"^```(?:json)?\s*|\s*```$", "", t, flags=re.MULTILINE).strip()
    start, end = t.find("{"), t.rfind("}")
    if start == -1 or end == -1:
        raise ValueError(f"JSON 객체를 찾지 못함: {text[:120]!r}")
    return json.loads(t[start:end + 1])


# ---------------------------------------------------------------------------
class IngestStage(Stage):
    """업로드된 서류 경로를 첨부 객체로 변환(결정적)."""
    name = "ingest"
    kind = StageKind.DETERMINISTIC
    produces = ("docs",)

    def run(self, ctx: Context) -> None:
        paths = ctx.get("doc_paths", [])
        docs = [Doc.from_path(p) for p in paths]
        ctx.put("docs", docs)


class ExtractStage(Stage):
    """서류 → 구조화 JSON (LLM). 키 없으면 mock 라우트가 처리."""
    name = "extract"
    kind = StageKind.LLM
    requires = ("docs",)
    produces = ("extracted",)
    retries = 2

    def __init__(self, client: LLMClient):
        self.client = client

    def run(self, ctx: Context) -> None:
        with open(_TEMPLATE, encoding="utf-8") as f:
            schema_text = f.read()
        prompt = _load_prompt("extract.md").format(schema=schema_text)
        # 미리 추출된 입력을 직접 주입한 경우(예: --input) 모델 호출 생략
        if ctx.get("preset_extracted") is not None:
            ctx.put("extracted", ctx.get("preset_extracted"))
            return
        raw = self.client.complete(system="JSON 추출기", user=prompt, docs=ctx.get("docs"))
        ctx.put("extracted", _strip_json(raw))

    def ensure(self, ctx: Context) -> None:
        # 출력 계약: 엔진 입력 스키마를 만족해야 함 (위반 시 재시도 유발)
        schema.validate_extracted(ctx.get("extracted"))


class ValidateInputStage(Stage):
    """엔진 입력 정합성 검증 + 경고 수집(결정적)."""
    name = "validate_input"
    kind = StageKind.DETERMINISTIC
    requires = ("extracted",)
    produces = ("warnings",)

    def run(self, ctx: Context) -> None:
        data = ctx.get("extracted")
        schema.validate_extracted(data)            # 계약 재확인(치명적)
        warns = schema.sanity_check_financials(data)  # 경고(비치명적)
        ctx.put("warnings", warns)


class CalculateStage(Stage):
    """검증엔진 실행 — 모든 비율·세금·주식가치 결정적 산출."""
    name = "calculate"
    kind = StageKind.DETERMINISTIC
    requires = ("extracted",)
    produces = ("result",)

    def run(self, ctx: Context) -> None:
        ctx.put("result", engine_run(ctx.get("extracted")))


class CommentaryStage(Stage):
    """진단 코멘트 생성 (LLM) + 그라운딩 가드."""
    name = "commentary"
    kind = StageKind.LLM
    requires = ("result",)
    produces = ("commentary",)
    retries = 2

    def __init__(self, client: LLMClient, strict_grounding: bool = False):
        self.client = client
        self.strict = strict_grounding

    def run(self, ctx: Context) -> None:
        result = ctx.get("result")
        if ctx.get("preset_commentary") is not None:
            comment = ctx.get("preset_commentary")
        else:
            prompt = _load_prompt("commentary.md").format(result=json.dumps(result, ensure_ascii=False))
            raw = self.client.complete(system="재무 분석가", user=prompt)
            comment = _strip_json(raw)
        # 그라운딩 검사: 계산결과에 없는 숫자 인용 여부
        joined = " ".join(str(v) for v in comment.values())
        viol = schema.grounding_violations(joined, result)
        ctx.put("grounding_flags", viol)
        if self.strict and viol:
            raise ValueError(f"그라운딩 위반(엄격모드): 근거없는 숫자 {viol}")
        ctx.put("commentary", comment)


class RenderStage(Stage):
    """결과 → xlsx 진단서(결정적). 기존 build_workbook 재사용."""
    name = "render"
    kind = StageKind.DETERMINISTIC
    requires = ("result",)
    produces = ("output_path",)

    def run(self, ctx: Context) -> None:
        result = dict(ctx.get("result"))
        if ctx.get("commentary"):
            result["llm_commentary"] = ctx.get("commentary")
        out = ctx.get("out_path", "report.xlsx")
        build_workbook(result, out)
        ctx.put("output_path", out)


class QAStage(Stage):
    """최종 점검: 핵심 산출물 존재·경고/플래그 요약(결정적)."""
    name = "qa"
    kind = StageKind.DETERMINISTIC
    requires = ("result", "output_path")
    produces = ("qa_report",)

    def run(self, ctx: Context) -> None:
        result = ctx.get("result")
        ratios = result.get("ratios") or {}
        report = {
            "xlsx_exists": os.path.exists(ctx.get("output_path")),
            "n_ratio_years": len(ratios),
            "stock_value_won": (result.get("tax_valuation") or {}).get("주당평가액"),
            "external_data": result.get("external_data"),
            "input_warnings": ctx.get("warnings", []),
            "grounding_flags": ctx.get("grounding_flags", []),
        }
        ctx.put("qa_report", report)
