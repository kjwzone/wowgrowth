import type { CompanyFinancials, FinancialYear } from "@/types";

export const DEFAULT_UNIT_MULTIPLIER = 1_000_000; // 백만원 → 원

export type FinancialRatioRow = {
  label: string;
  values: Record<string, number | null>;
};

export type FinancialRatios = {
  years: string[];
  rows: FinancialRatioRow[];
};

export type FundingSnapshotResult = {
  collateralLimit: string;
  creditLimit: string;
  additionalCapacity: string;
  ebitdaInterest: string;
};

const yearHasData = (year: FinancialYear): boolean =>
  [
    year.revenue,
    year.operatingProfit,
    year.netIncome,
    year.totalAssets,
    year.currentAssets,
    year.currentLiabilities,
    year.totalLiabilities,
    year.totalEquity,
  ].some((value) => Number.isFinite(value) && value !== 0);

/** 재무제표에 의미 있는 입력이 있는지 (계산 가능 여부) */
export const hasFinancialData = (
  financials: CompanyFinancials | undefined,
): financials is CompanyFinancials =>
  !!financials &&
  Array.isArray(financials.years) &&
  financials.years.some(yearHasData);

const sortedYears = (financials: CompanyFinancials): FinancialYear[] =>
  [...financials.years]
    .filter((year) => year.year.trim().length > 0)
    .sort((a, b) => a.year.localeCompare(b.year));

const round1 = (value: number): number => Math.round(value * 10) / 10;

const safeRatio = (numerator: number, denominator: number): number | null =>
  denominator === 0 ? null : round1((numerator / denominator) * 100);

export const computeKeyRatios = (
  financials: CompanyFinancials,
): FinancialRatios => {
  const years = sortedYears(financials);
  const yearKeys = years.map((year) => year.year);

  const byKey = (
    compute: (year: FinancialYear, index: number) => number | null,
  ): Record<string, number | null> =>
    Object.fromEntries(years.map((year, index) => [year.year, compute(year, index)]));

  return {
    years: yearKeys,
    rows: [
      {
        label: "부채비율(%)",
        values: byKey((year) => safeRatio(year.totalLiabilities, year.totalEquity)),
      },
      {
        label: "자기자본순이익률(ROE)",
        values: byKey((year) => safeRatio(year.netIncome, year.totalEquity)),
      },
      {
        label: "매출액영업이익율(%)",
        values: byKey((year) => safeRatio(year.operatingProfit, year.revenue)),
      },
      {
        label: "유동비율(%)",
        values: byKey((year) => safeRatio(year.currentAssets, year.currentLiabilities)),
      },
      {
        label: "매출액증가율(%)",
        values: byKey((year, index) =>
          index === 0 ? null : safeRatio(year.revenue - years[index - 1]!.revenue, years[index - 1]!.revenue),
        ),
      },
      {
        label: "총자산증가율(%)",
        values: byKey((year, index) =>
          index === 0
            ? null
            : safeRatio(year.totalAssets - years[index - 1]!.totalAssets, years[index - 1]!.totalAssets),
        ),
      },
    ],
  };
};

/** 상증법 보충적 평가(비상장): 순손익가치 3 : 순자산가치 2 가중 (원/주) */
export const computePerShareValueWon = (
  financials: CompanyFinancials,
): number | null => {
  const shareCount = financials.shareCount ?? 0;
  if (shareCount <= 0) return null;

  const mult = financials.unitMultiplier ?? DEFAULT_UNIT_MULTIPLIER;
  const years = sortedYears(financials);
  if (years.length === 0) return null;

  const latest = years[years.length - 1]!;
  const netAssetPerShare = (latest.totalEquity * mult) / shareCount;

  // 최근 연도부터 가중치 3,2,1 적용 (가용 연도만)
  const recent = years.slice(-3).reverse();
  const weights = [3, 2, 1];
  let weightedSum = 0;
  let weightTotal = 0;
  recent.forEach((year, index) => {
    const weight = weights[index] ?? 0;
    weightedSum += year.netIncome * weight;
    weightTotal += weight;
  });
  const weightedNetIncome = weightTotal === 0 ? 0 : weightedSum / weightTotal;

  if (weightedNetIncome <= 0) {
    return Math.round(netAssetPerShare);
  }

  const capitalizationRate = 0.1; // 환원율 10%
  const netIncomePerShare =
    ((weightedNetIncome * mult) / capitalizationRate) / shareCount;

  const perShare = (netIncomePerShare * 3 + netAssetPerShare * 2) / 5;
  return Math.round(perShare);
};

const formatEok = (won: number): string => {
  const eok = won / 100_000_000;
  return `${eok.toLocaleString("ko-KR", { maximumFractionDigits: 1 })}억원`;
};

export const computeFunding = (
  financials: CompanyFinancials,
): FundingSnapshotResult => {
  const mult = financials.unitMultiplier ?? DEFAULT_UNIT_MULTIPLIER;
  const years = sortedYears(financials);
  const latest = years[years.length - 1];

  const collateralWon = (financials.collateralBookValue ?? 0) * mult;
  const equityWon = (latest?.totalEquity ?? 0) * mult;
  const existingDebtWon = (financials.existingDebt ?? 0) * mult;

  const collateralLimitWon = collateralWon * 0.7; // LTV 70% 추정
  const creditLimitWon = Math.max(0, equityWon) * 0.3; // 자본총계 30% 추정
  const additionalWon = collateralLimitWon + creditLimitWon - existingDebtWon;

  const opProfitWon = (latest?.operatingProfit ?? 0) * mult;
  const depreciationWon = (financials.depreciation ?? 0) * mult;
  const interestWon = (financials.interestExpense ?? 0) * mult;
  const ebitda = opProfitWon + depreciationWon;
  const ebitdaInterest =
    interestWon > 0
      ? `${(ebitda / interestWon).toLocaleString("ko-KR", { maximumFractionDigits: 2 })}배`
      : "N/A (이자비용 입력 필요)";

  return {
    collateralLimit:
      collateralWon > 0 ? formatEok(collateralLimitWon) : "N/A (담보 장부가 입력 필요)",
    creditLimit: formatEok(creditLimitWon),
    additionalCapacity: formatEok(additionalWon),
    ebitdaInterest,
  };
};

export const createEmptyFinancialYear = (year: string): FinancialYear => ({
  year,
  revenue: 0,
  operatingProfit: 0,
  netIncome: 0,
  totalAssets: 0,
  currentAssets: 0,
  currentLiabilities: 0,
  totalLiabilities: 0,
  totalEquity: 0,
});
