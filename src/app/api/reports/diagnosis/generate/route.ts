import { z } from "zod";
import { handleApiRoute } from "@/lib/api/response";
import { ApiError } from "@/lib/api/errors";
import { requireAuth } from "@/lib/auth/session";
import { resolveCompanyForDiagnosis } from "@/lib/auth/resolve-company-for-diagnosis";
import { generateDiagnosisReport } from "@/lib/ai/diagnosis";
import { createAiJob, updateAiJobStatus } from "@/lib/ai/jobs";
import { PROMPT_VERSION, SCHEMA_VERSION } from "@/lib/ai/schemas";
import { createClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  companyId: z.string().uuid().optional(),
});

export const POST = async (request: Request) =>
  handleApiRoute(async () => {
    const { userId, profile } = await requireAuth();
    const { companyId } = bodySchema.parse(
      await request.json().catch(() => ({})),
    );
    const company = await resolveCompanyForDiagnosis(
      userId,
      profile.role,
      companyId,
    );
    const supabase = await createClient();

    const job = await createAiJob({
      taskType: "diagnosis_draft",
      targetType: "diagnosis_reports",
      targetId: company.id,
      requestedBy: userId,
    });

    try {
      await updateAiJobStatus(job.id, "running", { incrementAttempt: true });
      const { report, model } = await generateDiagnosisReport(company);

      const { data: existing } = await supabase
        .from("diagnosis_reports")
        .select("id")
        .eq("company_id", company.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const row = {
        company_id: company.id,
        schema_version: SCHEMA_VERSION,
        model,
        prompt_version: PROMPT_VERSION,
        status: "reviewing" as const,
        report_json: report,
      };

      const { data, error } = existing
        ? await supabase
            .from("diagnosis_reports")
            .update(row)
            .eq("id", existing.id)
            .select()
            .single()
        : await supabase.from("diagnosis_reports").insert(row).select().single();

      if (error || !data) {
        await updateAiJobStatus(job.id, "failed", {
          errorCode: "SAVE_FAILED",
          errorMessage: error?.message,
        });
        throw new ApiError("INTERNAL_ERROR", error?.message ?? "저장 실패");
      }

      await supabase.from("ai_jobs").update({ target_id: data.id }).eq("id", job.id);
      await updateAiJobStatus(job.id, "succeeded");

      return { id: data.id, status: data.status };
    } catch (e) {
      if (!(e instanceof ApiError)) {
        const message = e instanceof Error ? e.message : "진단 생성 실패";
        await updateAiJobStatus(job.id, "failed", {
          errorCode: "GENERATION_FAILED",
          errorMessage: message,
        });
      }
      throw e;
    }
  });
