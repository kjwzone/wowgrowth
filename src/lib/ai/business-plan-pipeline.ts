import { z } from "zod";
import {
  buildBusinessPlanPrompt,
  generateBusinessPlanDraft,
} from "@/lib/ai/business-plan";
import type { BusinessPlanGenerationContext } from "@/lib/ai/business-plan-context";
import { buildStartupInputPayload } from "@/lib/ai/business-plan-context";
import { generateJsonWithGemini } from "@/lib/ai/generate-json";
import {
  businessPlanDraftSchema,
  type BusinessPlanDraft,
} from "@/lib/ai/schemas";
import { STARTUP_PACKAGE_PLAN_INSTRUCTIONS } from "@/lib/ai/prompts/startup-package-plan-instructions";

export type PipelineStageId =
  | "announcement"
  | "plan"
  | "budget"
  | "compliance"
  | "submission";

export type PipelineStageStatus = "pending" | "running" | "done" | "failed";

export type PipelineProgress = {
  stage: PipelineStageId;
  status: PipelineStageStatus;
  label: string;
};

const announcementAnalysisSchema = z.object({
  evaluation_criteria: z.array(z.string()).default([]),
  mandatory_requirements: z.array(z.string()).default([]),
  scoring_hints: z.array(z.string()).default([]),
  strategy_summary: z.string().default(""),
});

const budgetSectionSchema = z.object({
  section_title: z.literal("사업비 집행 계획"),
  content: z.string().min(80),
});

const complianceSchema = z.object({
  self_verification: z
    .array(
      z.object({
        item: z.string(),
        result: z.string(),
        notes: z.string().optional(),
      }),
    )
    .min(3),
  key_risks: z.array(z.string()).max(10).default([]),
  evidence_checklist: z.array(z.string()).default([]),
});

const submissionSchema = z.object({
  ready: z.boolean(),
  blocking_issues: z.array(z.string()).default([]),
  section_patches: z
    .array(
      z.object({
        section_title: z.string(),
        content: z.string(),
      }),
    )
    .default([]),
});

const buildAnnouncementPrompt = (ctx: BusinessPlanGenerationContext): string =>
  [
    "당신은 announcement-analyst 에이전트다.",
    "정부지원사업 공고를 평가위원 관점에서 분석한다.",
    "개조식·음슴체·마침표 없음.",
    "",
    "## startup_input",
    JSON.stringify(buildStartupInputPayload(ctx), null, 2),
    "",
    "JSON만 출력:",
    '{"evaluation_criteria":[],"mandatory_requirements":[],"scoring_hints":[],"strategy_summary":""}',
  ].join("\n");

const buildBudgetPrompt = (
  ctx: BusinessPlanGenerationContext,
  plan: BusinessPlanDraft,
  announcement: z.infer<typeof announcementAnalysisSchema>,
): string =>
  [
    "당신은 budget-designer 에이전트다.",
    STARTUP_PACKAGE_PLAN_INSTRUCTIONS,
    "",
    "## 공고 분석",
    JSON.stringify(announcement, null, 2),
    "",
    "## 현재 초안(참고)",
    JSON.stringify(plan.sections.find((s) => s.section_title.includes("사업비")), null, 2),
    "",
    "## startup_input",
    JSON.stringify(buildStartupInputPayload(ctx), null, 2),
    "",
    '사업비 집행 계획 섹션만 JSON 출력: {"section_title":"사업비 집행 계획","content":"..."}',
    "■ [사업비 요약] 및 ■ [비목] 표 형식 포함 · 개조식·음슴체 · 마침표 금지",
  ].join("\n");

const buildCompliancePrompt = (
  ctx: BusinessPlanGenerationContext,
  plan: BusinessPlanDraft,
): string =>
  [
    "당신은 compliance-checker 에이전트다.",
    "사업계획서 초안의 규정·양식·배점 정합성을 검증한다.",
    "",
    "## startup_input",
    JSON.stringify(buildStartupInputPayload(ctx), null, 2),
    "",
    "## plan",
    JSON.stringify(plan, null, 2),
    "",
    'JSON만 출력: {"self_verification":[{"item":"","result":"충족|부분충족|미충족","notes":""}],"key_risks":[],"evidence_checklist":[]}',
  ].join("\n");

const buildSubmissionPrompt = (
  ctx: BusinessPlanGenerationContext,
  plan: BusinessPlanDraft,
): string =>
  [
    "당신은 submission-verifier 에이전트다.",
    "제출 가능 여부와 섹션별 최소 보완 패치를 제시한다.",
    "개조식·음슴체·마침표 없음.",
    "",
    "## plan",
    JSON.stringify(plan, null, 2),
    "",
    'JSON만 출력: {"ready":true,"blocking_issues":[],"section_patches":[{"section_title":"","content":""}]}',
    "section_patches는 blocking_issues 해결에 필요한 경우만, 해당 섹션 전체 content 교체",
  ].join("\n");

const mergeSection = (
  plan: BusinessPlanDraft,
  sectionTitle: string,
  content: string,
): BusinessPlanDraft => ({
  ...plan,
  sections: plan.sections.map((section) =>
    section.section_title === sectionTitle ? { ...section, content } : section,
  ),
});

export const runBusinessPlanPipeline = async (
  ctx: BusinessPlanGenerationContext,
  onStage?: (progress: PipelineProgress) => void | Promise<void>,
): Promise<{ plan: BusinessPlanDraft; model: string; stages: PipelineProgress[] }> => {
  const stages: PipelineProgress[] = [
    { stage: "announcement", status: "pending", label: "공고 분석" },
    { stage: "plan", status: "pending", label: "사업계획서 작성" },
    { stage: "budget", status: "pending", label: "예산 편성" },
    { stage: "compliance", status: "pending", label: "규정 준수 검증" },
    { stage: "submission", status: "pending", label: "제출 검증" },
  ];

  const setStage = async (id: PipelineStageId, status: PipelineStageStatus) => {
    const step = stages.find((s) => s.stage === id);
    if (step) step.status = status;
    await onStage?.(step ?? { stage: id, status, label: id });
  };

  await setStage("announcement", "running");
  const { data: announcement, model: model1 } = await generateJsonWithGemini({
    prompt: buildAnnouncementPrompt(ctx),
    schema: announcementAnalysisSchema,
    temperature: 0.2,
    maxOutputTokens: 2048,
  });
  await setStage("announcement", "done");

  await setStage("plan", "running");
  const enrichedPrompt = [
    buildBusinessPlanPrompt(ctx),
    "",
    "## announcement-analyst 결과 (반드시 반영)",
    JSON.stringify(announcement, null, 2),
  ].join("\n");
  const { data: basePlan, model: model2 } = await generateJsonWithGemini({
    prompt: enrichedPrompt,
    schema: businessPlanDraftSchema,
    invalidMessage: "사업계획서 초안 JSON 형식이 올바르지 않습니다.",
    maxOutputTokens: 8192,
    temperature: 0.25,
  });
  await setStage("plan", "done");

  await setStage("budget", "running");
  const { data: budgetSection } = await generateJsonWithGemini({
    prompt: buildBudgetPrompt(ctx, basePlan, announcement),
    schema: budgetSectionSchema,
    maxOutputTokens: 4096,
    temperature: 0.2,
  });
  let plan = mergeSection(basePlan, budgetSection.section_title, budgetSection.content);
  await setStage("budget", "done");

  await setStage("compliance", "running");
  const { data: compliance } = await generateJsonWithGemini({
    prompt: buildCompliancePrompt(ctx, plan),
    schema: complianceSchema,
    maxOutputTokens: 4096,
    temperature: 0.15,
  });
  plan = {
    ...plan,
    self_verification: compliance.self_verification,
    key_risks: compliance.key_risks,
    evidence_checklist: compliance.evidence_checklist,
  };
  await setStage("compliance", "done");

  await setStage("submission", "running");
  const { data: submission } = await generateJsonWithGemini({
    prompt: buildSubmissionPrompt(ctx, plan),
    schema: submissionSchema,
    maxOutputTokens: 8192,
    temperature: 0.15,
  });
  for (const patch of submission.section_patches) {
    plan = mergeSection(plan, patch.section_title, patch.content);
  }
  await setStage("submission", "done");

  return { plan, model: model2 || model1, stages };
};

/** 단일 Gemini 호출 (빠른 경로) */
export const runBusinessPlanFast = async (ctx: BusinessPlanGenerationContext) =>
  generateBusinessPlanDraft(ctx);
