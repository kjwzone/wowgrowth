import { handleApiRoute } from "@/lib/api/response";
import { ApiError } from "@/lib/api/errors";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { extractAnnouncementMetadata } from "@/lib/ai/gemini";
import { updateAiJobStatus } from "@/lib/ai/jobs";
import { PROMPT_VERSION, SCHEMA_VERSION } from "@/lib/ai/schemas";
import type { AiTaskType } from "@/lib/types/database";

type Props = { params: Promise<{ id: string }> };

export const POST = async (_request: Request, { params }: Props) =>
  handleApiRoute(async () => {
    const { userId } = await requireRole(["admin"]);
    const { id: jobId } = await params;
    const supabase = await createClient();

    const { data: job, error: jobError } = await supabase
      .from("ai_jobs")
      .select("*")
      .eq("id", jobId)
      .single();

    if (jobError || !job) {
      throw new ApiError("NOT_FOUND", "작업을 찾을 수 없습니다.");
    }
    if (job.target_type !== "support_programs") {
      throw new ApiError("VALIDATION_ERROR", "지원하지 않는 작업 대상입니다.");
    }

    const { data: program } = await supabase
      .from("support_programs")
      .select("content_raw")
      .eq("id", job.target_id)
      .single();

    if (!program?.content_raw) {
      throw new ApiError("VALIDATION_ERROR", "공고 원문이 없습니다.");
    }

    await updateAiJobStatus(jobId, "queued");
    await supabase.from("review_logs").insert({
      review_target_type: "program_metadata",
      review_target_id: job.target_id,
      action: "retried",
      actor_id: userId,
      review_comment: "AI 작업 재시도",
    });

    try {
      await updateAiJobStatus(jobId, "running", { incrementAttempt: true });
      const { metadata, model } = await extractAnnouncementMetadata(
        program.content_raw,
        job.task_type as AiTaskType,
      );

      const { data: saved, error: metaError } = await supabase
        .from("program_metadata")
        .insert({
          program_id: job.target_id,
          schema_version: SCHEMA_VERSION,
          task_type: job.task_type,
          model,
          prompt_version: PROMPT_VERSION,
          status: "reviewing",
          metadata_json: metadata,
          extracted_fields: {
            title: metadata.title,
            region: metadata.region,
            target: metadata.target,
          },
          created_by_job_id: jobId,
        })
        .select("id")
        .single();

      if (metaError || !saved) {
        throw new ApiError("INTERNAL_ERROR", metaError?.message ?? "저장 실패");
      }

      await updateAiJobStatus(jobId, "succeeded");
      return { jobId, status: "succeeded" as const, metadataId: saved.id };
    } catch (error) {
      const code =
        error instanceof ApiError ? error.code : "INTERNAL_ERROR";
      const message =
        error instanceof ApiError ? error.message : "재시도 실패";
      await updateAiJobStatus(jobId, "failed", {
        errorCode: code,
        errorMessage: message,
      });
      throw error;
    }
  });
