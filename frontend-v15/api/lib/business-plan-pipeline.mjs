import { generateJsonWithGemini } from "../lib/gemini-json.mjs";
import {
  STARTUP_PACKAGE_PLAN_INSTRUCTIONS,
  buildFullPlanPrompt,
  buildStartupInputFromRequest,
} from "../lib/business-plan-prompts.mjs";

const mergeSection = (plan, sectionTitle, content) => ({
  ...plan,
  sections: (plan.sections ?? []).map((section) =>
    section.section_title === sectionTitle ? { ...section, content } : section,
  ),
});

export const runPipeline = async (body, onStage) => {
  const startupInput = buildStartupInputFromRequest(body);
  const stages = [
    { stage: "announcement", label: "공고 분석" },
    { stage: "plan", label: "사업계획서 작성" },
    { stage: "budget", label: "예산 편성" },
    { stage: "compliance", label: "규정 준수 검증" },
    { stage: "submission", label: "제출 검증" },
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
  });
  await tick(0, "done");

  await tick(1, "running");
  const { data: plan, model } = await generateJsonWithGemini({
    prompt: buildFullPlanPrompt(startupInput, announcement),
    maxOutputTokens: 8192,
    temperature: 0.25,
  });
  await tick(1, "done");

  await tick(2, "running");
  const { data: budgetSection } = await generateJsonWithGemini({
    prompt: [
      STARTUP_PACKAGE_PLAN_INSTRUCTIONS,
      "budget-designer: 사업비 집행 계획 섹션만",
      JSON.stringify(startupInput, null, 2),
      '{"section_title":"사업비 집행 계획","content":""}',
    ].join("\n"),
    maxOutputTokens: 4096,
    temperature: 0.2,
  });
  let merged = mergeSection(plan, "사업비 집행 계획", budgetSection.content);
  await tick(2, "done");

  await tick(3, "running");
  const { data: compliance } = await generateJsonWithGemini({
    prompt: [
      "compliance-checker",
      JSON.stringify(merged, null, 2),
      '{"self_verification":[],"key_risks":[],"evidence_checklist":[]}',
    ].join("\n"),
    maxOutputTokens: 4096,
    temperature: 0.15,
  });
  merged = {
    ...merged,
    self_verification: compliance.self_verification ?? [],
    key_risks: compliance.key_risks ?? [],
    evidence_checklist: compliance.evidence_checklist ?? [],
  };
  await tick(3, "done");

  await tick(4, "running");
  const { data: submission } = await generateJsonWithGemini({
    prompt: [
      "submission-verifier: section_patches로 blocking 이슈만 수정",
      JSON.stringify(merged, null, 2),
      '{"ready":true,"blocking_issues":[],"section_patches":[]}',
    ].join("\n"),
    maxOutputTokens: 8192,
    temperature: 0.15,
  });
  for (const patch of submission.section_patches ?? []) {
    merged = mergeSection(merged, patch.section_title, patch.content);
  }
  await tick(4, "done");

  return {
    plan: merged,
    model,
    stages: stages.map((s) => ({ ...s, status: "done" })),
    announcement,
  };
};

export const runFast = async (body) => {
  const startupInput = buildStartupInputFromRequest(body);
  const { data, model } = await generateJsonWithGemini({
    prompt: buildFullPlanPrompt(startupInput),
    maxOutputTokens: 8192,
    temperature: 0.25,
  });
  return { plan: data, model };
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
  });
  return { ...data, model };
};
