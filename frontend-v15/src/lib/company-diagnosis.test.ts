import { describe, expect, it } from "vitest";
import { companyProfile } from "@/data/company";
import { matchingResults } from "@/data/matching";
import { buildCompanyDiagnosisReport } from "@/lib/company-diagnosis";

describe("company-diagnosis", () => {
  it("builds report with dimensions and top matches", () => {
    const report = buildCompanyDiagnosisReport(companyProfile, matchingResults);

    expect(report.companyName).toBe("와우그로스(주)");
    expect(report.overallScore).toBe(82);
    expect(report.dimensions).toHaveLength(4);
    expect(report.topMatches[0]?.score).toBeGreaterThanOrEqual(88);
    expect(report.recommendations.length).toBeGreaterThan(0);
  });
});
