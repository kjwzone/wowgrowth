import type { BusinessPlanDraft } from "@/types";
import type { SubmissionCheckItem } from "@/lib/business-plan-submission";

const MIN_SECTION_LENGTH = 20;

export type RemediationAction =
  | { type: "jump-section"; sectionId: string }
  | { type: "generate-full"; mode: "fast" | "pipeline" }
  | { type: "generate-section"; sectionId: string };

export type RemediationStep = {
  checklistItem: string;
  label: string;
  description?: string;
  action: RemediationAction;
  priority: number;
};

const firstEmptySection = (draft: BusinessPlanDraft) =>
  draft.sections.find((section) => section.content.trim().length < MIN_SECTION_LENGTH);

const weakestSection = (draft: BusinessPlanDraft) =>
  [...draft.sections].sort((a, b) => a.completeness - b.completeness)[0];

const matchesItem = (item: SubmissionCheckItem, keywords: string[]) =>
  keywords.some((keyword) => item.item.toLowerCase().includes(keyword.toLowerCase()));

export const resolveRemediationForItem = (
  draft: BusinessPlanDraft,
  item: SubmissionCheckItem,
): RemediationStep | null => {
  if (item.pass) return null;

  if (matchesItem(item, ["필수 섹션", "미작성", "섹션 작성"])) {
    const target = firstEmptySection(draft);
    if (!target) return null;
    return {
      checklistItem: item.item,
      label: "보완하기",
      description: `「${target.title}」 섹션으로 이동해 작성합니다.`,
      action: { type: "jump-section", sectionId: target.id },
      priority: 2,
    };
  }

  if (matchesItem(item, ["완성도"])) {
    return {
      checklistItem: item.item,
      label: "보완하기",
      description: "전체 AI 생성으로 완성도를 올립니다.",
      action: { type: "generate-full", mode: "fast" },
      priority: 3,
    };
  }

  if (matchesItem(item, ["파이프라인", "submission-verifier", "submission"])) {
    return {
      checklistItem: item.item,
      label: "보완하기",
      description: "고품질 생성으로 스킬 파이프라인을 완료합니다.",
      action: { type: "generate-full", mode: "pipeline" },
      priority: 1,
    };
  }

  if (matchesItem(item, ["규정", "compliance", "준수"])) {
    const target = firstEmptySection(draft) ?? weakestSection(draft);
    if (target.content.trim().length < MIN_SECTION_LENGTH) {
      return {
        checklistItem: item.item,
        label: "보완하기",
        description: `「${target.title}」 섹션을 먼저 작성합니다.`,
        action: { type: "jump-section", sectionId: target.id },
        priority: 2,
      };
    }
    return {
      checklistItem: item.item,
      label: "보완하기",
      description: "고품질 생성 후 다시 제출 검증을 실행합니다.",
      action: { type: "generate-full", mode: "pipeline" },
      priority: 4,
    };
  }

  const fallback = firstEmptySection(draft);
  if (fallback) {
    return {
      checklistItem: item.item,
      label: "보완하기",
      description: `「${fallback.title}」 섹션으로 이동합니다.`,
      action: { type: "jump-section", sectionId: fallback.id },
      priority: 5,
    };
  }

  return {
    checklistItem: item.item,
    label: "보완하기",
    description: "전체 AI 생성을 실행합니다.",
    action: { type: "generate-full", mode: "fast" },
    priority: 5,
  };
};

export const resolveRemediationSteps = (
  draft: BusinessPlanDraft,
  checklist: SubmissionCheckItem[],
): RemediationStep[] =>
  checklist
    .map((item) => resolveRemediationForItem(draft, item))
    .filter((step): step is RemediationStep => step !== null)
    .sort((a, b) => a.priority - b.priority);

export const getPrimaryRemediation = (
  draft: BusinessPlanDraft,
  checklist: SubmissionCheckItem[],
): RemediationStep | null => resolveRemediationSteps(draft, checklist)[0] ?? null;
