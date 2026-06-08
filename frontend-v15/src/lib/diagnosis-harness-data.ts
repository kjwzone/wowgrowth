import type { CompanyDiagnosisReport } from "@/lib/company-diagnosis";
import { hasFinancialData } from "@/lib/company-financials";
import type { CompanyProfile } from "@/types";

const UNIT_TO_THOUSAND = 1000; // 입력 백만원 → 하네스 천원 단위

export type HarnessFinancialYear = {
  current_assets: number;
  non_current_assets: number;
  total_assets: number;
  current_liabilities: number;
  non_current_liabilities: number;
  total_liabilities: number;
  capital_stock: number;
  retained_earnings: number;
  total_equity: number;
  revenue: number;
  gross_profit: number;
  sga: number;
  operating_income: number;
  non_operating_income: number;
  non_operating_expense: number;
  pretax_income: number;
  corporate_tax: number;
  net_income: number;
  interest_expense: number;
  short_term_debt: number;
  long_term_debt: number;
};

export type HarnessPayload = {
  meta: { 생성일: string; 대상연도: string[] };
  company: Record<string, string | number | undefined>;
  shareholders: Array<Record<string, string | number | undefined>>;
  financials: Record<string, HarnessFinancialYear>;
  ratios: Record<string, Record<string, number | null>>;
  diagnosis: Record<string, unknown>;
  funding: Record<string, string | number | null>;
  tax_valuation: Record<string, number | null>;
  commentary: CompanyDiagnosisReport["commentary"];
  disclaimer: string;
};

const BASE_FINANCIALS: Record<string, HarnessFinancialYear> = {
  "2021": {
    current_assets: 820_000,
    non_current_assets: 180_000,
    total_assets: 1_000_000,
    current_liabilities: 320_000,
    non_current_liabilities: 130_000,
    total_liabilities: 450_000,
    capital_stock: 100_000,
    retained_earnings: 450_000,
    total_equity: 550_000,
    revenue: 900_000,
    gross_profit: 360_000,
    sga: 250_000,
    operating_income: 110_000,
    non_operating_income: 8_000,
    non_operating_expense: 12_000,
    pretax_income: 106_000,
    corporate_tax: 10_600,
    net_income: 95_400,
    interest_expense: 10_000,
    short_term_debt: 80_000,
    long_term_debt: 50_000,
  },
  "2022": {
    current_assets: 910_000,
    non_current_assets: 195_000,
    total_assets: 1_105_000,
    current_liabilities: 300_000,
    non_current_liabilities: 125_000,
    total_liabilities: 425_000,
    capital_stock: 100_000,
    retained_earnings: 580_000,
    total_equity: 680_000,
    revenue: 1_050_000,
    gross_profit: 420_000,
    sga: 280_000,
    operating_income: 95_000,
    non_operating_income: 6_000,
    non_operating_expense: 11_000,
    pretax_income: 90_000,
    corporate_tax: 9_000,
    net_income: 81_000,
    interest_expense: 9_500,
    short_term_debt: 70_000,
    long_term_debt: 55_000,
  },
  "2023": {
    current_assets: 980_000,
    non_current_assets: 210_000,
    total_assets: 1_190_000,
    current_liabilities: 280_000,
    non_current_liabilities: 120_000,
    total_liabilities: 400_000,
    capital_stock: 100_000,
    retained_earnings: 690_000,
    total_equity: 790_000,
    revenue: 1_200_000,
    gross_profit: 480_000,
    sga: 300_000,
    operating_income: 120_000,
    non_operating_income: 7_000,
    non_operating_expense: 10_500,
    pretax_income: 116_500,
    corporate_tax: 11_650,
    net_income: 104_850,
    interest_expense: 9_000,
    short_term_debt: 60_000,
    long_term_debt: 60_000,
  },
};

const ratioFromFinancials = (
  financials: Record<string, HarnessFinancialYear>,
  years: string[],
): Record<string, Record<string, number | null>> => {
  const result: Record<string, Record<string, number | null>> = {};

  years.forEach((year, index) => {
    const current = financials[year];
    const previous = index > 0 ? financials[years[index - 1]!] : undefined;
    if (!current) return;

    const debtRatio =
      current.total_equity > 0
        ? Math.round((current.total_liabilities / current.total_equity) * 1000) / 10
        : null;
    const roe =
      current.total_equity > 0
        ? Math.round((current.net_income / current.total_equity) * 1000) / 10
        : null;
    const opMargin =
      current.revenue > 0
        ? Math.round((current.operating_income / current.revenue) * 1000) / 10
        : null;
    const currentRatio =
      current.current_liabilities > 0
        ? Math.round((current.current_assets / current.current_liabilities) * 1000) / 10
        : null;
    const revenueGrowth =
      previous && previous.revenue > 0
        ? Math.round(((current.revenue - previous.revenue) / previous.revenue) * 1000) / 10
        : null;
    const assetGrowth =
      previous && previous.total_assets > 0
        ? Math.round(
            ((current.total_assets - previous.total_assets) / previous.total_assets) * 1000,
          ) / 10
        : null;

    result[year] = {
      부채비율: debtRatio,
      "자기자본순이익률(ROE)": roe,
      매출액영업이익율: opMargin,
      유동비율: currentRatio,
      매출액증가율: revenueGrowth,
      총자산증가율: assetGrowth,
      자기자본비율:
        current.total_assets > 0
          ? Math.round((current.total_equity / current.total_assets) * 1000) / 10
          : null,
      매출액순이익율:
        current.revenue > 0
          ? Math.round((current.net_income / current.revenue) * 1000) / 10
          : null,
    };
  });

  return result;
};

/** 입력된 기업 재무제표(백만원)를 하네스 재무 구조(천원)로 변환 */
const companyFinancialsToHarness = (
  company: CompanyProfile,
): { years: string[]; financials: Record<string, HarnessFinancialYear> } | null => {
  if (!hasFinancialData(company.financials)) return null;
  const fin = company.financials;

  const sorted = [...fin.years]
    .filter((year) => year.year.trim().length > 0)
    .sort((a, b) => a.year.localeCompare(b.year));
  if (sorted.length === 0) return null;

  const k = (value: number): number => Math.round(value * UNIT_TO_THOUSAND);
  const interest = k(fin.interestExpense ?? 0);
  const debt = k(fin.existingDebt ?? 0);

  const financials: Record<string, HarnessFinancialYear> = {};
  sorted.forEach((year) => {
    financials[year.year] = {
      current_assets: k(year.currentAssets),
      non_current_assets: k(year.totalAssets - year.currentAssets),
      total_assets: k(year.totalAssets),
      current_liabilities: k(year.currentLiabilities),
      non_current_liabilities: k(year.totalLiabilities - year.currentLiabilities),
      total_liabilities: k(year.totalLiabilities),
      capital_stock: 0,
      retained_earnings: k(year.totalEquity),
      total_equity: k(year.totalEquity),
      revenue: k(year.revenue),
      gross_profit: 0,
      sga: 0,
      operating_income: k(year.operatingProfit),
      non_operating_income: 0,
      non_operating_expense: 0,
      pretax_income: k(year.netIncome),
      corporate_tax: 0,
      net_income: k(year.netIncome),
      interest_expense: interest,
      short_term_debt: debt,
      long_term_debt: 0,
    };
  });

  return { years: sorted.map((year) => year.year), financials };
};

export const parsePerShareValue = (value: string): number | null => {
  const digits = value.replace(/[^\d]/g, "");
  if (!digits) return null;
  return Number(digits);
};

export const buildHarnessPayload = (
  report: CompanyDiagnosisReport,
  company: CompanyProfile,
): HarnessPayload => {
  const realFinancials = companyFinancialsToHarness(company);
  const years = realFinancials
    ? realFinancials.years
    : report.ratioYears.length > 0
      ? report.ratioYears
      : ["2021", "2022", "2023"];
  const financials =
    realFinancials?.financials ??
    (Object.fromEntries(
      years.map((year) => [year, BASE_FINANCIALS[year] ?? BASE_FINANCIALS["2023"]!]),
    ) as Record<string, HarnessFinancialYear>);

  const ratios = ratioFromFinancials(financials, years);
  report.keyRatios.forEach((row) => {
    years.forEach((year) => {
      if (!ratios[year]) ratios[year] = {};
      const value = row.values[year];
      if (value !== undefined) {
        ratios[year]![row.label.replace("(%)", "").replace("(ROE)", "(ROE)")] = value;
        ratios[year]![row.label] = value;
      }
    });
  });

  const perShare = parsePerShareValue(report.tax.perShareValue);

  return {
    meta: { 생성일: report.generatedAt, 대상연도: years },
    company: {
      name: company.name,
      ceo: "대표자",
      type: "주식회사",
      establish_date: "2019-03-01",
      biz_no: company.businessNumber,
      phone: "031-000-0000",
      business_type: company.industry,
      item: company.industry,
      industry_code: "J62010",
      industry_name: company.industry,
      main_product: company.product,
      employees: company.employees,
      export: "무",
      address_hq: company.region ? `${company.region} · 본사` : "본사",
    },
    shareholders: [
      {
        name: "대표주주",
        shares: 10_000,
        ratio: 100,
        capital: 100_000,
        관계: "대표/경영실권자",
      },
    ],
    financials,
    ratios,
    diagnosis: {
      available: false,
      종합진단등급: report.overallGrade,
      종합점수: report.overallScore,
      부문등급: Object.fromEntries(
        report.sectionGrades.map((section) => [
          section.section,
          { 등급: section.grade, 평균점수: section.score },
        ]),
      ),
    },
    funding: {
      차입금합계: 120_000,
      단기차입금: 60_000,
      장기차입금: 60_000,
      이자비용: 9_000,
      "영업이익이자보상배수": report.funding.ebitdaInterest,
      EBITDA: 129_000,
      "EBITDA/이자비용": report.funding.ebitdaInterest,
      담보대출한도: 1_553_000,
      "신용대출한도(매출25%)": 486_346,
      추가대출여력: -760_734,
      "1회전운전자본": 180_000,
      매출10억증대시필요자금: 150_000,
    },
    tax_valuation: {
      주당순자산가치: perShare ? Math.round(perShare * 0.6) : null,
      주당순손익가치: perShare ? Math.round(perShare * 0.4) : null,
      부동산비중: 15,
      주당평가액: perShare,
      액면가: 5_000,
    },
    commentary: report.commentary,
    disclaimer: report.disclaimer,
  };
};

export const buildHarnessXlsxFilename = (companyName: string): string =>
  `기업경영진단서-${companyName.replace(/\s+/g, "-")}.xlsx`;
