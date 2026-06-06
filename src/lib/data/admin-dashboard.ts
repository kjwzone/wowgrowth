import { unstable_noStore as noStore } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { JobStatus, ProgramStatus } from "@/lib/types/database";

export type ProgramStatusCounts = Record<ProgramStatus, number> & { total: number };

export type AdminDashboardSummary = {
  programs: ProgramStatusCounts;
  companies: number;
  matches: number;
  diagnosisReports: number;
  businessPlans: number;
  pendingReviews: number;
  aiJobs: Record<JobStatus, number> & { total: number };
  recentFailedJobs: Array<{
    id: string;
    task_type: string;
    error_code: string | null;
    created_at: string;
  }>;
  pendingReviewItems: Array<{
    id: string;
    title: string;
    created_at: string;
  }>;
};

const emptyProgramCounts = (): ProgramStatusCounts => ({
  total: 0,
  draft: 0,
  published: 0,
  closed: 0,
});

const emptyJobCounts = (): AdminDashboardSummary["aiJobs"] => ({
  total: 0,
  queued: 0,
  running: 0,
  succeeded: 0,
  failed: 0,
});

const isProgramStatus = (value: string): value is ProgramStatus =>
  value === "draft" || value === "published" || value === "closed";

const isJobStatus = (value: string): value is JobStatus =>
  value === "queued" ||
  value === "running" ||
  value === "succeeded" ||
  value === "failed";

export const countProgramStatuses = (
  rows: ReadonlyArray<{ status: string }>,
): ProgramStatusCounts =>
  rows.reduce<ProgramStatusCounts>(
    (acc, row) => {
      if (isProgramStatus(row.status)) {
        acc[row.status] += 1;
      }
      acc.total += 1;
      return acc;
    },
    emptyProgramCounts(),
  );

export const countJobStatuses = (
  rows: ReadonlyArray<{ status: string }>,
): AdminDashboardSummary["aiJobs"] =>
  rows.reduce<AdminDashboardSummary["aiJobs"]>(
    (acc, row) => {
      if (isJobStatus(row.status)) {
        acc[row.status] += 1;
      }
      acc.total += 1;
      return acc;
    },
    emptyJobCounts(),
  );

export const fetchAdminDashboardSummary = async (): Promise<AdminDashboardSummary> => {
  noStore();
  const supabase = await createClient();

  const [
    programsRes,
    companiesRes,
    matchesRes,
    diagnosisRes,
    plansRes,
    pendingReviewsRes,
    jobsRes,
    failedJobsRes,
    pendingItemsRes,
  ] = await Promise.all([
    supabase.from("support_programs").select("status"),
    supabase.from("companies").select("id", { count: "exact", head: true }),
    supabase.from("matching_results").select("id", { count: "exact", head: true }),
    supabase.from("diagnosis_reports").select("id", { count: "exact", head: true }),
    supabase.from("business_plan_drafts").select("id", { count: "exact", head: true }),
    supabase
      .from("program_metadata")
      .select("id", { count: "exact", head: true })
      .in("status", ["reviewing", "draft"]),
    supabase.from("ai_jobs").select("status"),
    supabase
      .from("ai_jobs")
      .select("id, task_type, error_code, created_at")
      .eq("status", "failed")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("program_metadata")
      .select("id, program_id, extracted_fields, created_at")
      .in("status", ["reviewing", "draft"])
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const programIds = [
    ...new Set((pendingItemsRes.data ?? []).map((item) => item.program_id)),
  ];
  const programMap = new Map<string, string>();

  if (programIds.length > 0) {
    const { data: programs } = await supabase
      .from("support_programs")
      .select("id, title")
      .in("id", programIds);

    (programs ?? []).forEach((program) => {
      programMap.set(program.id, program.title);
    });
  }

  const pendingReviewItems = (pendingItemsRes.data ?? []).map((item) => {
    const fields = item.extracted_fields as { title?: string } | null;
    return {
      id: item.id,
      title:
        fields?.title ??
        programMap.get(item.program_id) ??
        "제목 없음",
      created_at: item.created_at,
    };
  });

  return {
    programs: countProgramStatuses(programsRes.data ?? []),
    companies: companiesRes.count ?? 0,
    matches: matchesRes.count ?? 0,
    diagnosisReports: diagnosisRes.count ?? 0,
    businessPlans: plansRes.count ?? 0,
    pendingReviews: pendingReviewsRes.count ?? 0,
    aiJobs: countJobStatuses(jobsRes.data ?? []),
    recentFailedJobs: failedJobsRes.data ?? [],
    pendingReviewItems,
  };
};
