import { AlertTriangle } from "lucide-react";
import { formatAdminDate } from "@/lib/admin-dashboard";
import type { AdminDashboardSummary } from "@/lib/admin-dashboard-types";

export const FailedJobList = ({
  jobs,
}: {
  jobs: AdminDashboardSummary["recentFailedJobs"];
}) => {
  if (jobs.length === 0) {
    return <p className="text-sm text-on-surface-variant">실패한 작업이 없습니다.</p>;
  }

  return (
    <ul className="space-y-3">
      {jobs.map((job) => (
        <li
          key={job.id}
          className="rounded-lg border border-amber-100 bg-amber-50/50 px-4 py-3"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <div className="min-w-0 flex-1">
              <p className="font-medium text-primary">
                {job.task_type}
                {job.error_code ? (
                  <span className="ml-1 font-normal text-on-surface-variant">
                    · {job.error_code}
                  </span>
                ) : null}
              </p>
              <p className="mt-1 font-mono text-xs text-on-surface-variant">
                {job.id.slice(0, 8)}
              </p>
              <p className="mt-1 text-xs text-on-surface-variant">
                {formatAdminDate(job.created_at)}
              </p>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
};
