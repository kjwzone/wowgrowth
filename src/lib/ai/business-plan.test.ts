import { describe, expect, it } from "vitest";
import { buildStartupInputPayload } from "@/lib/ai/business-plan-context";
import { buildBusinessPlanPrompt } from "@/lib/ai/business-plan";
import { STARTUP_PACKAGE_PLAN_INSTRUCTIONS } from "@/lib/ai/prompts/startup-package-plan-instructions";
import type { Company } from "@/lib/types/database";

const baseCompany: Company = {
  id: "c1",
  owner_id: "u1",
  company_name: "테스트주식회사",
  business_number: "123-45-67890",
  industry: "IT",
  region: "서울",
  founded_year: 2020,
  certifications: ["벤처인증"],
  patents: ["특허-001"],
  financials: { revenue_2024: 100000000 },
  created_at: "",
  updated_at: "",
};

describe("business plan prompt v2", () => {
  it("includes startup package instructions", () => {
    const prompt = buildBusinessPlanPrompt({
      company: baseCompany,
      program: {
        title: "2026 창업패키지",
        agency: "중기부",
        content_raw: "공고 원문",
        region: "전국",
        category: "창업",
      },
      programMeta: { summary: "요약" },
      matching: {
        score: 85,
        recommendation_level: "high",
        reasons: ["업종 적합"],
        risks: ["매출 규모"],
        improvement_tasks: ["PoC 확보"],
      },
      diagnosis: null,
      attachmentsNote: "PDF 미첨부",
    });
    expect(prompt).toContain(STARTUP_PACKAGE_PLAN_INSTRUCTIONS.slice(0, 40));
    expect(prompt).toContain("테스트주식회사");
    expect(prompt).toContain("마침표 금지");
    expect(prompt).toContain("일반현황");
  });

  it("builds startup input with company and matching", () => {
    const input = buildStartupInputPayload({
      company: baseCompany,
      program: { title: "공고", agency: "기관", content_raw: null, region: null, category: null },
      programMeta: null,
      matching: {
        score: 70,
        recommendation_level: "medium",
        reasons: ["A"],
        risks: [],
        improvement_tasks: [],
      },
      diagnosis: null,
      attachmentsNote: "test",
    });
    expect(input.기업_일반현황).toMatchObject({ 기업명: "테스트주식회사" });
    expect(input.추천분석).toMatchObject({ score: 70 });
  });
});
