import { describe, expect, it } from "vitest";
import { companyProfile } from "@/data/company";
import { matchingResults } from "@/data/matching";
import {
  buildCompanyDiagnosisReport,
  COMMENTARY_SECTIONS,
} from "@/lib/company-diagnosis";

describe("company-diagnosis", () => {
  it("builds harness-aligned report with commentary and section grades", () => {
    const report = buildCompanyDiagnosisReport(companyProfile, matchingResults);

    expect(report.companyName).toBe("와우그로스(주)");
    expect(report.overallScore).toBe(82);
    expect(report.overallGrade).toBe("B");
    expect(report.sectionGrades).toHaveLength(4);
    expect(report.sectionGrades[0]?.section).toBe("안정성");
    expect(COMMENTARY_SECTIONS).toHaveLength(6);
    expect(report.commentary.overview).toContain("82");
    expect(report.keyRatios.length).toBeGreaterThan(0);
    // 기본 프로필에 재무제표가 연동되어 입력 연도·계산값을 사용
    expect(report.ratioYears).toEqual(["2023", "2024", "2025"]);
    const debtRatio = report.keyRatios.find((r) => r.label === "부채비율(%)");
    expect(debtRatio?.values["2025"]).toBe(157.1);
    expect(report.tax.note).toContain("순손익가치");
    expect(report.topMatches[0]?.score).toBeGreaterThanOrEqual(88);
    expect(report.disclaimer).toContain("IU.Partners");
  });

  it("falls back to demo estimates when no financials are provided", () => {
    const report = buildCompanyDiagnosisReport(
      { ...companyProfile, financials: undefined },
      matchingResults,
    );
    expect(report.ratioYears).toEqual(["2021", "2022", "2023"]);
    expect(report.tax.note).toContain("재무제표 입력 시 산출");
    expect(report.tax.perShareValue).toContain("원/주");
  });

  it("guides input instead of demo value when share count is missing", () => {
    const report = buildCompanyDiagnosisReport(
      {
        ...companyProfile,
        financials: { ...companyProfile.financials!, shareCount: 0 },
      },
      matchingResults,
    );
    expect(report.tax.perShareValue).toBe("발행주식수 입력 필요");
  });
});
