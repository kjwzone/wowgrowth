export type ProgramStatus = "draft" | "published" | "closed";

export type JobStatus = "queued" | "running" | "succeeded" | "failed";

export type ProgramStatusCounts = Record<ProgramStatus, number> & { total: number };

export type AdminDashboardSummary = {
  programs: ProgramStatusCounts;
  companies: number;
  matches: number;
  diagnosisReports: number;
  businessPlans: number;
  pendingReviews: number;
  aiJobs: Record<JobStatus, number> & { total: number };
  recentFailedJobs: ReadonlyArray<{
    id: string;
    task_type: string;
    error_code: string | null;
    created_at: string;
  }>;
  pendingReviewItems: ReadonlyArray<{
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

type AdminDashboardApiResponse =
  | { ok: true; source: "supabase"; summary: AdminDashboardSummary }
  | { ok: false; message?: string };

export const fetchAdminDashboardSummary = async (): Promise<AdminDashboardSummary> => {
  const response = await fetch("/api/admin/dashboard");
  const payload = (await response.json()) as AdminDashboardApiResponse;

  if (!response.ok || !payload.ok || !("summary" in payload)) {
    throw new Error(
      payload.ok === false
        ? (payload.message ?? "관리자 대시보드 데이터를 불러오지 못했습니다.")
        : "관리자 대시보드 데이터를 불러오지 못했습니다.",
    );
  }

  return payload.summary;
};
