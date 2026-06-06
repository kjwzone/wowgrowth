import { createEmptyDraft } from "@/lib/business-plan-generator";
import type { BusinessPlanDraft } from "@/types";

/** 초기창업패키지 — business-plan-writer 스킬 양식 (일부 섹션만 사전 작성) */
export const businessPlanDraft: BusinessPlanDraft = (() => {
  const draft = createEmptyDraft("prog-001");
  return {
    ...draft,
    overallCompleteness: 68,
    sections: draft.sections.map((section) => {
      if (section.title === "3. 성장전략 Scale-up_사업화 추진 전략") {
        return { ...section, content: "", completeness: 20 };
      }
      if (section.title === "4. 팀 구성 Team_대표자 및 팀원 구성 계획") {
        return { ...section, content: "", completeness: 15 };
      }
      return section;
    }),
  };
})();
