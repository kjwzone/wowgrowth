import { z } from "zod";
import type { BusinessPlanGenerationContext } from "@/lib/ai/business-plan-context";
import { buildStartupInputPayload } from "@/lib/ai/business-plan-context";
import { generateJsonWithGemini } from "@/lib/ai/generate-json";
import type { BusinessPlanDraft } from "@/lib/ai/schemas";

const verifyResponseSchema = z.object({
  ok: z.boolean(),
  checklist: z.array(
    z.object({
      item: z.string(),
      passed: z.boolean(),
      message: z.string(),
    }),
  ),
  self_verification: z
    .array(
      z.object({
        item: z.string(),
        result: z.string(),
        notes: z.string().optional(),
      }),
    )
    .optional(),
  blocking_issues: z.array(z.string()).default([]),
});

export type BusinessPlanVerifyResult = z.infer<typeof verifyResponseSchema>;

export const verifyBusinessPlanSubmission = async (params: {
  ctx: BusinessPlanGenerationContext;
  plan: BusinessPlanDraft;
}): Promise<BusinessPlanVerifyResult & { model: string }> => {
  const prompt = [
    "당신은 submission-verifier 에이전트다.",
    "제출 전 최종 검증 체크리스트를 작성한다.",
    "",
    "## startup_input",
    JSON.stringify(buildStartupInputPayload(params.ctx), null, 2),
    "",
    "## plan",
    JSON.stringify(params.plan, null, 2),
    "",
    'JSON만 출력: {"ok":true,"checklist":[{"item":"","passed":true,"message":""}],"self_verification":[],"blocking_issues":[]}',
  ].join("\n");

  const { data, model } = await generateJsonWithGemini({
    prompt,
    schema: verifyResponseSchema,
    maxOutputTokens: 4096,
    temperature: 0.1,
  });

  return { ...data, model };
};
