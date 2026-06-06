export const PLAN_GENERATION_STEPS = [
  "기업·공고 정보 확인",
  "추천·진단 데이터 반영",
  "AI 사업계획서 작성",
  "초안 저장",
] as const;

export type PlanGenerationStep = (typeof PLAN_GENERATION_STEPS)[number];

export const resolvePlanGenerationStepIndex = (
  elapsedMs: number,
  finished = false,
): number => {
  if (finished) {
    return PLAN_GENERATION_STEPS.length - 1;
  }
  if (elapsedMs < 2_000) {
    return 0;
  }
  if (elapsedMs < 5_000) {
    return 1;
  }
  return 2;
};

export const formatElapsedSeconds = (elapsedMs: number): number =>
  Math.max(0, Math.floor(elapsedMs / 1_000));
