import { describe, expect, it } from "vitest";
import {
  adaptApiPlanToDraft,
  mergeSectionIntoDraft,
  pipelineStepsFromApiStages,
} from "@/lib/business-plan-adapter";
import type { SupportProgram } from "@/types";

const program: SupportProgram = {
  id: "prog-001",
  title: "2026 초기창업패키지",
  agency: "창업진흥원",
  category: "창업",
  region: "전국",
  supportAmount: "최대 1억원",
  deadline: "2026-06-30",
  daysLeft: 24,
  matchScore: 94,
  status: "모집중",
  summary: "요약",
  target: ["창업 3년 이내"],
  benefits: ["자금"],
  period: "2026",
  documents: ["사업계획서"],
  aiFitAnalysis: "적합",
  strategyTip: "전략",
};

describe("business-plan-adapter", () => {
  it("maps API plan sections to UI draft", () => {
    const draft = adaptApiPlanToDraft(
      {
        title: "테스트 계획서",
        sections: [
          { section_title: "일반현황", content: "■ 기업명: 테스트".repeat(5) },
        ],
      },
      { programId: "prog-001", program },
    );

    expect(draft.sections[0]?.title).toBe("일반현황");
    expect(draft.skillId).toBe("business-plan-writer");
    expect(draft.overallCompleteness).toBeGreaterThan(50);
  });

  it("merges section content into draft", () => {
    const base = adaptApiPlanToDraft(
      { title: "t", sections: [{ section_title: "일반현황", content: "old" }] },
      { programId: "prog-001", program },
    );
    const updated = mergeSectionIntoDraft(base, "일반현황", "■ 심화 — 테스트\n· 항목");
    expect(updated.sections[0]?.content).toContain("심화");
  });

  it("maps pipeline stages to UI steps", () => {
    const steps = pipelineStepsFromApiStages(
      [{ stage: "plan", label: "작성", status: "done" }],
      "business-plan-writer",
    );
    expect(steps[0]?.agent).toBe("plan-writer");
    expect(steps[0]?.status).toBe("done");
  });
});
