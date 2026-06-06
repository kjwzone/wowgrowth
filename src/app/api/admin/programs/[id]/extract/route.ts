import { z } from "zod";
import { handleApiRoute } from "@/lib/api/response";
import { ApiError } from "@/lib/api/errors";
import { requireRole } from "@/lib/auth/session";
import { revalidateReviewPages } from "@/lib/data/revalidate-review-pages";
import { createClient } from "@/lib/supabase/server";
import { extractAnnouncementMetadata } from "@/lib/ai/gemini";
import { createAiJob, updateAiJobStatus } from "@/lib/ai/jobs";
import { PROMPT_VERSION, SCHEMA_VERSION } from "@/lib/ai/schemas";
import type { AiTaskType } from "@/lib/types/database";

const bodySchema = z.object({
  taskType: z.enum(["announcement_summary", "announcement_metadata"]),
});

type Props = { params: Promise<{ id: string }> };

export const POST = async (request: Request, { params }: Props) =>
  handleApiRoute(async () => {
    const { userId } = await requireRole(["admin"]);
    const { id: programId } = await params;
    const { taskType } = bodySchema.parse(await request.json());
    const supabase = await createClient();

    const { data: program, error: programError } = await supabase
      .from("support_programs")
      .select("id, content_raw, title")
      .eq("id", programId)
      .single();

    if (programError || !program) {
      throw new ApiError("NOT_FOUND", "공고를 찾을 수 없습니다.");
    }
    if (!program.content_raw?.trim()) {
      throw new ApiError("VALIDATION_ERROR", "공고 원문(content)이 필요합니다.");
    }

    const job = await createAiJob({
      taskType: taskType as AiTaskType,
      targetType: "support_programs",
      targetId: programId,
      requestedBy: userId,
    });

    try {
      await updateAiJobStatus(job.id, "running", { incrementAttempt: true });
      const { metadata, model } = await extractAnnouncementMetadata(
        program.content_raw,
        taskType,
      );

      const { data: saved, error: metaError } = await supabase
        .from("program_metadata")
        .insert({
          program_id: programId,
          schema_version: SCHEMA_VERSION,
          task_type: taskType,
          model,
          prompt_version: PROMPT_VERSION,
          status: "reviewing",
          metadata_json: metadata,
          extracted_fields: {
            title: metadata.title,
            agency: metadata.agency,
            target: metadata.target,
            region: metadata.region,
            application_period: metadata.application_period,
          },
          created_by_job_id: job.id,
        })
        .select("id")
        .single();

      if (metaError || !saved) {
        throw new ApiError("INTERNAL_ERROR", metaError?.message ?? "메타 저장 실패");
      }

      await supabase.from("review_logs").insert({
        review_target_type: "program_metadata",
        review_target_id: saved.id,
        action: "created",
        after_json: metadata,
        actor_id: userId,
      });

      await updateAiJobStatus(job.id, "succeeded");
      revalidateReviewPages(saved.id, programId);
      return { jobId: job.id, status: "succeeded" as const, metadataId: saved.id };    } catch (error) {
      const code =
        error instanceof ApiError ? error.code : "INTERNAL_ERROR";
      const message =
        error instanceof ApiError ? error.message : "AI 처리 중 오류";
      await updateAiJobStatus(job.id, "failed", {
        errorCode: code,
        errorMessage: message,
      });
      throw error;
    }
  });
