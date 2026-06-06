import { z } from "zod";
import { handleApiRoute } from "@/lib/api/response";
import { ApiError } from "@/lib/api/errors";
import { requireAuth } from "@/lib/auth/session";
import { resolveCompanyForBusinessPlan } from "@/lib/auth/resolve-company-for-plan";
import { generateBusinessPlanDraft } from "@/lib/ai/business-plan";
import { loadBusinessPlanGenerationContext } from "@/lib/ai/load-business-plan-context";
import { createAiJob, updateAiJobStatus } from "@/lib/ai/jobs";
import { PROMPT_VERSION, SCHEMA_VERSION } from "@/lib/ai/schemas";
import { createClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  programId: z.string().uuid(),
  matchingResultId: z.string().uuid().optional(),
});

export const POST = async (request: Request) =>
  handleApiRoute(async () => {
    const { userId, profile } = await requireAuth();
    const { programId, matchingResultId } = bodySchema.parse(await request.json());
    const company = await resolveCompanyForBusinessPlan(userId, profile.role, {
      matchingResultId,
      programId,
    });
    const supabase = await createClient();

    const job = await createAiJob({
      taskType: "plan_draft",
      targetType: "business_plan_drafts",
      targetId: programId,
      requestedBy: userId,
    });

    try {
      await updateAiJobStatus(job.id, "running", { incrementAttempt: true });
      const ctx = await loadBusinessPlanGenerationContext({
        company,
        programId,
        matchingResultId,
      });
      const { plan, model } = await generateBusinessPlanDraft(ctx);

      const row = {
        company_id: company.id,
        program_id: programId,
        matching_result_id: matchingResultId ?? null,
        schema_version: SCHEMA_VERSION,
        model,
        prompt_version: PROMPT_VERSION,
        status: "reviewing" as const,
        title: plan.title,
        plan_json: plan,
      };

      const { data, error } = await supabase
        .from("business_plan_drafts")
        .upsert(row, { onConflict: "company_id,program_id" })
        .select()
        .single();

      if (error || !data) {
        await updateAiJobStatus(job.id, "failed", {
          errorCode: "SAVE_FAILED",
          errorMessage: error?.message,
        });
        throw new ApiError("INTERNAL_ERROR", error?.message ?? "저장 실패");
      }

      await supabase.from("ai_jobs").update({ target_id: data.id }).eq("id", job.id);
      await updateAiJobStatus(job.id, "succeeded");

      return { id: data.id, status: data.status, title: data.title };
    } catch (e) {
      if (!(e instanceof ApiError)) {
        const message = e instanceof Error ? e.message : "계획서 생성 실패";
        await updateAiJobStatus(job.id, "failed", {
          errorCode: "GENERATION_FAILED",
          errorMessage: message,
        });
      }
      throw e;
    }
  });
