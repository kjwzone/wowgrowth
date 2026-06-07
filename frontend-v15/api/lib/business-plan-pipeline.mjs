import { generateJsonWithGemini } from "../lib/gemini-json.mjs";
import {
  STARTUP_PACKAGE_PLAN_INSTRUCTIONS,
  buildFullPlanPrompt,
  buildStartupInputFromRequest,
} from "../lib/business-plan-prompts.mjs";
import { enrichPlanBudgetFromProgram } from "../lib/budget-from-program.mjs";

const mergeSection = (plan, sectionTitle, content) => ({
  ...plan,
  sections: (plan.sections ?? []).map((section) =>
    section.section_title === sectionTitle ? { ...section, content } : section,
  ),
});

/** 1회 호출 — 기본(빠른) 생성 */
export const runFast = async (body) => {
  const startupInput = buildStartupInputFromRequest(body);
  const { data, model } = await generateJsonWithGemini({
    prompt: buildFullPlanPrompt(startupInput),
    maxOutputTokens: 8192,
    temperature: 0.25,
    tier: "fast",
  });
  return {
    plan: enrichPlanBudgetFromProgram(data, body),
    model,
    stages: [{ stage: "generate", label: "AI 초안 생성", status: "done" }],
  };
};

/**
 * 2회 호출 — 공고 분석(flash) + 본문(pro).
 * 예산·규정·제출 검증은 제출 준비 버튼에서 별도 실행.
 */
export const runPipeline = async (body, onStage) => {
  const startupInput = buildStartupInputFromRequest(body);
  const stages = [
    { stage: "announcement", label: "공고 분석" },
    { stage: "plan", label: "사업계획서 작성" },
  ];

  const tick = async (index, status) => {
    if (onStage) await onStage({ ...stages[index], status });
  };

  await tick(0, "running");
  const { data: announcement } = await generateJsonWithGemini({
    prompt: [
      "announcement-analyst: 공고 분석 · 개조식 · JSON만",
      JSON.stringify(startupInput, null, 2),
      '{"evaluation_criteria":[],"mandatory_requirements":[],"scoring_hints":[],"strategy_summary":""}',
    ].join("\n"),
    maxOutputTokens: 2048,
    temperature: 0.2,
    tier: "fast",
  });
  await tick(0, "done");

  await tick(1, "running");
  const { data: plan, model } = await generateJsonWithGemini({
    prompt: buildFullPlanPrompt(startupInput, announcement),
    maxOutputTokens: 8192,
    temperature: 0.25,
    tier: "quality",
  });
  await tick(1, "done");

  return {
    plan: enrichPlanBudgetFromProgram(plan, body),
    model,
    stages: stages.map((s) => ({ ...s, status: "done" })),
    announcement,
  };
};

export const runSection = async (body) => {
  const startupInput = buildStartupInputFromRequest(body);
  const mode = body.mode === "deep" ? "deep" : "basic";
  const { data, model } = await generateJsonWithGemini({
    prompt: [
      STARTUP_PACKAGE_PLAN_INSTRUCTIONS,
      `mode: ${mode === "deep" ? "선택 섹션 AI 추가 생성 (심화)" : "섹션 초안"}`,
      mode === "deep"
        ? "기존 본문 유지 + ■ 심화 — 블록 추가 · 개조식·음슴체·마침표 금지"
        : "섹션 전체 작성",
      `section_title: ${body.sectionTitle}`,
      body.existingContent ? `existing:\n${body.existingContent}` : "",
      JSON.stringify(startupInput, null, 2),
      '{"section_title":"","content":""}',
    ].join("\n"),
    maxOutputTokens: 4096,
    temperature: mode === "deep" ? 0.3 : 0.25,
    tier: mode === "deep" ? "quality" : "fast",
  });
  return { ...data, model };
};

export const runVerify = async (body) => {
  const startupInput = buildStartupInputFromRequest(body);
  const { data, model } = await generateJsonWithGemini({
    prompt: [
      "submission-verifier 제출 전 검증",
      JSON.stringify(startupInput, null, 2),
      JSON.stringify(body.plan, null, 2),
      '{"ok":true,"checklist":[],"self_verification":[],"blocking_issues":[]}',
    ].join("\n"),
    maxOutputTokens: 4096,
    temperature: 0.1,
    tier: "fast",
  });
  return { ...data, model };
};
