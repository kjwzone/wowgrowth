import type ExcelJS from "exceljs";
import type { CompanyDiagnosisReport } from "@/lib/company-diagnosis";
import { COMMENTARY_SECTIONS } from "@/lib/company-diagnosis";
import {
  buildHarnessPayload,
  buildHarnessXlsxFilename,
  type HarnessPayload,
} from "@/lib/diagnosis-harness-data";
import type { CompanyProfile } from "@/types";

const NAVY = "FF1F3864";
const BLUE = "FF2E5496";
const LIGHT = "FFD9E1F2";
const WARN = "FFFFC000";

const thinBorder: Partial<ExcelJS.Border> = { style: "thin", color: { argb: "FFBFBFBF" } };
const cellBorder: Partial<ExcelJS.Borders> = {
  top: thinBorder,
  left: thinBorder,
  bottom: thinBorder,
  right: thinBorder,
};

const na = (value: string | number | null | undefined): string | number =>
  value === null || value === undefined ? "N/A" : value;

const styleHeader = (cell: ExcelJS.Cell): void => {
  cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 12 };
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY } };
  cell.alignment = { vertical: "middle" };
};

const styleTh = (cell: ExcelJS.Cell): void => {
  cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BLUE } };
  cell.alignment = { horizontal: "center", vertical: "middle" };
  cell.border = cellBorder;
};

const styleLabel = (cell: ExcelJS.Cell): void => {
  cell.font = { bold: true };
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: LIGHT } };
  cell.alignment = { horizontal: "center", vertical: "middle" };
  cell.border = cellBorder;
};

const styleVal = (cell: ExcelJS.Cell, warn = false): void => {
  cell.alignment = { horizontal: "center", vertical: "middle" };
  cell.border = cellBorder;
  if (warn) {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: WARN } };
    cell.font = { bold: true };
  }
};

const sectionTitle = (ws: ExcelJS.Worksheet, row: number, text: string): number => {
  ws.mergeCells(row, 1, row, 8);
  const cell = ws.getCell(row, 1);
  cell.value = `■ ${text}`;
  styleHeader(cell);
  ws.getRow(row).height = 22;
  return row + 1;
};

const writeLabelTable = (
  ws: ExcelJS.Worksheet,
  row: number,
  pairs: Array<[string, string | number | undefined]>,
): number => {
  let col = 1;
  pairs.forEach(([label, value]) => {
    styleLabel(ws.getCell(row, col));
    ws.getCell(row, col).value = label;
    styleVal(ws.getCell(row, col + 1));
    ws.getCell(row, col + 1).value = na(value);
    col += 2;
    if (col > 4) {
      col = 1;
      row += 1;
    }
  });
  if (col !== 1) row += 1;
  return row;
};

const buildOverviewSheet = (workbook: ExcelJS.Workbook, payload: HarnessPayload): void => {
  const ws = workbook.addWorksheet("1.기업개요");
  for (let i = 1; i <= 8; i += 1) ws.getColumn(i).width = 14;
  ws.getColumn(1).width = 16;
  ws.getColumn(3).width = 16;
  ws.getColumn(5).width = 16;
  ws.getColumn(7).width = 16;

  ws.mergeCells(1, 1, 2, 8);
  const title = ws.getCell(1, 1);
  title.value = "기업경영진단서  CORPORATE MANAGEMENT DIAGNOSIS REPORT";
  title.font = { bold: true, size: 18, color: { argb: NAVY } };
  title.alignment = { horizontal: "center", vertical: "middle" };

  ws.mergeCells(3, 1, 3, 8);
  const subtitle = ws.getCell(3, 1);
  subtitle.value = `${payload.company.name}    |    작성일 ${payload.meta.생성일}    |    WOW Growth 하네스 MVP`;
  subtitle.alignment = { horizontal: "center" };
  subtitle.font = { size: 10, italic: true, color: { argb: "FF808080" } };

  let row = 5;
  row = sectionTitle(ws, row, "일반현황");
  row = writeLabelTable(ws, row, [
    ["기업명", payload.company.name as string],
    ["대표자", payload.company.ceo as string],
    ["기업형태", payload.company.type as string],
    ["설립일", payload.company.establish_date as string],
    ["사업자번호", payload.company.biz_no as string],
    ["연락처", payload.company.phone as string],
    ["업태", payload.company.business_type as string],
    ["종목", payload.company.item as string],
    ["산업분류", payload.company.industry_code as string],
    ["직원수", payload.company.employees as number],
    ["주요제품", payload.company.main_product as string],
    ["수출실적", payload.company.export as string],
    ["사업장", payload.company.address_hq as string],
    ["산업명", payload.company.industry_name as string],
  ]);
  row += 1;

  row = sectionTitle(ws, row, "지분구조 (단위:천원)");
  ["주주", "보유주식수", "지분율(%)", "자본금", "관계"].forEach((head, index) => {
    styleTh(ws.getCell(row, index + 1));
    ws.getCell(row, index + 1).value = head;
  });
  row += 1;
  payload.shareholders.forEach((shareholder) => {
    [shareholder.name, shareholder.shares, shareholder.ratio, shareholder.capital, shareholder.관계]
      .forEach((value, index) => {
        styleVal(ws.getCell(row, index + 1));
        ws.getCell(row, index + 1).value = na(value as string | number);
      });
    row += 1;
  });
  row += 1;

  row = sectionTitle(ws, row, "경영추이 (단위:백만원)");
  const trendHead = ["년도", "총자산", "자본총계", "매출액", "영업이익", "순이익"];
  trendHead.forEach((head, index) => {
    styleTh(ws.getCell(row, index + 1));
    ws.getCell(row, index + 1).value = head;
  });
  row += 1;
  payload.meta.대상연도.forEach((year) => {
    const fin = payload.financials[year];
    if (!fin) return;
    const toMillion = (value: number): number => Math.round(value / 1000);
    [year, toMillion(fin.total_assets), toMillion(fin.total_equity), toMillion(fin.revenue), toMillion(fin.operating_income), toMillion(fin.net_income)]
      .forEach((value, index) => {
        styleVal(ws.getCell(row, index + 1));
        ws.getCell(row, index + 1).value = value;
      });
    row += 1;
  });
  row += 1;

  row = sectionTitle(ws, row, "진단 코멘트");
  COMMENTARY_SECTIONS.forEach(({ key, label }) => {
    ws.mergeCells(row, 1, row, 8);
    styleLabel(ws.getCell(row, 1));
    ws.getCell(row, 1).value = label;
    ws.getCell(row, 1).alignment = { horizontal: "left", vertical: "middle" };
    row += 1;
    ws.mergeCells(row, 1, row, 8);
    ws.getCell(row, 1).value = payload.commentary[key];
    ws.getCell(row, 1).alignment = { wrapText: true, vertical: "top" };
    ws.getRow(row).height = 48;
    row += 1;
  });
};

const writeThreeYearBlock = (
  ws: ExcelJS.Worksheet,
  row: number,
  title: string,
  payload: HarnessPayload,
  items: Array<[string, keyof HarnessPayload["financials"][string]]>,
): number => {
  row = sectionTitle(ws, row, title);
  styleLabel(ws.getCell(row, 1));
  ws.getCell(row, 1).value = "구분";
  payload.meta.대상연도.forEach((year, index) => {
    styleTh(ws.getCell(row, index + 2));
    ws.getCell(row, index + 2).value = year;
  });
  row += 1;

  items.forEach(([label, key]) => {
    styleLabel(ws.getCell(row, 1));
    ws.getCell(row, 1).value = label;
    payload.meta.대상연도.forEach((year, index) => {
      const value = payload.financials[year]?.[key];
      const cell = ws.getCell(row, index + 2);
      styleVal(cell);
      cell.value = na(value ?? null);
      if (typeof value === "number") cell.numFmt = "#,##0";
    });
    row += 1;
  });
  return row;
};

const buildFinancialSheet = (workbook: ExcelJS.Workbook, payload: HarnessPayload): void => {
  const ws = workbook.addWorksheet("2.재무정보");
  for (let i = 1; i <= 8; i += 1) ws.getColumn(i).width = 16;

  let row = 1;
  row = writeThreeYearBlock(ws, row, "요약 재무상태표 (단위:천원)", payload, [
    ["유동자산", "current_assets"],
    ["비유동자산", "non_current_assets"],
    ["자산총계", "total_assets"],
    ["유동부채", "current_liabilities"],
    ["비유동부채", "non_current_liabilities"],
    ["부채총계", "total_liabilities"],
    ["자본금", "capital_stock"],
    ["미처분이익잉여금", "retained_earnings"],
    ["자본총계", "total_equity"],
  ]);
  row += 1;
  row = writeThreeYearBlock(ws, row, "요약 손익계산서 (단위:천원)", payload, [
    ["매출액", "revenue"],
    ["매출총이익", "gross_profit"],
    ["판관비", "sga"],
    ["영업이익", "operating_income"],
    ["영업외수익", "non_operating_income"],
    ["영업외비용", "non_operating_expense"],
    ["법인세전순손익", "pretax_income"],
    ["법인세", "corporate_tax"],
    ["당기순이익", "net_income"],
  ]);
  row += 1;
  row = sectionTitle(ws, row, "요약 재무비율");
  styleLabel(ws.getCell(row, 1));
  ws.getCell(row, 1).value = "항목";
  payload.meta.대상연도.forEach((year, index) => {
    styleTh(ws.getCell(row, index + 2));
    ws.getCell(row, index + 2).value = year;
  });
  row += 1;
  const ratioLabels = [
    "부채비율",
    "자기자본순이익률(ROE)",
    "매출액영업이익율",
    "유동비율",
    "매출액증가율",
    "총자산증가율",
  ];
  ratioLabels.forEach((label) => {
    styleLabel(ws.getCell(row, 1));
    ws.getCell(row, 1).value = label;
    payload.meta.대상연도.forEach((year, index) => {
      const value = payload.ratios[year]?.[label] ?? null;
      styleVal(ws.getCell(row, index + 2));
      ws.getCell(row, index + 2).value = na(value);
    });
    row += 1;
  });
};

const buildDiagnosisSheet = (workbook: ExcelJS.Workbook, payload: HarnessPayload): void => {
  const ws = workbook.addWorksheet("3.재무비율진단");
  for (let i = 1; i <= 8; i += 1) ws.getColumn(i).width = 15;

  let row = sectionTitle(ws, 1, "재무부문 진단등급 (자체기준 추정)");
  const sectionGrades = payload.diagnosis.부문등급 as Record<
    string,
    { 등급: string; 평균점수: number }
  >;
  Object.entries(sectionGrades).forEach(([section, grade]) => {
    styleLabel(ws.getCell(row, 1));
    ws.getCell(row, 1).value = section;
    styleVal(ws.getCell(row, 2));
    ws.getCell(row, 2).value = `${grade.등급} (${grade.평균점수})`;
    row += 1;
  });
  styleLabel(ws.getCell(row, 1));
  ws.getCell(row, 1).value = "종합진단등급";
  const overall = ws.getCell(row, 2);
  overall.value = `${payload.diagnosis.종합진단등급} (${payload.diagnosis.종합점수})`;
  overall.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFED7D31" } };
  overall.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 14 };
  overall.alignment = { horizontal: "center" };
};

const buildFundingSheet = (workbook: ExcelJS.Workbook, payload: HarnessPayload): void => {
  const ws = workbook.addWorksheet("4.자금조달");
  for (let i = 1; i <= 8; i += 1) ws.getColumn(i).width = 18;

  let row = sectionTitle(ws, 1, "차입금 구조 및 채무상환능력 (단위:천원)");
  const fundingRows: Array<[string, string | number | null]> = [
    ["차입금합계", payload.funding.차입금합계 as number],
    ["단기차입금", payload.funding.단기차입금 as number],
    ["장기차입금", payload.funding.장기차입금 as number],
    ["이자비용", payload.funding.이자비용 as number],
    ["영업이익이자보상배수", payload.funding["영업이익이자보상배수"] as string],
    ["EBITDA", payload.funding.EBITDA as number],
    ["EBITDA/이자비용", payload.funding["EBITDA/이자비용"] as string],
  ];
  fundingRows.forEach(([label, value]) => {
    styleLabel(ws.getCell(row, 1));
    ws.getCell(row, 1).value = label;
    const cell = ws.getCell(row, 2);
    styleVal(cell);
    cell.value = na(value);
    if (typeof value === "number") cell.numFmt = "#,##0.##";
    row += 1;
  });
};

const buildTaxSheet = (workbook: ExcelJS.Workbook, payload: HarnessPayload): void => {
  const ws = workbook.addWorksheet("5.세무진단");
  for (let i = 1; i <= 9; i += 1) ws.getColumn(i).width = 14;

  let row = sectionTitle(ws, 1, "상증법상 비상장주식 가치평가 (주당, 원)");
  const taxPairs: Array<[string, number | null]> = [
    ["주당 순자산가치", payload.tax_valuation.주당순자산가치],
    ["주당 순손익가치", payload.tax_valuation.주당순손익가치],
    ["부동산비중(%)", payload.tax_valuation.부동산비중],
    ["주당 평가액", payload.tax_valuation.주당평가액],
    ["액면가", payload.tax_valuation.액면가],
  ];
  taxPairs.forEach(([label, value]) => {
    styleLabel(ws.getCell(row, 1));
    ws.getCell(row, 1).value = label;
    const cell = ws.getCell(row, 2);
    styleVal(cell);
    cell.value = na(value);
    if (typeof value === "number") cell.numFmt = "#,##0";
    row += 1;
  });
};

const buildDisclaimerSheet = (workbook: ExcelJS.Workbook, payload: HarnessPayload): void => {
  const ws = workbook.addWorksheet("면책");
  ws.getCell(1, 1).value = payload.disclaimer;
  ws.getCell(1, 1).font = { italic: true, color: { argb: "FF808080" } };
  ws.getCell(1, 1).alignment = { wrapText: true };
};

export const buildDiagnosisHarnessWorkbook = async (
  report: CompanyDiagnosisReport,
  company: CompanyProfile,
): Promise<ExcelJS.Workbook> => {
  const ExcelJSImport = await import("exceljs");
  const ExcelJS = ExcelJSImport.default;
  const payload = buildHarnessPayload(report, company);
  const workbook = new ExcelJS.Workbook();
  buildOverviewSheet(workbook, payload);
  buildFinancialSheet(workbook, payload);
  buildDiagnosisSheet(workbook, payload);
  buildFundingSheet(workbook, payload);
  buildTaxSheet(workbook, payload);
  buildDisclaimerSheet(workbook, payload);
  return workbook;
};

export const downloadDiagnosisHarnessXlsx = async (
  report: CompanyDiagnosisReport,
  company: CompanyProfile,
): Promise<void> => {
  const workbook = await buildDiagnosisHarnessWorkbook(report, company);
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = buildHarnessXlsxFilename(report.companyName);
  anchor.click();
  URL.revokeObjectURL(url);
};
