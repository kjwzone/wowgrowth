export type ProgramStatus = "draft" | "published" | "closed";

export type JobStatus = "queued" | "running" | "succeeded" | "failed";

export type {
  AdminBusinessPlanRow,
  AdminCompanyRow,
  AdminDashboardDetails,
  AdminDashboardSummary,
  AdminDiagnosisRow,
  AdminMatchingRow,
  ProgramStatusCounts,
} from "@/lib/admin-dashboard-types";

import type { AdminDashboardSummary, ProgramStatusCounts } from "@/lib/admin-dashboard-types";

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

export const formatAdminDate = (iso: string): string =>
  new Date(iso).toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
