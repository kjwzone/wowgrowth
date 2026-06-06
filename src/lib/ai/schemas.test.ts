import { describe, expect, it } from "vitest";
import { businessPlanDraftSchema, diagnosisReportSchema } from "@/lib/ai/schemas";

describe("MVP-1.5 schemas", () => {
  it("validates diagnosis report", () => {
    const result = diagnosisReportSchema.safeParse({
      company_summary: "요약",
      strengths: ["A"],
      weaknesses: ["B"],
      financial_diagnosis: "재무",
      non_financial_diagnosis: "비재무",
      government_support_readiness: "준비",
      recommended_actions: ["조치"],
      overall_comment: "코멘트",
    });
    expect(result.success).toBe(true);
  });

  it("validates business plan draft v2", () => {
    const result = businessPlanDraftSchema.safeParse({
      title: "계획서",
      premises: "작성 전제",
      sections: [
        { section_title: "일반현황", content: "■ 항목\n- 내용" },
        { section_title: "1. 문제 인식 Problem_창업 아이템의 필요성", content: "■ 핵심 문제" },
      ],
      self_verification: [{ item: "양식 준수", result: "충족" }],
      key_risks: ["시장 수치 출처 보완 필요"],
      evidence_checklist: ["매출 증빙"],
    });
    expect(result.success).toBe(true);
  });
});
