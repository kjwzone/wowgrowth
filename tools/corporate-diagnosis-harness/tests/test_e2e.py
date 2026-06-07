# -*- coding: utf-8 -*-
"""
하네스 엔드투엔드 테스트 (Mock LLM, 키 불필요)
실행: python tests/test_e2e.py
"""
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)

from harness.core import Context, StageContractError      # noqa: E402
from harness.pipeline import build_pipeline                # noqa: E402
from harness.llm import MockClient                         # noqa: E402
from harness import schema                                 # noqa: E402

SAMPLE = os.path.join(ROOT, "examples", "sample_input.json")


def load_sample():
    with open(SAMPLE, encoding="utf-8") as f:
        return json.load(f)


def mock(preset):
    comment = json.dumps({
        "overview": "Mock", "stability": "Mock", "profitability": "Mock",
        "funding": "Mock", "tax": "자체기준 추정치", "summary": "외부데이터 N/A",
    }, ensure_ascii=False)
    return MockClient([
        ("JSON 만 출력", json.dumps(preset, ensure_ascii=False)),
        ("재무 분석가", comment),
    ])


def test_full_pipeline(tmp_out):
    preset = load_sample()
    pipe = build_pipeline(mock(preset), verbose=False)
    ctx = Context()
    ctx.put("doc_paths", [])
    ctx.put("out_path", tmp_out)
    ctx.put("preset_extracted", preset)
    pipe.run(ctx)

    qa = ctx.get("qa_report")
    assert qa["xlsx_exists"], "xlsx 미생성"
    assert qa["n_ratio_years"] >= 1, "비율 미산출"
    assert qa["stock_value_won"] is not None, "주식가치 미산출"
    # 모든 단계 성공 트레이스
    assert all(t["ok"] for t in ctx.trace_dict()), "실패 단계 존재"
    print("✔ test_full_pipeline:", qa["stock_value_won"], "원/주, 비율연도",
          qa["n_ratio_years"], ", 그라운딩플래그", len(qa["grounding_flags"]))


def test_na_policy(tmp_out):
    """외부 데이터가 없는 입력 → 신용등급/동종평균이 N/A 로 처리되어야 함."""
    preset = load_sample()
    preset.pop("credit_rating", None)
    preset.pop("cashflow_grade", None)
    preset.pop("industry_avg", None)
    pipe = build_pipeline(mock(preset), with_commentary=False, verbose=False)
    ctx = Context()
    ctx.put("doc_paths", [])
    ctx.put("out_path", tmp_out)
    ctx.put("preset_extracted", preset)
    pipe.run(ctx)
    ext = ctx.get("qa_report")["external_data"]
    assert "N/A" in str(ext["credit_rating"]), "신용등급 N/A 아님"
    assert "N/A" in str(ext["industry_avg"]), "동종평균 N/A 아님"
    print("✔ test_na_policy: 외부데이터 결측 → N/A 정상 처리")


def test_contract_failure():
    """필수 필드 빠진 추출 → 계약 위반으로 즉시 중단되어야 함."""
    bad = {"company": {}, "shareholders": [], "financials": {},
           "total_shares": 0, "par_value_per_share": 0}
    pipe = build_pipeline(mock(bad), with_commentary=False, verbose=False)
    ctx = Context()
    ctx.put("doc_paths", [])
    ctx.put("out_path", "/tmp/should_not_exist.xlsx")
    ctx.put("preset_extracted", bad)
    try:
        pipe.run(ctx)
    except Exception as e:  # noqa: BLE001
        print("✔ test_contract_failure: 예상대로 중단 →", type(e).__name__)
        return
    raise AssertionError("계약 위반이 통과됨")


def test_grounding_guard():
    """계산결과에 없는 큰 숫자를 코멘트가 인용하면 플래그되어야 함."""
    result = {"ratios": {"2023": {"부채비율": 334.56}}}
    viol = schema.grounding_violations("동종평균은 9999.99 이며 시장규모 12345 억원이다.", result)
    assert "9999.99" in viol and "12345" in viol, f"미탐지: {viol}"
    # 실재 숫자는 통과
    ok = schema.grounding_violations("부채비율은 334.56% 이다.", result)
    assert "334.56" not in ok, f"오탐: {ok}"
    print("✔ test_grounding_guard: 위반탐지", viol)


if __name__ == "__main__":
    out = "/tmp/harness_test_report.xlsx"
    test_full_pipeline(out)
    test_na_policy("/tmp/harness_na_report.xlsx")
    test_contract_failure()
    test_grounding_guard()
    print("\n모든 테스트 통과 ✅  (xlsx:", out, ")")
