import { z } from "zod";
import { handleApiRoute } from "@/lib/api/response";
import { ApiError } from "@/lib/api/errors";
import { requireAuth } from "@/lib/auth/session";
import { resolveCompanyForBusinessPlan } from "@/lib/auth/resolve-company-for-plan";
import { loadBusinessPlanGenerationContext } from "@/lib/ai/load-business-plan-context";
import { generateBusinessPlanSection } from "@/lib/ai/business-plan-section-generate";
import { createAiJob, updateAiJobStatus } from "@/lib/ai/jobs";
import { createClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  programId: z.string().uuid(),
  matchingResultId: z.string().uuid().optional(),
  sectionTitle: z.string().min(2),
  existingContent: z.string().optional(),
  mode: z.enum(["basic", "deep"]).default("deep"),
});

export const POST = async (request: Request) =>
  handleApiRoute(async () => {
    const { userId, profile } = await requireAuth();
    const body = bodySchema.parse(await request.json());
    const company = await resolveCompanyForBusinessPlan(userId, profile.role, {
      matchingResultId: body.matchingResultId,
      programId: body.programId,
    });

    const job = await createAiJob({
      taskType: "plan_section",
      targetType: "business_plan_drafts",
      targetId: body.programId,
      requestedBy: userId,
    });

    try {
      await updateAiJobStatus(job.id, "running", { incrementAttempt: true });
      const ctx = await loadBusinessPlanGenerationContext({
        company,
        programId: body.programId,
        matchingResultId: body.matchingResultId,
      });
      const result = await generateBusinessPlanSection({
        ctx,
        sectionTitle: body.sectionTitle,
        existingContent: body.existingContent,
        mode: body.mode,
      });

      const supabase = await createClient();
      const { data: draft } = await supabase
        .from("business_plan_drafts")
        .select("id, plan_json")
        .eq("company_id", company.id)
        .eq("program_id", body.programId)
        .maybeSingle();

      if (draft?.plan_json && typeof draft.plan_json === "object") {
        const plan = draft.plan_json as {
          sections?: { section_title: string; content: string }[];
        };
        const sections = (plan.sections ?? []).map((section) =>
          section.section_title === result.sectionTitle
            ? { ...section, content: result.content }
            : section,
        );
        await supabase
          .from("business_plan_drafts")
          .update({ plan_json: { ...plan, sections } })
          .eq("id", draft.id);
        await supabase.from("ai_jobs").update({ target_id: draft.id }).eq("id", job.id);
      }

      await updateAiJobStatus(job.id, "succeeded");
      return result;
    } catch (e) {
      if (!(e instanceof ApiError)) {
        const message = e instanceof Error ? e.message : "섹션 생성 실패";
        await updateAiJobStatus(job.id, "failed", {
          errorCode: "GENERATION_FAILED",
          errorMessage: message,
        });
      }
      throw e;
    }
  });
