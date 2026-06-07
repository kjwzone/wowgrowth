import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Clock, FileWarning, ShieldCheck, XCircle } from "lucide-react";
import { PageHeader, SectionCard } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { adminDashboardApi } from "@/lib/api";
import type { AdminDashboardSummary } from "@/lib/admin-dashboard";

export default function AdminDashboardPage() {
  const [summary, setSummary] = useState<AdminDashboardSummary | null>(null);

  useEffect(() => {
    void adminDashboardApi.getSummary().then(setSummary);
  }, []);

  if (!summary) {
    return <p className="text-on-surface-variant">관리자 대시보드 로딩 중...</p>;
  }

  return (
    <div>
      <PageHeader
        title="관리자 대시보드"
        description="제출·검수 현황과 승인율을 모니터링합니다."
        action={
          <Link
            to="/admin/review"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-on-primary hover:opacity-90"
          >
            <ShieldCheck className="h-4 w-4" />
            검수 상세
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="전체 제출" value={summary.totalSubmissions} icon={ShieldCheck} />
        <StatCard label="검수 대기" value={summary.pending} icon={Clock} />
        <StatCard label="승인" value={summary.approved} icon={CheckCircle2} />
        <StatCard label="보완 요청" value={summary.revisionRequested} icon={FileWarning} />
        <StatCard label="반려" value={summary.rejected} icon={XCircle} />
      </div>

      <SectionCard title="승인율" className="mt-6">
        <p className="text-3xl font-bold text-secondary">{summary.approvalRate}%</p>
        <p className="mt-1 text-sm text-on-surface-variant">
          처리 완료 건 대비 승인 비율 (보완·반려 제외)
        </p>
      </SectionCard>

      <SectionCard title="최근 제출" className="mt-6">
        <ul className="divide-y divide-outline-variant/20">
          {summary.recentSubmissions.map((item) => (
            <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div>
                <p className="font-medium text-primary">{item.companyName}</p>
                <p className="text-sm text-on-surface-variant">
                  {item.programTitle} · {item.submittedAt}
                </p>
              </div>
              <StatusBadge status={item.status} />
            </li>
          ))}
        </ul>
      </SectionCard>
    </div>
  );
}
