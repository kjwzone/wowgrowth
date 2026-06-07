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
    expect(report.ratioYears).toEqual(["2021", "2022", "2023"]);
    expect(report.topMatches[0]?.score).toBeGreaterThanOrEqual(88);
    expect(report.disclaimer).toContain("IU.Partners");
  });
});
