#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
계산 결과(result dict)를 IU.Partners 양식 진단서 워크북(xlsx)으로 변환.
financial_diagnosis.py 에서 --xlsx 옵션으로 호출되거나 단독 사용 가능:
  python build_xlsx.py result.json report.xlsx
"""
import json, sys
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.chart import BarChart, LineChart, Reference
from openpyxl.utils import get_column_letter

NAVY = "1F3864"; BLUE = "2E5496"; LIGHT = "D9E1F2"; GREY = "F2F2F2"
WARN = "FFC000"; ORANGE = "ED7D31"
thin = Side(style="thin", color="BFBFBF")
BORDER = Border(left=thin, right=thin, top=thin, bottom=thin)

def NA(v): return "N/A" if v is None else v
def num(v):
    if v is None: return "N/A"
    if isinstance(v,(int,float)): return v
    return v

def style_header(cell):
    cell.font = Font(bold=True, color="FFFFFF", size=12)
    cell.fill = PatternFill("solid", fgColor=NAVY)
    cell.alignment = Alignment(vertical="center")

def style_th(cell):
    cell.font = Font(bold=True, color="FFFFFF")
    cell.fill = PatternFill("solid", fgColor=BLUE)
    cell.alignment = Alignment(horizontal="center", vertical="center")
    cell.border = BORDER

def style_label(cell):
    cell.font = Font(bold=True)
    cell.fill = PatternFill("solid", fgColor=LIGHT)
    cell.alignment = Alignment(horizontal="center", vertical="center")
    cell.border = BORDER

def style_val(cell, warn=False):
    cell.alignment = Alignment(horizontal="center", vertical="center")
    cell.border = BORDER
    if warn:
        cell.fill = PatternFill("solid", fgColor=WARN)
        cell.font = Font(bold=True)

def section_title(ws, row, text):
    ws.merge_cells(start_row=row, start_column=1, end_row=row, end_column=8)
    c = ws.cell(row=row, column=1, value="■ " + text)
    style_header(c)
    ws.row_dimensions[row].height = 22
    return row + 1

def write_label_table(ws, row, pairs, ncol=2):
    """pairs: [(label,value),...] → label|value 2열 반복"""
    col = 1
    for label, value in pairs:
        lc = ws.cell(row=row, column=col, value=label); style_label(lc)
        vc = ws.cell(row=row, column=col+1, value=NA(value)); style_val(vc)
        col += 2
        if col > ncol*2:
            col = 1; row += 1
    if col != 1:
        row += 1
    return row

# ---------------------------------------------------------------------------
def build_workbook(R, path):
    wb = Workbook()

    # ===== 표지/개요 시트 =====
    ws = wb.active; ws.title = "1.기업개요"
    for i in range(1,9): ws.column_dimensions[get_column_letter(i)].width = 14
    ws.column_dimensions['A'].width = 16; ws.column_dimensions['C'].width = 16
    ws.column_dimensions['E'].width = 16; ws.column_dimensions['G'].width = 16

    ws.merge_cells("A1:H2")
    t = ws.cell(row=1,column=1,value="기업경영진단서  CORPORATE MANAGEMENT DIAGNOSIS REPORT")
    t.font = Font(bold=True, size=18, color=NAVY); t.alignment = Alignment(horizontal="center", vertical="center")
    co = R.get("company",{})
    ws.merge_cells("A3:H3")
    s = ws.cell(row=3,column=1,value=f"{co.get('name','')}    |    작성일 {R['meta']['생성일']}    |    참고용 약식 진단")
    s.alignment = Alignment(horizontal="center"); s.font = Font(size=10, italic=True, color="808080")

    r = 5
    r = section_title(ws, r, "일반현황")
    pairs = [
        ("기업명", co.get("name")), ("대표자", co.get("ceo")),
        ("기업형태", co.get("type")), ("설립일", co.get("establish_date")),
        ("사업자번호", co.get("biz_no")), ("연락처", co.get("phone")),
        ("업태", co.get("business_type")), ("종목", co.get("item")),
        ("산업분류", co.get("industry_code")), ("직원수", co.get("employees")),
        ("주요제품", co.get("main_product")), ("수출실적", co.get("export")),
        ("사업장", co.get("address_hq")), ("산업명", co.get("industry_name")),
    ]
    r = write_label_table(ws, r, pairs, ncol=2)
    r += 1

    # 지분구조
    r = section_title(ws, r, "지분구조 (단위:천원)")
    heads = ["주주","보유주식수","지분율(%)","자본금","관계"]
    for j,h in enumerate(heads): style_th(ws.cell(row=r,column=j+1,value=h))
    r += 1
    for s in R.get("shareholders",[]):
        vals = [s.get("name"), s.get("shares"), s.get("ratio"), s.get("capital"), s.get("관계")]
        for j,v in enumerate(vals): style_val(ws.cell(row=r,column=j+1,value=NA(v)))
        r += 1
    r += 1

    # 경영추이 표 + 차트
    r = section_title(ws, r, "경영추이 (단위:백만원)")
    fin = R["financials"]; years = R["meta"]["대상연도"]
    trend_head = ["년도","총자산","자본총계","매출액","영업이익","순이익"]
    for j,h in enumerate(trend_head): style_th(ws.cell(row=r,column=j+1,value=h))
    head_row = r; r += 1
    data_start = r
    for y in years:
        f = fin[y]
        def mm(v): return round(v/1000) if isinstance(v,(int,float)) else "N/A"  # 천원→백만원
        vals = [y, mm(f.get("total_assets")), mm(f.get("total_equity")),
                mm(f.get("revenue")), mm(f.get("operating_income")), mm(f.get("net_income"))]
        for j,v in enumerate(vals): style_val(ws.cell(row=r,column=j+1,value=v))
        r += 1
    data_end = r-1

    # 차트 (총자산/자본총계/매출액 막대, 매출액 line 생략하고 막대 위주)
    try:
        chart = BarChart(); chart.type="col"; chart.title="경영추이"; chart.height=7; chart.width=16
        cats = Reference(ws, min_col=1, min_row=data_start, max_row=data_end)
        data = Reference(ws, min_col=2, max_col=4, min_row=head_row, max_row=data_end)
        chart.add_data(data, titles_from_data=True); chart.set_categories(cats)
        line = LineChart()
        ldata = Reference(ws, min_col=4, min_row=head_row, max_row=data_end)
        line.add_data(ldata, titles_from_data=True)
        chart += line
        ws.add_chart(chart, f"A{r+1}")
    except Exception as e:
        ws.cell(row=r+1,column=1,value=f"(차트 생성 생략: {e})")

    # ===== 재무정보 시트 =====
    ws2 = wb.create_sheet("2.재무정보")
    for i in range(1,9): ws2.column_dimensions[get_column_letter(i)].width = 16
    r = 1
    r = _three_year_block(ws2, r, "요약 재무상태표 (단위:천원)", fin, years,
        [("유동자산","current_assets"),("비유동자산","non_current_assets"),("자산총계","total_assets"),
         ("유동부채","current_liabilities"),("비유동부채","non_current_liabilities"),("부채총계","total_liabilities"),
         ("자본금","capital_stock"),("미처분이익잉여금","retained_earnings"),("자본총계","total_equity")])
    r += 1
    r = _three_year_block(ws2, r, "요약 손익계산서 (단위:천원)", fin, years,
        [("매출액","revenue"),("매출총이익","gross_profit"),("판관비","sga"),("영업이익","operating_income"),
         ("영업외수익","non_operating_income"),("영업외비용","non_operating_expense"),
         ("법인세전순손익","pretax_income"),("법인세","corporate_tax"),("당기순이익","net_income")])
    r += 1
    # 재무비율
    r = _ratio_block(ws2, r, R["ratios"], years)

    # ===== 동종비교/진단 시트 =====
    ws3 = wb.create_sheet("3.재무비율진단")
    _diagnosis_sheet(ws3, R, years)

    # ===== 자금조달 시트 =====
    ws4 = wb.create_sheet("4.자금조달")
    _funding_sheet(ws4, R)

    # ===== 세무 시트 =====
    ws5 = wb.create_sheet("5.세무진단")
    _tax_sheet(ws5, R)

    # 면책
    last = wb.create_sheet("면책")
    last.cell(row=1,column=1,value=R.get("disclaimer","")).font = Font(italic=True, color="808080")

    wb.save(path)

# --- 보조 블록 함수들 ---
def _three_year_block(ws, r, title, fin, years, items):
    r = section_title(ws, r, title)
    style_label(ws.cell(row=r,column=1,value="구분"))
    for j,y in enumerate(years): style_th(ws.cell(row=r,column=j+2,value=y))
    r += 1
    bold_items = {"자산총계","부채총계","자본총계","매출액","영업이익","당기순이익"}
    for label,key in items:
        c=ws.cell(row=r,column=1,value=label); style_label(c)
        if label in bold_items: c.fill = PatternFill("solid",fgColor=GREY)
        for j,y in enumerate(years):
            v = fin[y].get(key)
            cell=ws.cell(row=r,column=j+2,value=NA(v)); style_val(cell)
            if isinstance(v,(int,float)): cell.number_format='#,##0'
            if label in bold_items: cell.font=Font(bold=True)
        r += 1
    return r

def _ratio_block(ws, r, ratios, years):
    r = section_title(ws, r, "요약 재무비율")
    sections = {
        "안정성":["부채비율","자기자본비율","차입금의존도","유동비율","당좌비율"],
        "수익성":["매출액영업이익율","영업이익이자보상배수","총자본순이익률","자기자본순이익율(ROE)","매출액순이익율"],
        "활동성":["총자본회전율","매출채권회전기간","매입채무회전기간","재고자산회전기간","운전자금1회전기간"],
        "성장성":["매출액증가율","총자산증가율","영업이익증가율","순이익증가율","자기자본증가율"],
    }
    style_label(ws.cell(row=r,column=1,value="구분"))
    style_label(ws.cell(row=r,column=2,value="항목"))
    for j,y in enumerate(years): style_th(ws.cell(row=r,column=j+3,value=y))
    r += 1
    for sec, inds in sections.items():
        start = r
        for k in inds:
            style_val(ws.cell(row=r,column=2,value=k))
            for j,y in enumerate(years):
                style_val(ws.cell(row=r,column=j+3,value=NA(ratios[y].get(k))))
            r += 1
        ws.merge_cells(start_row=start,start_column=1,end_row=r-1,end_column=1)
        sc=ws.cell(row=start,column=1,value=sec); style_label(sc)
    return r

def _diagnosis_sheet(ws, R, years):
    for i in range(1,9): ws.column_dimensions[get_column_letter(i)].width=15
    r = 1
    diag = R.get("diagnosis",{})
    ind = R.get("external_data",{}).get("industry_avg")
    r = section_title(ws, r, "주요 재무비율 (동사 vs 동종평균)")
    if not diag.get("available"):
        ws.merge_cells(start_row=r,start_column=1,end_row=r,end_column=6)
        ws.cell(row=r,column=1,value="※ 동종평균 데이터 미제공 → 상대평가·진단등급 산출 불가. 절대값은 '2.재무정보' 시트 참조.")\
            .font=Font(color="C00000", bold=True)
        return
    heads=["항목","동사(최신)","동종평균","평가"]
    for j,h in enumerate(heads): style_th(ws.cell(row=r,column=j+1,value=h))
    r += 1
    latest=years[-1]; comp=R["ratios"][latest]; iv=ind.get(latest,{})
    for k,ev in diag.get("항목평가",{}).items():
        style_val(ws.cell(row=r,column=1,value=k))
        style_val(ws.cell(row=r,column=2,value=NA(comp.get(k))))
        style_val(ws.cell(row=r,column=3,value=NA(iv.get(k))))
        style_val(ws.cell(row=r,column=4,value=ev), warn=(ev=="미흡"))
        r += 1
    r += 1
    r = section_title(ws, r, "재무부문 진단등급 (자체기준 추정)")
    for sec,d in diag.get("부문등급",{}).items():
        style_label(ws.cell(row=r,column=1,value=sec))
        style_val(ws.cell(row=r,column=2,value=f"{d['등급']} ({d['평균점수']})"))
        r += 1
    style_label(ws.cell(row=r,column=1,value="종합진단등급"))
    c=ws.cell(row=r,column=2,value=f"{diag.get('종합진단등급')} ({diag.get('종합점수')})")
    c.fill=PatternFill("solid",fgColor=ORANGE); c.font=Font(bold=True,color="FFFFFF",size=14)
    c.alignment=Alignment(horizontal="center")

def _funding_sheet(ws, R):
    for i in range(1,9): ws.column_dimensions[get_column_letter(i)].width=18
    r=1; F=R["funding"]
    r=section_title(ws,r,"차입금 구조 및 채무상환능력 (단위:천원)")
    rows=[("차입금합계",F.get("차입금합계")),("단기차입금",F.get("단기차입금")),
          ("장기차입금",F.get("장기차입금")),("이자비용",F.get("이자비용")),
          ("영업이익이자보상배수",F.get("영업이익이자보상배수")),("EBITDA",F.get("EBITDA")),
          ("EBITDA/이자비용",F.get("EBITDA/이자비용"))]
    for label,v in rows:
        style_label(ws.cell(row=r,column=1,value=label))
        cell=ws.cell(row=r,column=2,value=NA(v)); style_val(cell)
        if isinstance(v,(int,float)): cell.number_format='#,##0.##'
        r+=1
    r+=1
    r=section_title(ws,r,"운전자본 및 대출여력 추정 (단위:천원)")
    rows2=[("1회전운전자본",F.get("1회전운전자본")),
           ("매출10억 증대시 필요자금",F.get("매출10억증대시필요자금")),
           ("담보대출한도(B)",F.get("담보대출한도")),
           ("신용대출한도 매출25%(C)",F.get("신용대출한도(매출25%)")),
           ("추가대출여력(B+C-A)",F.get("추가대출여력"))]
    for label,v in rows2:
        style_label(ws.cell(row=r,column=1,value=label))
        warn = (label.startswith("추가대출여력") and isinstance(v,(int,float)) and v<0)
        cell=ws.cell(row=r,column=2,value=NA(v)); style_val(cell, warn=warn)
        if isinstance(v,(int,float)): cell.number_format='#,##0'
        r+=1
    ws.cell(row=r+1,column=1,value="* 담보/신용 한도는 약식 추정. 실제 금융기관 심사·감정평가와 다를 수 있음.")\
        .font=Font(italic=True,size=9,color="808080")

def _tax_sheet(ws, R):
    for i in range(1,10): ws.column_dimensions[get_column_letter(i)].width=14
    tv=R.get("tax_valuation"); r=1
    if not tv:
        ws.cell(row=1,column=1,value="주주/주식 정보 미입력 → 세무진단 생략").font=Font(color="C00000")
        return
    r=section_title(ws,r,"상증법상 비상장주식 가치평가 (주당, 원)")
    pairs=[("주당 순자산가치",tv.get("주당순자산가치")),("주당 순손익가치",tv.get("주당순손익가치")),
           ("부동산비중(%)",tv.get("부동산비중")),("주당 평가액",tv.get("주당평가액")),
           ("액면가",tv.get("액면가")),("10년후 주당평가액",(tv.get("10년후") or {}).get("주당평가액"))]
    for label,v in pairs:
        style_label(ws.cell(row=r,column=1,value=label))
        cell=ws.cell(row=r,column=2,value=NA(v)); style_val(cell)
        if isinstance(v,(int,float)): cell.number_format='#,##0'
        r+=1
    r+=1
    # 주주별 세금
    r=section_title(ws,r,"주식이동 시 세금 부담 (단위:천원)")
    heads=["주주","보유주식수","현재 시가","현재 상속세","현재 양도세","10년후 시가","10년후 상속세","10년후 양도세"]
    for j,h in enumerate(heads): style_th(ws.cell(row=r,column=j+1,value=h))
    r+=1
    for s in R.get("shareholder_tax",[]) or []:
        vals=[s["주주"],s["보유주식수"],s["현재_시가"],s["현재_상속세"],s["현재_양도세"],
              s["10년후_시가"],s["10년후_상속세"],s["10년후_양도세"]]
        for j,v in enumerate(vals):
            cell=ws.cell(row=r,column=j+1,value=NA(v)); style_val(cell)
            if isinstance(v,(int,float)) and j>=1: cell.number_format='#,##0'
        r+=1
    r+=1
    # 청산세
    liq=R.get("liquidation_tax")
    if liq and liq.get("현재"):
        r=section_title(ws,r,"청산 시 세금 부담 (단위:천원)")
        heads=["구분","순자산","자본금","과세표준","법인세","배당소득","배당세","전체세금"]
        for j,h in enumerate(heads): style_th(ws.cell(row=r,column=j+1,value=h))
        r+=1
        for label,d in [("현재",liq.get("현재")),("10년후",liq.get("10년후"))]:
            if not d: continue
            vals=[label,d["순자산"],d["자본금"],d["과세표준"],d["법인산출세액"],d["배당소득"],d["배당산출세액"],d["전체세금"]]
            for j,v in enumerate(vals):
                cell=ws.cell(row=r,column=j+1,value=NA(v)); style_val(cell)
                if isinstance(v,(int,float)) and j>=1: cell.number_format='#,##0'
            r+=1
    ws.cell(row=r+1,column=1,value="* 상속공제·증권거래세·배당세액공제 미반영 약식. 정식 평가/신고와 차이가 날 수 있음.")\
        .font=Font(italic=True,size=9,color="808080")

if __name__=="__main__":
    with open(sys.argv[1],encoding="utf-8") as fp: R=json.load(fp)
    build_workbook(R, sys.argv[2])
    print("saved", sys.argv[2])
