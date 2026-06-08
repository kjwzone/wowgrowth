import { describe, expect, it } from "vitest";
import {
  extractDiagnosisScore,
  mapBusinessPlanRows,
  mapCompanyRows,
  mapDiagnosisRows,
  mapMatchingRows,
} from "./admin-dashboard-mappers.mjs";

describe("admin-dashboard-mappers", () => {
  it("extracts diagnosis score from report json", () => {
    expect(extractDiagnosisScore({ overallScore: 82.4 })).toBe(82);
    expect(extractDiagnosisScore({ company_summary: "요약" })).toBeNull();
  });

  it("maps company rows", () => {
    expect(
      mapCompanyRows([
        {
          id: "c1",
          company_name: "와우그로스",
          business_number: "123-45-67890",
          industry: "IT",
          region: "경기",
          created_at: "2026-06-01T00:00:00Z",
          updated_at: "2026-06-02T00:00:00Z",
        },
      ]),
    ).toEqual([
      {
        id: "c1",
        companyName: "와우그로스",
        businessNumber: "123-45-67890",
        industry: "IT",
        region: "경기",
        createdAt: "2026-06-01T00:00:00Z",
        updatedAt: "2026-06-02T00:00:00Z",
      },
    ]);
  });

  it("maps diagnosis rows with nested company", () => {
    const rows = mapDiagnosisRows([
      {
        id: "d1",
        company_id: "c1",
        status: "approved",
        model: "gemini",
        created_at: "2026-06-01T00:00:00Z",
        updated_at: "2026-06-02T00:00:00Z",
        report_json: { overall_score: 77 },
        companies: { company_name: "와우그로스" },
      },
    ]);

    expect(rows[0]).toMatchObject({
      companyName: "와우그로스",
      overallScore: 77,
      status: "approved",
    });
  });

  it("maps matching and business plan rows", () => {
    const matching = mapMatchingRows([
      {
        id: "m1",
        company_id: "c1",
        program_id: "p1",
        score: 91,
        recommendation_level: "high",
        status: "approved",
        reasons: ["a", "b"],
        created_at: "2026-06-01T00:00:00Z",
        companies: { company_name: "와우그로스" },
        support_programs: { title: "창업패키지", agency: "중기부", status: "published" },
      },
    ]);

    expect(matching[0]).toMatchObject({
      programTitle: "창업패키지",
      score: 91,
      reasonCount: 2,
    });

    const plans = mapBusinessPlanRows([
      {
        id: "bp1",
        company_id: "c1",
        program_id: "p1",
        title: "2026 사업계획서",
        status: "reviewing",
        model: "gemini",
        plan_json: { sections: [{}, {}] },
        created_at: "2026-06-01T00:00:00Z",
        updated_at: "2026-06-03T00:00:00Z",
        companies: { company_name: "와우그로스" },
        support_programs: { title: "창업패키지", agency: "중기부" },
      },
    ]);

    expect(plans[0]).toMatchObject({
      sectionCount: 2,
      title: "2026 사업계획서",
    });
  });
});
