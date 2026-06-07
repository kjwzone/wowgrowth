import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader, SectionCard } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { adminDashboardApi } from "@/lib/api";
import type { AdminDashboardSummary } from "@/lib/admin-dashboard";

export default function AdminDashboardPage() {
  const [summary, setSummary] = useState<AdminDashboardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void adminDashboardApi
      .getSummary()
      .then((data) => {
        setSummary(data);
        setError(null);
      })
      .catch((fetchError: unknown) => {
        setSummary(null);
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "관리자 대시보드 데이터를 불러오지 못했습니다.",
        );
      });
  }, []);

  if (error) {
    return (
      <div>
        <PageHeader
          title="관리자 대시보드"
          description="공고·추천·검수·작업 요약"
        />
        <SectionCard title="Supabase 연결 필요">
          <p className="text-sm text-error">{error}</p>
          <p className="mt-2 text-sm text-on-surface-variant">
            Vercel(kd4u) Environment Variables에{" "}
            <code className="rounded bg-surface-container px-1">NEXT_PUBLIC_SUPABASE_URL</code>,{" "}
            <code className="rounded bg-surface-container px-1">SUPABASE_SERVICE_ROLE_KEY</code>를
            등록한 뒤 재배포하세요.
          </p>
        </SectionCard>
      </div>
    );
  }

  if (!summary) {
    return <p className="text-on-surface-variant">관리자 대시보드 로딩 중...</p>;
  }

  return (
    <div>
      <PageHeader
        title="관리자 대시보드"
        description="공고·추천·검수·작업 요약"
      />

      <SectionCard title="운영 현황" description="공고·추천·검수·작업 요약">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="공고 (게시)"
            value={summary.programs.published}
            hint={`전체 ${summary.programs.total} · draft ${summary.programs.draft} · closed ${summary.programs.closed}`}
            href="/programs"
            tone="ok"
          />
          <StatCard label="등록 기업" value={summary.companies} href="/company-profile" />
          <StatCard label="추천 결과" value={summary.matches} href="/matching-results" />
          <StatCard
            label="검수 대기"
            value={summary.pendingReviews}
            href="/admin/review"
            tone={summary.pendingReviews > 0 ? "warn" : "default"}
          />
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="AI 작업 실패"
            value={summary.aiJobs.failed}
            hint={`전체 ${summary.aiJobs.total} · running ${summary.aiJobs.running}`}
            tone={summary.aiJobs.failed > 0 ? "warn" : "default"}
          />
          <StatCard
            label="기업진단 보고서"
            value={summary.diagnosisReports}
            href="/company-diagnosis"
          />
          <StatCard label="사업계획서" value={summary.businessPlans} href="/business-plan" />
          <StatCard label="AI 작업 성공" value={summary.aiJobs.succeeded} />
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/programs"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-on-primary hover:opacity-90"
          >
            공고 등록
          </Link>
          <Link
            to="/programs"
            className="rounded-lg border border-outline-variant/60 px-4 py-2 text-sm font-medium text-primary hover:bg-surface-container"
          >
            공고 관리
          </Link>
          <Link
            to="/admin/review"
            className="rounded-lg border border-outline-variant/60 px-4 py-2 text-sm font-medium text-primary hover:bg-surface-container"
          >
            AI 검수
          </Link>
        </div>
      </SectionCard>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <SectionCard title="검수 대기">
          {summary.pendingReviewItems.length === 0 ? (
            <p className="text-sm text-on-surface-variant">검수 대기 항목이 없습니다.</p>
          ) : (
            <ul className="divide-y divide-outline-variant/20 text-sm">
              {summary.pendingReviewItems.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-primary">{item.title}</p>
                    <p className="text-xs text-on-surface-variant">
                      {new Date(item.created_at).toLocaleString("ko-KR")}
                    </p>
                  </div>
                  <Link to="/admin/review" className="shrink-0 text-sm font-medium text-secondary underline">
                    검수
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="최근 실패한 AI 작업">
          {summary.recentFailedJobs.length === 0 ? (
            <p className="text-sm text-on-surface-variant">실패한 작업이 없습니다.</p>
          ) : (
            <ul className="divide-y divide-outline-variant/20 text-sm">
              {summary.recentFailedJobs.map((job) => (
                <li key={job.id} className="py-3">
                  <p className="font-mono text-xs text-on-surface-variant">{job.id.slice(0, 8)}</p>
                  <p className="text-primary">
                    {job.task_type}
                    {job.error_code ? ` · ${job.error_code}` : ""}
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    {new Date(job.created_at).toLocaleString("ko-KR")}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
