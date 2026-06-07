import { z } from "zod";
import { handleApiRoute } from "@/lib/api/response";
import { ApiError } from "@/lib/api/errors";
import { requireAuth } from "@/lib/auth/session";
import { resolveCompanyForBusinessPlan } from "@/lib/auth/resolve-company-for-plan";
import { loadBusinessPlanGenerationContext } from "@/lib/ai/load-business-plan-context";
import { verifyBusinessPlanSubmission } from "@/lib/ai/business-plan-verify";
import { businessPlanDraftSchema } from "@/lib/ai/schemas";
import { createAiJob, updateAiJobStatus } from "@/lib/ai/jobs";
import { createClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  programId: z.string().uuid(),
  matchingResultId: z.string().uuid().optional(),
});

export const POST = async (request: Request) =>
  handleApiRoute(async () => {
    const { userId, profile } = await requireAuth();
    const body = bodySchema.parse(await request.json());
    const company = await resolveCompanyForBusinessPlan(userId, profile.role, {
      matchingResultId: body.matchingResultId,
      programId: body.programId,
    });
    const supabase = await createClient();

    const { data: draft, error } = await supabase
      .from("business_plan_drafts")
      .select("id, plan_json, status")
      .eq("company_id", company.id)
      .eq("program_id", body.programId)
      .single();

    if (error || !draft) {
      throw new ApiError("NOT_FOUND", "사업계획서 초안을 찾을 수 없습니다.");
    }

    const parsed = businessPlanDraftSchema.safeParse(draft.plan_json);
    if (!parsed.success) {
      throw new ApiError("VALIDATION_ERROR", "저장된 계획서 형식이 올바르지 않습니다.");
    }

    const job = await createAiJob({
      taskType: "plan_verify",
      targetType: "business_plan_drafts",
      targetId: draft.id,
      requestedBy: userId,
    });

    try {
      await updateAiJobStatus(job.id, "running", { incrementAttempt: true });
      const ctx = await loadBusinessPlanGenerationContext({
        company,
        programId: body.programId,
        matchingResultId: body.matchingResultId,
      });
      const result = await verifyBusinessPlanSubmission({
        ctx,
        plan: parsed.data,
      });

      const nextStatus = result.ok ? "ready" : "reviewing";
      await supabase
        .from("business_plan_drafts")
        .update({
          status: nextStatus,
          plan_json: {
            ...parsed.data,
            self_verification:
              result.self_verification ?? parsed.data.self_verification,
          },
        })
        .eq("id", draft.id);

      await updateAiJobStatus(job.id, "succeeded");
      return { ...result, status: nextStatus };
    } catch (e) {
      if (!(e instanceof ApiError)) {
        const message = e instanceof Error ? e.message : "제출 검증 실패";
        await updateAiJobStatus(job.id, "failed", {
          errorCode: "VERIFY_FAILED",
          errorMessage: message,
        });
      }
      throw e;
    }
  });
