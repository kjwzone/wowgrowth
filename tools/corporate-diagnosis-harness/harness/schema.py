# -*- coding: utf-8 -*-
"""
스키마 & 검증 가드
==================
경계 검증을 한 곳에 모은다.

1) validate_extracted(data)   : 추출 단계 출력(=엔진 입력)이 계약을 지키는지
2) sanity_check_financials()  : 재무 항등식(자산=부채+자본 등) 정합성, 경고 수집
3) grounding_violations()     : 코멘트가 계산결과에 없는 '숫자'를 지어냈는지 탐지
                                (= 외부데이터 날조 금지 정책의 코드 가드)
"""
from __future__ import annotations
import re

REQUIRED_TOP = ("company", "shareholders", "financials", "total_shares", "par_value_per_share")
REQUIRED_COMPANY = ("name",)


def validate_extracted(data: dict) -> None:
    """엔진 입력 계약. 위반 시 예외."""
    if not isinstance(data, dict):
        raise ValueError("추출 결과가 dict 가 아닙니다.")
    missing = [k for k in REQUIRED_TOP if k not in data]
    if missing:
        raise ValueError(f"추출 결과 최상위 필드 누락: {missing}")
    comp = data.get("company") or {}
    cmiss = [k for k in REQUIRED_COMPANY if not comp.get(k)]
    if cmiss:
        raise ValueError(f"company 필수 필드 누락: {cmiss}")
    if not isinstance(data.get("shareholders"), list) or not data["shareholders"]:
        raise ValueError("shareholders 는 비어있지 않은 리스트여야 합니다.")
    fin = data.get("financials") or {}
    years = [y for y in fin if re.fullmatch(r"\d{4}", str(y)) and fin[y]]
    if not years:
        raise ValueError("financials 에 유효한 연도 데이터가 하나도 없습니다.")


def sanity_check_financials(data: dict, tol: float = 0.01) -> list[str]:
    """재무 정합성 경고(치명적 아님). 자산=부채+자본, 지분합계≈100% 등."""
    warns: list[str] = []
    fin = data.get("financials") or {}
    for y, f in fin.items():
        if not isinstance(f, dict) or not f:
            continue
        ta, tl, te = f.get("total_assets"), f.get("total_liabilities"), f.get("total_equity")
        if None not in (ta, tl, te) and ta:
            if abs((tl + te) - ta) / ta > tol:
                warns.append(f"{y}: 자산({ta}) ≠ 부채({tl})+자본({te})")
        ni, rev = f.get("net_income"), f.get("revenue")
        if rev is not None and rev < 0:
            warns.append(f"{y}: 매출액 음수({rev})")
        if None not in (ni, rev) and rev and abs(ni) > abs(rev) * 2:
            warns.append(f"{y}: 당기순이익({ni})이 매출({rev}) 대비 비정상적으로 큼")
    sh = data.get("shareholders") or []
    ratio_sum = sum((s.get("ratio") or 0) for s in sh)
    if ratio_sum and abs(ratio_sum - 100.0) > 0.5:
        warns.append(f"주주 지분합계 {ratio_sum}% (≠100%)")
    return warns


# 계산결과 안에서 '근거 숫자'를 모으기 위한 키(코멘트가 인용해도 되는 값들)
def collect_known_numbers(result: dict) -> set[str]:
    nums: set[str] = set()

    def walk(o):
        if isinstance(o, dict):
            for v in o.values():
                walk(v)
        elif isinstance(o, list):
            for v in o:
                walk(v)
        elif isinstance(o, (int, float)) and not isinstance(o, bool):
            # 정수/소수 한 자리/두 자리 표현 모두 등록
            nums.add(_norm_num(o))
            nums.add(_norm_num(round(o, 1)))
            nums.add(_norm_num(round(o)))
    walk(result)
    return {n for n in nums if n}


def _norm_num(x) -> str:
    s = f"{x:.10f}".rstrip("0").rstrip(".")
    return s


_NUM_RE = re.compile(r"-?\d[\d,]*(?:\.\d+)?")


def grounding_violations(comment: str, result: dict, ignore_below: float = 100) -> list[str]:
    """
    코멘트에 등장하지만 계산결과에 없는 숫자를 탐지.
    - 연도(20xx), 작은 정수(<ignore_below: 순위·개수 등), 백분율 기호 제거 후 비교.
    - 완전 차단이 아니라 '검토 플래그'로 사용(엄격 모드에서는 실패 처리 가능).
    """
    known = collect_known_numbers(result)
    viol: list[str] = []
    for m in _NUM_RE.findall(comment):
        raw = m.replace(",", "")
        try:
            val = float(raw)
        except ValueError:
            continue
        if 1900 <= val <= 2100 and val == int(val):   # 연도
            continue
        if abs(val) < ignore_below and val == int(val):  # 소수 카운트/순위
            continue
        cand = {_norm_num(val), _norm_num(round(val, 1)), _norm_num(round(val)), _norm_num(round(val, 2))}
        if not (cand & known):
            viol.append(m)
    return sorted(set(viol))
