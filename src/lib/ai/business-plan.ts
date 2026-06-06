import {
  businessPlanDraftSchema,
  PROMPT_VERSION,
  type BusinessPlanDraft,
} from "@/lib/ai/schemas";
import { buildStartupInputPayload } from "@/lib/ai/business-plan-context";
import type { BusinessPlanGenerationContext } from "@/lib/ai/business-plan-context";
import { generateJsonWithGemini } from "@/lib/ai/generate-json";
import {
  REQUIRED_BUSINESS_PLAN_SECTION_TITLES,
  STARTUP_PACKAGE_PLAN_INSTRUCTIONS,
} from "@/lib/ai/prompts/startup-package-plan-instructions";

export const buildBusinessPlanPrompt = (ctx: BusinessPlanGenerationContext): string => {
  const startupInput = buildStartupInputPayload(ctx);

  return [
    STARTUP_PACKAGE_PLAN_INSTRUCTIONS,
    "",
    "---",
    "",
    "## 이번 작성에 사용할 실제 입력 (startup_input)",
    JSON.stringify(startupInput, null, 2),
    "",
    "## sections 필수 section_title (순서 유지)",
    JSON.stringify([...REQUIRED_BUSINESS_PLAN_SECTION_TITLES]),
    "",
    "위 지시문과 startup_input만 근거로 JSON을 작성하라.",
    "내부 추론·질문 목록은 출력하지 말 것.",
    "응답은 { 로 시작하는 JSON 객체 하나만. mermaid·코드펜스·설명 문장 금지.",
  ].join("\n");
};

export const generateBusinessPlanDraft = async (
  ctx: BusinessPlanGenerationContext,
): Promise<{ plan: BusinessPlanDraft; model: string }> => {
  const { data, model } = await generateJsonWithGemini({
    prompt: buildBusinessPlanPrompt(ctx),
    schema: businessPlanDraftSchema,
    invalidMessage: "사업계획서 초안 JSON 형식이 올바르지 않습니다.",
    maxOutputTokens: 8192,
    temperature: 0.25,
  });
  void PROMPT_VERSION;
  return { plan: data, model };
};

/** @deprecated 테스트·하위호환 — 단순 3필드 호출 */
export const buildBusinessPlanPromptLegacy = (
  company: BusinessPlanGenerationContext["company"],
  program: BusinessPlanGenerationContext["program"],
  programMeta?: Record<string, unknown> | null,
): string =>
  buildBusinessPlanPrompt({
    company,
    program,
    programMeta: programMeta ?? null,
    matching: null,
    diagnosis: null,
    attachmentsNote:
      "합격 샘플 PDF 미첨부 — 지시문 내 정부 양식 구조·설득 템플릿만 적용",
  });
