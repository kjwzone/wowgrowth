import type { BusinessPlanDraft } from "@/types";

export type SubmissionCheckItem = {
  item: string;
  pass: boolean;
  note?: string;
};

export type SubmissionCheckResult = {
  ok: boolean;
  errors: string[];
  checklist: SubmissionCheckItem[];
};

const MIN_SECTION_LENGTH = 20;
const MIN_COMPLETENESS = 70;

export const validateForSubmission = (
  draft: BusinessPlanDraft,
): SubmissionCheckResult => {
  const emptySections = draft.sections.filter(
    (s) => s.content.trim().length < MIN_SECTION_LENGTH,
  );
  const pipelineDone =
    draft.pipelineSteps?.every((s) => s.status === "done") ?? false;

  const checklist: SubmissionCheckItem[] = [
    {
      item: "필수 섹션 작성",
      pass: emptySections.length === 0,
      note:
        emptySections.length > 0
          ? `미작성 ${emptySections.length}개: ${emptySections.map((s) => s.title).join(", ")}`
          : undefined,
    },
    {
      item: "전체 완성도 70% 이상",
      pass: draft.overallCompleteness >= MIN_COMPLETENESS,
      note: `현재 ${draft.overallCompleteness}%`,
    },
    {
      item: "스킬 파이프라인 완료 (submission-verifier)",
      pass: pipelineDone,
      note: pipelineDone ? undefined : "「전체 사업계획서 AI 생성」을 먼저 실행하세요.",
    },
    {
      item: "규정 준수 검증 (compliance-checker)",
      pass: draft.status === "review" || draft.status === "ready",
      note: "상태가 review 또는 ready여야 합니다.",
    },
  ];

  const errors = checklist.filter((c) => !c.pass).map((c) => c.note ?? c.item);

  return { ok: errors.length === 0, errors, checklist };
};

export const prepareForSubmission = (
  draft: BusinessPlanDraft,
): { draft: BusinessPlanDraft; result: SubmissionCheckResult } => {
  const result = validateForSubmission(draft);
  if (!result.ok) {
    return { draft, result };
  }

  const pipeline = (draft.pipelineSteps ?? []).map((step) =>
    step.agent === "submission-verifier" || step.agent === "submission-reviewer"
      ? { ...step, status: "done" as const }
      : step,
  );

  return {
    draft: {
      ...draft,
      status: "ready",
      pipelineSteps: pipeline,
      activeAgent: undefined,
    },
    result,
  };
};
