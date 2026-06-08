import { describe, expect, it } from "vitest";
import {
  computeFunding,
  computeKeyRatios,
  computePerShareValueWon,
  computeSectionScores,
  hasFinancialData,
} from "@/lib/company-financials";
import type { CompanyFinancials } from "@/types";

const financials: CompanyFinancials = {
  unitMultiplier: 1_000_000,
  shareCount: 100_000,
  interestExpense: 30,
  depreciation: 40,
  collateralBookValue: 500,
  existingDebt: 200,
  years: [
    {
      year: "2023",
      revenue: 800,
      operatingProfit: 50,
      netIncome: 40,
      totalAssets: 1_200,
      currentAssets: 700,
      currentLiabilities: 300,
      totalLiabilities: 800,
      totalEquity: 400,
    },
    {
      year: "2024",
      revenue: 1_000,
      operatingProfit: 70,
      netIncome: 55,
      totalAssets: 1_500,
      currentAssets: 850,
      currentLiabilities: 320,
      totalLiabilities: 950,
      totalEquity: 550,
    },
    {
      year: "2025",
      revenue: 1_200,
      operatingProfit: 95,
      netIncome: 78,
      totalAssets: 1_800,
      currentAssets: 1_000,
      currentLiabilities: 350,
      totalLiabilities: 1_100,
      totalEquity: 700,
    },
  ],
};

describe("company-financials", () => {
  it("detects whether financial data exists", () => {
    expect(hasFinancialData(undefined)).toBe(false);
    expect(hasFinancialData({ years: [] })).toBe(false);
    expect(hasFinancialData(financials)).toBe(true);
  });

  it("computes the six key ratios with correct values", () => {
    const { years, rows } = computeKeyRatios(financials);
    expect(years).toEqual(["2023", "2024", "2025"]);

    const debt = rows.find((r) => r.label === "부채비율(%)")!;
    // 2025: 1100 / 700 * 100 = 157.1
    expect(debt.values["2025"]).toBe(157.1);

    const roe = rows.find((r) => r.label.includes("ROE"))!;
    // 2025: 78 / 700 * 100 = 11.1
    expect(roe.values["2025"]).toBe(11.1);

    const opMargin = rows.find((r) => r.label.includes("영업이익율"))!;
    // 2025: 95 / 1200 * 100 = 7.9
    expect(opMargin.values["2025"]).toBe(7.9);

    const current = rows.find((r) => r.label === "유동비율(%)")!;
    // 2025: 1000 / 350 * 100 = 285.7
    expect(current.values["2025"]).toBe(285.7);

    const revGrowth = rows.find((r) => r.label === "매출액증가율(%)")!;
    expect(revGrowth.values["2023"]).toBeNull();
    // 2024: (1000-800)/800*100 = 25
    expect(revGrowth.values["2024"]).toBe(25);
  });

  it("handles zero denominators safely as null", () => {
    const ratios = computeKeyRatios({
      years: [
        {
          year: "2025",
          revenue: 0,
          operatingProfit: 10,
          netIncome: 5,
          totalAssets: 100,
          currentAssets: 50,
          currentLiabilities: 0,
          totalLiabilities: 30,
          totalEquity: 0,
        },
      ],
    });
    expect(ratios.rows.find((r) => r.label.includes("ROE"))!.values["2025"]).toBeNull();
    expect(ratios.rows.find((r) => r.label === "유동비율(%)")!.values["2025"]).toBeNull();
  });

  it("computes per-share value via 상증법 weighting", () => {
    const perShare = computePerShareValueWon(financials);
    expect(perShare).not.toBeNull();
    expect(perShare!).toBeGreaterThan(0);
  });

  it("returns null per-share when share count is missing", () => {
    expect(computePerShareValueWon({ ...financials, shareCount: 0 })).toBeNull();
  });

  it("computes funding snapshot with EBITDA/interest coverage", () => {
    const funding = computeFunding(financials);
    // EBITDA = (95 + 40)백만 = 135백만, 이자 30백만 → 4.5배
    expect(funding.ebitdaInterest).toBe("4.5배");
    // 담보 500백만 × 70% = 350백만 = 3.5억
    expect(funding.collateralLimit).toContain("억원");
  });

  it("marks EBITDA coverage as N/A when interest expense is missing", () => {
    const funding = computeFunding({ ...financials, interestExpense: 0 });
    expect(funding.ebitdaInterest).toContain("N/A");
  });

  it("derives section scores and notes from financial ratios", () => {
    const sections = computeSectionScores(financials, 82);
    expect(sections.map((s) => s.section)).toEqual([
      "안정성",
      "수익성",
      "활동성",
      "성장성",
    ]);

    const stability = sections.find((s) => s.section === "안정성")!;
    // 부채비율 157.1 → 80, 유동비율 285.7 → 90 → 평균 85
    expect(stability.score).toBe(85);
    expect(stability.note).toContain("부채비율 157.1%");

    const growth = sections.find((s) => s.section === "성장성")!;
    // 매출/자산 증가율 모두 20% → 90
    expect(growth.score).toBe(90);
  });

  it("uses fallback score for sections without computable ratios", () => {
    const sections = computeSectionScores(
      {
        shareCount: 0,
        years: [
          {
            year: "2025",
            revenue: 0,
            operatingProfit: 0,
            netIncome: 0,
            totalAssets: 0,
            currentAssets: 0,
            currentLiabilities: 0,
            totalLiabilities: 0,
            totalEquity: 0,
          },
        ],
      },
      70,
    );
    // 모든 분모 0 → 계산 불가 → fallback 70 (clamp 45~95)
    expect(sections.every((s) => s.score === 70)).toBe(true);
  });
});
