import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { PageCard } from "@/components/ui/page-card";
import { StatCard } from "@/components/ui/stat-card";
import { getSessionProfile } from "@/lib/auth/get-session";
import { fetchAdminDashboardSummary } from "@/lib/data/admin-dashboard";
import { redirect } from "next/navigation";

export default async function AdminDashboardPage() {
  const session = await getSessionProfile();
  if (!session || session.profile.role !== "admin") redirect("/error/403");

  const summary = await fetchAdminDashboardSummary();

  return (
    <AppShell title="관리자 대시보드" role="admin">
      <PageCard title="운영 현황" description="공고·추천·검수·작업 요약">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="공고 (게시)"
            value={summary.programs.published}
            hint={`전체 ${summary.programs.total} · draft ${summary.programs.draft} · closed ${summary.programs.closed}`}
            href="/admin/programs"
            tone="ok"
          />
          <StatCard
            label="등록 기업"
            value={summary.companies}
            href="/company/detail"
          />
          <StatCard
            label="추천 결과"
            value={summary.matches}
            href="/matches"
          />
          <StatCard
            label="검수 대기"
            value={summary.pendingReviews}
            href="/admin/reviews/programs"
            tone={summary.pendingReviews > 0 ? "warn" : "default"}
          />
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="AI 작업 실패"
            value={summary.aiJobs.failed}
            hint={`전체 ${summary.aiJobs.total} · running ${summary.aiJobs.running}`}
            href="/admin/jobs"
            tone={summary.aiJobs.failed > 0 ? "warn" : "default"}
          />
          <StatCard label="기업진단 보고서" value={summary.diagnosisReports} href="/reports/diagnosis" />
          <StatCard label="사업계획서" value={summary.businessPlans} href="/business-plans" />
          <StatCard
            label="AI 작업 성공"
            value={summary.aiJobs.succeeded}
            href="/admin/jobs"
          />
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/admin/programs/new"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white"
          >
            공고 등록
          </Link>
          <Link
            href="/admin/programs"
            className="rounded-md border border-slate-300 px-4 py-2 text-sm"
          >
            공고 관리
          </Link>
          <Link
            href="/admin/reviews/programs"
            className="rounded-md border border-slate-300 px-4 py-2 text-sm"
          >
            AI 검수
          </Link>
          <Link
            href="/admin/jobs"
            className="rounded-md border border-slate-300 px-4 py-2 text-sm"
          >
            작업 모니터링
          </Link>
        </div>
      </PageCard>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <PageCard title="검수 대기">
          {summary.pendingReviewItems.length === 0 ? (
            <p className="text-sm text-slate-500">검수 대기 항목이 없습니다.</p>
          ) : (
            <ul className="divide-y divide-slate-100 text-sm">
              {summary.pendingReviewItems.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{item.title}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(item.created_at).toLocaleString("ko-KR")}
                    </p>
                  </div>
                  <Link
                    href={`/admin/reviews/programs/${item.id}`}
                    className="shrink-0 text-slate-900 underline"
                  >
                    검수
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </PageCard>

        <PageCard title="최근 실패한 AI 작업">
          {summary.recentFailedJobs.length === 0 ? (
            <p className="text-sm text-slate-500">실패한 작업이 없습니다.</p>
          ) : (
            <ul className="divide-y divide-slate-100 text-sm">
              {summary.recentFailedJobs.map((job) => (
                <li key={job.id} className="py-2">
                  <p className="font-mono text-xs text-slate-500">{job.id.slice(0, 8)}</p>
                  <p>
                    {job.task_type}
                    {job.error_code ? ` · ${job.error_code}` : ""}
                  </p>
                  <p className="text-xs text-slate-500">
                    {new Date(job.created_at).toLocaleString("ko-KR")}
                  </p>
                </li>
              ))}
            </ul>
          )}
          <Link href="/admin/jobs" className="mt-3 inline-block text-sm underline">
            전체 작업 보기
          </Link>
        </PageCard>
      </div>
    </AppShell>
  );
}
