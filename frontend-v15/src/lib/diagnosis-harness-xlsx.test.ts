import { describe, expect, it } from "vitest";
import { companyProfile } from "@/data/company";
import { matchingResults } from "@/data/matching";
import { buildCompanyDiagnosisReport } from "@/lib/company-diagnosis";
import {
  buildHarnessPayload,
  buildHarnessXlsxFilename,
  parsePerShareValue,
} from "@/lib/diagnosis-harness-data";

describe("diagnosis-harness-data", () => {
  const report = buildCompanyDiagnosisReport(companyProfile, matchingResults);

  it("parses per-share value from formatted string", () => {
    expect(parsePerShareValue("24,195원/주")).toBe(24195);
  });

  it("builds harness payload from the company's real financial statements", () => {
    const payload = buildHarnessPayload(report, companyProfile);
    expect(payload.company.name).toBe("와우그로스(주)");
    // 기본 프로필 재무제표(2023~2025, 백만원) 연동
    expect(payload.meta.대상연도).toEqual(["2023", "2024", "2025"]);
    // 2023 매출 800백만원 → 800,000천원
    expect(payload.financials["2023"]?.revenue).toBe(800_000);
    expect(payload.financials["2025"]?.total_equity).toBe(700_000);
    expect(payload.diagnosis.종합진단등급).toBe("B");
    expect(payload.commentary.overview).toContain("82");
  });

  it("falls back to demo financials when no statements are entered", () => {
    const payload = buildHarnessPayload(
      buildCompanyDiagnosisReport(
        { ...companyProfile, financials: undefined },
        matchingResults,
      ),
      { ...companyProfile, financials: undefined },
    );
    expect(payload.meta.대상연도).toEqual(["2021", "2022", "2023"]);
    expect(payload.financials["2023"]?.revenue).toBeGreaterThan(0);
  });

  it("builds safe xlsx filename", () => {
    expect(buildHarnessXlsxFilename("와우그로스(주)")).toBe("기업경영진단서-와우그로스(주).xlsx");
  });
});

describe("diagnosis-harness-xlsx", () => {
  it("creates workbook with harness sheet names", async () => {
    const report = buildCompanyDiagnosisReport(companyProfile, matchingResults);
    const { buildDiagnosisHarnessWorkbook } = await import("@/lib/diagnosis-harness-xlsx");
    const workbook = await buildDiagnosisHarnessWorkbook(report, companyProfile);
    expect(workbook.worksheets.map((sheet) => sheet.name)).toEqual([
      "1.기업개요",
      "2.재무정보",
      "3.재무비율진단",
      "4.자금조달",
      "5.세무진단",
    ]);
  });
});
