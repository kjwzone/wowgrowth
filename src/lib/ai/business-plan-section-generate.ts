import { z } from "zod";
import type { BusinessPlanGenerationContext } from "@/lib/ai/business-plan-context";
import { buildStartupInputPayload } from "@/lib/ai/business-plan-context";
import { generateJsonWithGemini } from "@/lib/ai/generate-json";
import { STARTUP_PACKAGE_PLAN_INSTRUCTIONS } from "@/lib/ai/prompts/startup-package-plan-instructions";

const sectionResponseSchema = z.object({
  section_title: z.string(),
  content: z.string().min(40),
  deep_summary: z.string().optional(),
});

export const generateBusinessPlanSection = async (params: {
  ctx: BusinessPlanGenerationContext;
  sectionTitle: string;
  existingContent?: string;
  mode: "basic" | "deep";
}): Promise<{ sectionTitle: string; content: string; model: string }> => {
  const { ctx, sectionTitle, existingContent, mode } = params;
  const deepInstruction =
    mode === "deep"
      ? [
          "기존 본문을 유지하고 ■ 심화 — 블록을 추가한다.",
          "심화 블록은 개조식(·) · 음슴체 · 마침표 금지.",
          "공고 배점·KPI·리스크·일정 보강에 집중.",
        ].join("\n")
      : "해당 섹션 전체를 처음부터 작성한다.";

  const prompt = [
    STARTUP_PACKAGE_PLAN_INSTRUCTIONS,
    "",
    `## 작성 모드: ${mode === "deep" ? "선택 섹션 AI 추가 생성 (심화)" : "섹션 초안"}`,
    deepInstruction,
    "",
    `## 대상 section_title: ${sectionTitle}`,
    existingContent?.trim()
      ? `## 기존 content\n${existingContent.trim()}`
      : "## 기존 content: (없음)",
    "",
    "## startup_input",
    JSON.stringify(buildStartupInputPayload(ctx), null, 2),
    "",
    'JSON만 출력: {"section_title":"","content":"","deep_summary":""}',
    "content에 표·■·1)·· 개조식 사용 · 마침표 금지",
  ].join("\n");

  const { data, model } = await generateJsonWithGemini({
    prompt,
    schema: sectionResponseSchema,
    maxOutputTokens: 4096,
    temperature: mode === "deep" ? 0.3 : 0.25,
  });

  return {
    sectionTitle: data.section_title,
    content: data.content,
    model,
  };
};
