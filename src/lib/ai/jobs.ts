import { createClient } from "@/lib/supabase/server";
import { ApiError } from "@/lib/api/errors";
import type { AiTaskType, JobStatus } from "@/lib/types/database";

type JobTargetType =
  | "support_programs"
  | "matching_results"
  | "diagnosis_reports"
  | "business_plan_drafts";

export const createAiJob = async (params: {
  taskType: AiTaskType;
  targetType: JobTargetType;
  targetId: string;
  requestedBy: string;
}) => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ai_jobs")
    .insert({
      task_type: params.taskType,
      target_type: params.targetType,
      target_id: params.targetId,
      status: "queued",
      requested_by: params.requestedBy,
    })
    .select("id, status")
    .single();

  if (error || !data) {
    throw new ApiError("INTERNAL_ERROR", error?.message ?? "작업 생성 실패");
  }
  return data;
};

export const updateAiJobStatus = async (
  jobId: string,
  status: JobStatus,
  extra?: {
    errorCode?: string;
    errorMessage?: string;
    incrementAttempt?: boolean;
  },
) => {
  const supabase = await createClient();
  const now = new Date().toISOString();
  const patch: Record<string, unknown> = { status };

  if (status === "running") {
    patch.started_at = now;
  }
  if (status === "succeeded" || status === "failed") {
    patch.finished_at = now;
  }
  if (extra?.errorCode) patch.error_code = extra.errorCode;
  if (extra?.errorMessage) patch.error_message = extra.errorMessage;
  if (extra?.incrementAttempt) {
    const { data: current } = await supabase
      .from("ai_jobs")
      .select("attempt_count")
      .eq("id", jobId)
      .single();
    patch.attempt_count = (current?.attempt_count ?? 0) + 1;
  }

  const { error } = await supabase.from("ai_jobs").update(patch).eq("id", jobId);
  if (error) {
    console.error(`ai_jobs update failed (${jobId}):`, error.message);
  }
};
