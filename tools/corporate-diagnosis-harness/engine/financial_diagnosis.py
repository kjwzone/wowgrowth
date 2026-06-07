#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
기업경영진단서 계산 엔진
- 입력: 기업정보/주주/3개년 재무제표 JSON
- 출력: 모든 재무비율·현금흐름·운전자본·대출여력·상증법 주식가치·세금·진단등급 (결과 JSON)
- 옵션: --xlsx 경로 지정 시 IU.Partners 양식 진단서 워크북 생성

사용법:
  python financial_diagnosis.py input.json result.json
  python financial_diagnosis.py input.json result.json --xlsx report.xlsx

모든 계산식은 references/financial-formulas.md, references/tax-calculations.md 와 일치.
값이 없으면(null) 해당 지표는 None(N/A)으로 둔다.
"""
import json
import sys
import argparse
from datetime import date

# ---------------------------------------------------------------------------
# 안전 연산 헬퍼
# ---------------------------------------------------------------------------
def g(d, k):
    """dict에서 값 가져오기 (없거나 null이면 None)"""
    v = d.get(k) if isinstance(d, dict) else None
    return v

def div(a, b):
    """0/None 방어 나눗셈"""
    if a is None or b is None or b == 0:
        return None
    return a / b

def pct(a, b):
    r = div(a, b)
    return None if r is None else round(r * 100, 2)

def avg2(cur, prev):
    """기초+기말 평균. 전기 없으면 기말값."""
    if cur is None:
        return None
    if prev is None:
        return cur
    return (cur + prev) / 2

def rnd(x, n=2):
    return None if x is None else round(x, n)

# ---------------------------------------------------------------------------
# 세율표 (2024 기준) — (상한, 세율, 누진공제 천원)
# ---------------------------------------------------------------------------
INHERITANCE_BRACKETS = [  # 상속/증여세
    (100_000, 0.10, 0), (500_000, 0.20, 10_000), (1_000_000, 0.30, 60_000),
    (3_000_000, 0.40, 160_000), (float('inf'), 0.50, 460_000),
]
CORPORATE_BRACKETS = [  # 법인세
    (200_000, 0.09, 0), (20_000_000, 0.19, 20_000),
    (300_000_000, 0.21, 420_000), (float('inf'), 0.24, 4_420_000),
]
INCOME_BRACKETS = [  # 종합소득세 (배당소득세 산출용)
    (14_000, 0.06, 0), (50_000, 0.15, 1_260), (88_000, 0.24, 5_760),
    (150_000, 0.35, 15_440), (300_000, 0.38, 19_940), (500_000, 0.40, 25_940),
    (1_000_000, 0.42, 35_940), (float('inf'), 0.45, 65_940),
]

def progressive_tax(base, brackets):
    """누진세율표 적용. base 단위 = 천원."""
    if base is None or base <= 0:
        return 0
    for upper, rate, deduct in brackets:
        if base <= upper:
            return round(base * rate - deduct)
    return 0

def transfer_tax(gain):
    """비상장 중소기업 주식 양도세 (지방소득세 10% 포함)."""
    if gain is None or gain <= 0:
        return 0
    if gain <= 300_000:
        t = gain * 0.20
    else:
        t = 300_000 * 0.20 + (gain - 300_000) * 0.25
    return round(t * 1.10)  # 지방소득세 10% 가산

# ---------------------------------------------------------------------------
# 재무비율 계산
# ---------------------------------------------------------------------------
def compute_ratios(fin, years):
    """years: 오름차순 정렬된 연도 리스트. fin: {year: {...}}"""
    out = {}
    for i, y in enumerate(years):
        f = fin[y]
        prev = fin[years[i-1]] if i > 0 else None

        ta   = g(f, 'total_assets')
        tl   = g(f, 'total_liabilities')
        te   = g(f, 'total_equity')
        ca   = g(f, 'current_assets')
        cl   = g(f, 'current_liabilities')
        ncl  = g(f, 'non_current_liabilities')
        nca  = g(f, 'non_current_assets')
        inv  = g(f, 'inventory')
        ar   = g(f, 'accounts_receivable')
        ap   = g(f, 'accounts_payable')
        rev  = g(f, 'revenue')
        oi   = g(f, 'operating_income')
        ni   = g(f, 'net_income')
        ie   = g(f, 'interest_expense')
        std  = g(f, 'short_term_debt') or 0
        ltd  = g(f, 'long_term_debt') or 0
        debt = std + ltd if (g(f,'short_term_debt') is not None or g(f,'long_term_debt') is not None) else ncl

        # 평균잔액
        avg_ta = avg2(ta, g(prev, 'total_assets') if prev else None)
        avg_te = avg2(te, g(prev, 'total_equity') if prev else None)
        avg_ar = avg2(ar, g(prev, 'accounts_receivable') if prev else None)
        avg_inv = avg2(inv, g(prev, 'inventory') if prev else None)
        avg_ap = avg2(ap, g(prev, 'accounts_payable') if prev else None)

        r = {}
        # 안정성
        r['부채비율'] = pct(tl, te)
        r['자기자본비율'] = pct(te, ta)
        r['차입금의존도'] = pct(debt, ta)
        r['유동비율'] = pct(ca, cl)
        r['당좌비율'] = pct((ca - inv) if (ca is not None and inv is not None) else None, cl)
        r['고정장기적합률'] = pct(nca, (te + ncl) if (te is not None and ncl is not None) else None)
        # 수익성
        r['매출액영업이익율'] = pct(oi, rev)
        r['매출액순이익율'] = pct(ni, rev)
        r['총자본순이익률'] = pct(ni, avg_ta)
        r['자기자본순이익율(ROE)'] = pct(ni, avg_te)
        r['영업이익이자보상배수'] = rnd(div(oi, ie))
        r['금융비용/매출액비율'] = pct(ie, rev)
        # 활동성
        r['총자본회전율'] = rnd(div(rev, avg_ta))
        ar_turn = div(rev, avg_ar)
        ap_turn = div(rev, avg_ap)
        inv_turn = div(rev, avg_inv)
        r['매출채권회전율'] = rnd(ar_turn)
        r['매출채권회전기간'] = rnd(div(365, ar_turn))
        r['매입채무회전율'] = rnd(ap_turn)
        r['매입채무회전기간'] = rnd(div(365, ap_turn))
        r['재고자산회전율'] = rnd(inv_turn)
        r['재고자산회전기간'] = rnd(div(365, inv_turn))
        if all(x is not None for x in [r['매출채권회전기간'], r['재고자산회전기간'], r['매입채무회전기간']]):
            r['운전자금1회전기간'] = rnd(r['매출채권회전기간'] + r['재고자산회전기간'] - r['매입채무회전기간'])
        else:
            r['운전자금1회전기간'] = None
        # 성장성 (전기 대비)
        if prev:
            r['매출액증가율'] = pct((rev - g(prev,'revenue')) if (rev is not None and g(prev,'revenue')) else None, g(prev,'revenue'))
            r['총자산증가율'] = pct((ta - g(prev,'total_assets')) if (ta is not None and g(prev,'total_assets')) else None, g(prev,'total_assets'))
            r['영업이익증가율'] = pct((oi - g(prev,'operating_income')) if (oi is not None and g(prev,'operating_income')) else None, g(prev,'operating_income'))
            r['순이익증가율'] = pct((ni - g(prev,'net_income')) if (ni is not None and g(prev,'net_income')) else None, g(prev,'net_income'))
            r['자기자본증가율'] = pct((te - g(prev,'total_equity')) if (te is not None and g(prev,'total_equity')) else None, g(prev,'total_equity'))
        else:
            for k in ['매출액증가율','총자산증가율','영업이익증가율','순이익증가율','자기자본증가율']:
                r[k] = None
        out[y] = r
    return out

# ---------------------------------------------------------------------------
# 차입금/EBITDA/운전자본/대출여력
# ---------------------------------------------------------------------------
def compute_funding(fin, years, ratios, collateral):
    latest = years[-1]
    f = fin[latest]
    rev = g(f, 'revenue')
    oi = g(f, 'operating_income')
    ie = g(f, 'interest_expense')
    dep = g(f, 'depreciation') or 0
    amo = g(f, 'amortization') or 0
    std = g(f, 'short_term_debt') or 0
    ltd = g(f, 'long_term_debt') or 0
    debt = (std + ltd) if (g(f,'short_term_debt') is not None or g(f,'long_term_debt') is not None) else g(f,'non_current_liabilities')

    ebitda = (oi + dep + amo) if oi is not None else None
    wc_period = ratios[latest].get('운전자금1회전기간')
    one_turn_wc = rnd(rev * wc_period / 365) if (rev is not None and wc_period is not None) else None
    need_for_1bil = rnd(1_000_000 * wc_period / 365) if wc_period is not None else None

    # 대출여력 (백만원 단위로 환산: 입력 천원/1000)
    lb = g(collateral, 'land_building_book')   # 천원
    mc = g(collateral, 'machinery_book')        # 천원
    collateral_limit = None
    if lb is not None or mc is not None:
        collateral_limit = (lb or 0) * 0.70 + (mc or 0) * 0.30  # 천원
    credit_limit = rev * 0.25 if rev is not None else None       # 매출 25%
    debt_total = debt
    extra = None
    if collateral_limit is not None and credit_limit is not None and debt_total is not None:
        extra = collateral_limit + credit_limit - debt_total

    return {
        'latest_year': latest,
        '차입금합계': debt_total,
        '단기차입금': std, '장기차입금': ltd,
        '이자비용': ie,
        'EBITDA': ebitda,
        'EBITDA/이자비용': rnd(div(ebitda, ie)),
        '영업이익이자보상배수': ratios[latest].get('영업이익이자보상배수'),
        '1회전운전자본': one_turn_wc,
        '매출10억증대시필요자금': need_for_1bil,
        '담보대출한도': rnd(collateral_limit) if collateral_limit is not None else None,
        '신용대출한도(매출25%)': rnd(credit_limit) if credit_limit is not None else None,
        '추가대출여력': rnd(extra) if extra is not None else None,
    }

# ---------------------------------------------------------------------------
# 상증법 비상장주식 가치평가 & 세금
# ---------------------------------------------------------------------------
def compute_tax(fin, years, total_shares, par_value, real_estate_ratio, growth=0.10):
    latest = years[-1]
    f = fin[latest]
    te = g(f, 'total_equity')              # 순자산
    cap = g(f, 'capital_stock')            # 자본금
    rev = g(f, 'revenue')

    # 주당 순자산가치
    nav_ps = div(te, total_shares)         # 천원/주 환산 전: te 천원 / 주수
    # te가 천원 단위이므로 (천원*1000)/주수 = 원/주 → te*1000/shares
    nav_per_share = rnd(div(te * 1000, total_shares)) if (te is not None and total_shares) else None

    # 가중평균 순손익 (당기3:1년전2:2년전1)/6
    ni_list = [g(fin[y], 'net_income') for y in years]  # 오름차순 [2년전,1년전,당기]
    if len(ni_list) >= 3 and all(x is not None for x in ni_list[-3:]):
        wavg_ni = (ni_list[-1]*3 + ni_list[-2]*2 + ni_list[-3]*1) / 6
    elif ni_list[-1] is not None:
        wavg_ni = ni_list[-1]
    else:
        wavg_ni = None
    # 1주당 순손익 (원/주) = wavg_ni(천원)*1000/주수 ; 순손익가치 = /0.1
    eps = div(wavg_ni * 1000, total_shares) if (wavg_ni is not None and total_shares) else None
    earning_per_share = rnd(div(eps, 0.10)) if eps is not None else None

    # 가중평균 평가액
    def weighted(npv, nav, re_ratio):
        if npv is None or nav is None:
            return nav if nav is not None else npv
        if re_ratio is not None and re_ratio >= 80:
            v = nav
        elif re_ratio is not None and re_ratio >= 50:
            v = (npv*2 + nav*3) / 5
        else:
            v = (npv*3 + nav*2) / 5
        # 순자산가치 80% 최소기준
        return max(v, nav * 0.80)
    value_per_share = rnd(weighted(earning_per_share, nav_per_share, real_estate_ratio))

    # 10년 후 추정
    avg_margin = None
    margins = [div(g(fin[y],'net_income'), g(fin[y],'revenue')) for y in years if g(fin[y],'revenue')]
    margins = [m for m in margins if m is not None]
    if margins:
        avg_margin = sum(margins)/len(margins)
    future = {}
    if rev is not None and avg_margin is not None and te is not None:
        fut_rev = rev * (1+growth)**10
        fut_ni = fut_rev * avg_margin
        # 누적 순이익 (10년, 배당0 가정, 단순합 근사)
        cum = sum(rev*(1+growth)**k*avg_margin for k in range(1,11))
        fut_te = te + cum
        fut_nav = rnd(div(fut_te*1000, total_shares))
        fut_eps = div(fut_ni*1000, total_shares)
        fut_earning = rnd(div(fut_eps, 0.10)) if fut_eps else None
        fut_value = rnd(weighted(fut_earning, fut_nav, real_estate_ratio))
        future = {'순자산가치': fut_nav, '순손익가치': fut_earning, '주당평가액': fut_value, '순자산총계': rnd(fut_te)}

    return {
        '발행주식수': total_shares, '액면가': par_value,
        '주당순자산가치': nav_per_share,
        '주당순손익가치': earning_per_share,
        '부동산비중': real_estate_ratio,
        '주당평가액': value_per_share,
        '10년후': future,
        '_te': te, '_cap': cap,
    }

def shareholder_tax(shareholders, value_per_share, future_value, par_value):
    """주주별 시가/상속세/양도세 (현재·10년후)"""
    rows = []
    for s in shareholders:
        shares = g(s, 'shares') or 0
        market_now = round(value_per_share * shares / 1000) if value_per_share else 0   # 천원
        market_fut = round(future_value * shares / 1000) if future_value else 0
        acquire = round((par_value or 0) * shares / 1000)  # 취득가(액면) 천원
        rows.append({
            '주주': g(s,'name'), '보유주식수': shares,
            '지분율': rnd(g(s,'ratio')) if g(s,'ratio') is not None else None,
            '액면가합': round((par_value or 0)*shares/1000),
            '현재_시가': market_now,
            '현재_상속세': progressive_tax(market_now, INHERITANCE_BRACKETS),
            '현재_양도세': transfer_tax(market_now - acquire),
            '10년후_시가': market_fut,
            '10년후_상속세': progressive_tax(market_fut, INHERITANCE_BRACKETS),
            '10년후_양도세': transfer_tax(market_fut - acquire),
        })
    return rows

def liquidation_tax(te, cap):
    """청산 시 법인세 + 주주 배당소득세"""
    if te is None or cap is None:
        return None
    base = te - cap
    corp = progressive_tax(base, CORPORATE_BRACKETS)
    dividend = te - cap - corp
    div_tax = progressive_tax(dividend, INCOME_BRACKETS)
    return {'순자산': te, '자본금': cap, '과세표준': base, '법인산출세액': corp,
            '배당소득': dividend, '배당산출세액': div_tax, '전체세금': corp + div_tax}

# ---------------------------------------------------------------------------
# 동종평균 대비 평가 & 진단등급
# ---------------------------------------------------------------------------
LOWER_BETTER = {'부채비율','차입금의존도','금융비용/매출액비율','매출채권회전기간',
                '매입채무회전기간','재고자산회전기간','운전자금1회전기간'}

def evaluate_vs_industry(company_val, industry_val, indicator):
    if company_val is None or industry_val is None or industry_val == 0:
        return None
    ratio = company_val / industry_val
    if indicator in LOWER_BETTER:
        if ratio <= 0.70: return '탁월'
        if ratio <= 0.90: return '우수'
        if ratio <= 1.10: return '양호'
        if ratio <= 1.30: return '보통'
        return '미흡'
    else:
        if ratio >= 1.50: return '탁월'
        if ratio >= 1.20: return '우수'
        if ratio >= 0.90: return '양호'
        if ratio >= 0.70: return '보통'
        return '미흡'

GRADE_SCORE = {'탁월':5,'우수':4,'양호':3,'보통':2,'미흡':1}
SECTION_INDICATORS = {
    '안정성': ['부채비율','자기자본비율','차입금의존도','유동비율','당좌비율','고정장기적합률'],
    '수익성': ['매출액영업이익율','영업이익이자보상배수','총자본순이익률','자기자본순이익율(ROE)','금융비용/매출액비율','매출액순이익율'],
    '활동성': ['총자본회전율','매출채권회전기간','매입채무회전기간','재고자산회전기간','운전자금1회전기간'],
    '성장성': ['매출액증가율','총자산증가율','영업이익증가율','순이익증가율','자기자본증가율'],
}
def score_to_grade(s):
    if s is None: return None
    if s >= 4.5: return 'A'
    if s >= 4.0: return 'BBB'
    if s >= 3.5: return 'BBB-'
    if s >= 3.0: return 'BB'
    if s >= 2.5: return 'BB-'
    if s >= 2.0: return 'B+'
    if s >= 1.5: return 'B'
    return 'CCC+'

def diagnose(ratios, industry, years):
    """동종평균이 있을 때만 부문 평가/등급 산출."""
    latest = years[-1]
    if not industry or latest not in industry:
        return {'available': False, 'note': '동종평균 미제공 → 평가·진단등급 산출 불가(N/A)'}
    ind = industry[latest]
    comp = ratios[latest]
    evals, sec_grades = {}, {}
    for sec, inds in SECTION_INDICATORS.items():
        scores = []
        for k in inds:
            ev = evaluate_vs_industry(comp.get(k), ind.get(k), k)
            if ev:
                evals[k] = ev
                scores.append(GRADE_SCORE[ev])
        if scores:
            sec_grades[sec] = {'평균점수': round(sum(scores)/len(scores),2), '등급': score_to_grade(sum(scores)/len(scores))}
    # 종합: 안정성·수익성 가중 1.3
    w = {'안정성':1.3,'수익성':1.3,'활동성':1.0,'성장성':1.0}
    num = sum(sec_grades[s]['평균점수']*w[s] for s in sec_grades)
    den = sum(w[s] for s in sec_grades)
    overall = round(num/den,2) if den else None
    return {'available': True, '항목평가': evals, '부문등급': sec_grades,
            '종합점수': overall, '종합진단등급': score_to_grade(overall)}

# ---------------------------------------------------------------------------
# 메인
# ---------------------------------------------------------------------------
def run(data):
    fin = data['financials']
    years = sorted(fin.keys())          # 오름차순
    if len(years) > 3:
        years = years[-3:]
    ratios = compute_ratios(fin, years)
    collateral = data.get('collateral', {})
    funding = compute_funding(fin, years, ratios, collateral)

    total_shares = data.get('total_shares')
    par_value = data.get('par_value_per_share')
    re_ratio = data.get('real_estate_ratio')   # 부동산비중 %
    tax = compute_tax(fin, years, total_shares, par_value, re_ratio) if total_shares else None

    sh_tax = None
    liq = None
    if tax:
        fut_val = tax['10년후'].get('주당평가액') if tax['10년후'] else None
        sh_tax = shareholder_tax(data.get('shareholders', []), tax['주당평가액'], fut_val, par_value)
        liq_now = liquidation_tax(tax['_te'], tax['_cap'])
        liq_fut = None
        if tax['10년후']:
            liq_fut = liquidation_tax(tax['10년후'].get('순자산총계'), tax['_cap'])
        liq = {'현재': liq_now, '10년후': liq_fut}

    diag = diagnose(ratios, data.get('industry_avg'), years)

    return {
        'meta': {'생성일': str(date.today()), '대상연도': years,
                 '기업명': data.get('company',{}).get('name')},
        'company': data.get('company', {}),
        'shareholders': data.get('shareholders', []),
        'financials': {y: fin[y] for y in years},
        'ratios': ratios,
        'funding': funding,
        'tax_valuation': {k:v for k,v in (tax or {}).items() if not k.startswith('_')} if tax else None,
        'shareholder_tax': sh_tax,
        'liquidation_tax': liq,
        'diagnosis': diag,
        'external_data': {
            'industry_avg': data.get('industry_avg') or 'N/A (동종평균 데이터 필요)',
            'credit_rating': data.get('credit_rating') or 'N/A (외부 신용평가 필요)',
            'cashflow_grade': data.get('cashflow_grade') or 'N/A (외부 신용평가 필요)',
        },
        'disclaimer': '본 결과는 상증법 보충적 평가 및 약식 재무진단 기준의 참고용 추정치이며, '
                      '정식 신용평가·세무신고·감정평가와 차이가 날 수 있음.',
    }

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('input')
    ap.add_argument('output')
    ap.add_argument('--xlsx', default=None)
    args = ap.parse_args()

    with open(args.input, encoding='utf-8') as fp:
        data = json.load(fp)
    result = run(data)
    with open(args.output, 'w', encoding='utf-8') as fp:
        json.dump(result, fp, ensure_ascii=False, indent=2)
    print(f"[계산완료] 결과 저장 → {args.output}")

    if args.xlsx:
        try:
            from build_xlsx import build_workbook
        except ImportError:
            sys.path.insert(0, __file__.rsplit('/',1)[0])
            from build_xlsx import build_workbook
        build_workbook(result, args.xlsx)
        print(f"[보고서생성] 진단서 → {args.xlsx}")

if __name__ == '__main__':
    main()
