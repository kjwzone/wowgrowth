import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  ClipboardList,
  FileText,
  LayoutDashboard,
  Sparkles,
  Stethoscope,
} from "lucide-react";
import { AdminDataTable } from "@/components/admin/AdminDataTable";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { PageHeader, SectionCard } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { adminDashboardApi } from "@/lib/api";
import { formatAdminDate, type AdminDashboardSummary } from "@/lib/admin-dashboard";
import { cn } from "@/lib/utils";

type AdminTab = "overview" | "companies" | "diagnosis" | "matching" | "plans";

const tabs: { id: AdminTab; label: string; icon: typeof Building2 }[] = [
  { id: "overview", label: "운영 현황", icon: LayoutDashboard },
  { id: "companies", label: "등록 기업", icon: Building2 },
  { id: "diagnosis", label: "기업진단 보고서", icon: Stethoscope },
  { id: "matching", label: "AI 매칭", icon: Sparkles },
  { id: "plans", label: "사업계획서", icon: FileText },
];

export default function AdminDashboardPage() {
  const [summary, setSummary] = useState<AdminDashboardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");

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

  const details = summary?.details;

  const companyColumns = useMemo(
    () =>
      details
        ? [
            {
              key: "company",
              header: "기업명",
              render: (row: (typeof details.companies)[number]) => (
                <div>
                  <p className="font-medium text-primary">{row.companyName}</p>
                  <p className="text-xs text-on-surface-variant">{row.businessNumber}</p>
                </div>
              ),
            },
            {
              key: "industry",
              header: "업종",
              render: (row: (typeof details.companies)[number]) => row.industry,
            },
            {
              key: "region",
              header: "지역",
              render: (row: (typeof details.companies)[number]) => row.region,
            },
            {
              key: "created",
              header: "등록일",
              className: "whitespace-nowrap",
              render: (row: (typeof details.companies)[number]) => formatAdminDate(row.createdAt),
            },
          ]
        : [],
    [details],
  );

  const diagnosisColumns = useMemo(
    () =>
      details
        ? [
            {
              key: "company",
              header: "기업",
              render: (row: (typeof details.diagnosisReports)[number]) => (
                <p className="font-medium text-primary">{row.companyName}</p>
              ),
            },
            {
              key: "score",
              header: "진단 점수",
              render: (row: (typeof details.diagnosisReports)[number]) =>
                row.overallScore !== null ? (
                  <span className="font-semibold text-secondary">{row.overallScore}</span>
                ) : (
                  <span className="text-on-surface-variant">—</span>
                ),
            },
            {
              key: "status",
              header: "상태",
              render: (row: (typeof details.diagnosisReports)[number]) => (
                <AdminStatusBadge value={row.status} />
              ),
            },
            {
              key: "model",
              header: "모델",
              render: (row: (typeof details.diagnosisReports)[number]) => (
                <span className="text-xs text-on-surface-variant">{row.model}</span>
              ),
            },
            {
              key: "created",
              header: "생성일",
              className: "whitespace-nowrap",
              render: (row: (typeof details.diagnosisReports)[number]) =>
                formatAdminDate(row.createdAt),
            },
          ]
        : [],
    [details],
  );

  const matchingColumns = useMemo(
    () =>
      details
        ? [
            {
              key: "company",
              header: "기업",
              render: (row: (typeof details.matchingResults)[number]) => (
                <p className="font-medium text-primary">{row.companyName}</p>
              ),
            },
            {
              key: "program",
              header: "추천 공고",
              render: (row: (typeof details.matchingResults)[number]) => (
                <div>
                  <p className="font-medium text-primary">{row.programTitle}</p>
                  <p className="text-xs text-on-surface-variant">{row.agency}</p>
                </div>
              ),
            },
            {
              key: "score",
              header: "매칭 점수",
              render: (row: (typeof details.matchingResults)[number]) => (
                <span className="font-semibold text-secondary">{row.score}</span>
              ),
            },
            {
              key: "level",
              header: "적합도",
              render: (row: (typeof details.matchingResults)[number]) => (
                <AdminStatusBadge value={row.recommendationLevel} />
              ),
            },
            {
              key: "status",
              header: "검수",
              render: (row: (typeof details.matchingResults)[number]) => (
                <AdminStatusBadge value={row.status} />
              ),
            },
            {
              key: "created",
              header: "생성일",
              className: "whitespace-nowrap",
              render: (row: (typeof details.matchingResults)[number]) =>
                formatAdminDate(row.createdAt),
            },
          ]
        : [],
    [details],
  );

  const planColumns = useMemo(
    () =>
      details
        ? [
            {
              key: "company",
              header: "기업",
              render: (row: (typeof details.businessPlans)[number]) => (
                <p className="font-medium text-primary">{row.companyName}</p>
              ),
            },
            {
              key: "program",
              header: "대상 공고",
              render: (row: (typeof details.businessPlans)[number]) => (
                <p className="text-sm text-on-surface-variant">{row.programTitle}</p>
              ),
            },
            {
              key: "title",
              header: "사업계획서",
              render: (row: (typeof details.businessPlans)[number]) => (
                <div>
                  <p className="font-medium text-primary">{row.title}</p>
                  <p className="text-xs text-on-surface-variant">섹션 {row.sectionCount}개</p>
                </div>
              ),
            },
            {
              key: "status",
              header: "상태",
              render: (row: (typeof details.businessPlans)[number]) => (
                <AdminStatusBadge value={row.status} />
              ),
            },
            {
              key: "updated",
              header: "최종 수정",
              className: "whitespace-nowrap",
              render: (row: (typeof details.businessPlans)[number]) =>
                formatAdminDate(row.updatedAt),
            },
          ]
        : [],
    [details],
  );

  if (error) {
    return (
      <div>
        <PageHeader title="관리자 대시보드" description="등록 기업·진단·매칭·사업계획서 통합 조회" />
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

  if (!summary || !details) {
    return <p className="text-on-surface-variant">관리자 대시보드 로딩 중...</p>;
  }

  return (
    <div>
      <PageHeader
        title="관리자 대시보드"
        description="등록 기업·진단 보고서·AI 매칭·사업계획서 통합 조회"
        action={
          <Link
            to="/admin/review"
            className="inline-flex items-center gap-2 rounded-lg border border-outline-variant/60 px-4 py-2 text-sm font-medium text-primary hover:bg-surface-container"
          >
            <ClipboardList className="h-4 w-4" />
            AI 검수
          </Link>
        }
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const count =
            tab.id === "companies"
              ? details.companies.length
              : tab.id === "diagnosis"
                ? details.diagnosisReports.length
                : tab.id === "matching"
                  ? details.matchingResults.length
                  : tab.id === "plans"
                    ? details.businessPlans.length
                    : null;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition",
                activeTab === tab.id
                  ? "bg-primary text-on-primary"
                  : "border border-outline-variant/50 bg-white text-primary hover:bg-surface-container",
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
              {count !== null ? (
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs",
                    activeTab === tab.id ? "bg-white/20" : "bg-surface-container",
                  )}
                >
                  {count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {activeTab === "overview" ? (
        <>
          <SectionCard title="운영 현황" description="Supabase 실데이터 기준 요약">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                label="공고 (게시)"
                value={summary.programs.published}
                hint={`전체 ${summary.programs.total} · draft ${summary.programs.draft} · closed ${summary.programs.closed}`}
                href="/programs"
                tone="ok"
              />
              <StatCard
                label="등록 기업"
                value={summary.companies}
                onClick={() => setActiveTab("companies")}
              />
              <StatCard
                label="추천 결과"
                value={summary.matches}
                onClick={() => setActiveTab("matching")}
              />
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
                onClick={() => setActiveTab("diagnosis")}
              />
              <StatCard
                label="사업계획서"
                value={summary.businessPlans}
                onClick={() => setActiveTab("plans")}
              />
              <StatCard label="AI 작업 성공" value={summary.aiJobs.succeeded} />
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
                          {formatAdminDate(item.created_at)}
                        </p>
                      </div>
                      <Link
                        to="/admin/review"
                        className="shrink-0 text-sm font-medium text-secondary underline"
                      >
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
                      <p className="font-mono text-xs text-on-surface-variant">
                        {job.id.slice(0, 8)}
                      </p>
                      <p className="text-primary">
                        {job.task_type}
                        {job.error_code ? ` · ${job.error_code}` : ""}
                      </p>
                      <p className="text-xs text-on-surface-variant">
                        {formatAdminDate(job.created_at)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>
          </div>
        </>
      ) : null}

      {activeTab === "companies" ? (
        <SectionCard
          title="등록 기업"
          description={`총 ${details.companies.length}개 기업 · 최신 등록순`}
        >
          <AdminDataTable
            columns={companyColumns}
            rows={details.companies}
            emptyMessage="등록된 기업이 없습니다."
          />
        </SectionCard>
      ) : null}

      {activeTab === "diagnosis" ? (
        <SectionCard
          title="기업진단 보고서"
          description={`총 ${details.diagnosisReports.length}건 · 기업별 생성 현황`}
        >
          <AdminDataTable
            columns={diagnosisColumns}
            rows={details.diagnosisReports}
            emptyMessage="생성된 기업진단 보고서가 없습니다."
          />
        </SectionCard>
      ) : null}

      {activeTab === "matching" ? (
        <SectionCard
          title="AI 매칭 · 추천 지원사업"
          description={`총 ${details.matchingResults.length}건 · 매칭 점수순`}
        >
          <AdminDataTable
            columns={matchingColumns}
            rows={details.matchingResults}
            emptyMessage="AI 매칭 결과가 없습니다."
          />
        </SectionCard>
      ) : null}

      {activeTab === "plans" ? (
        <SectionCard
          title="사업계획서 현황"
          description={`총 ${details.businessPlans.length}건 · 최종 수정순`}
        >
          <AdminDataTable
            columns={planColumns}
            rows={details.businessPlans}
            emptyMessage="생성된 사업계획서가 없습니다."
          />
        </SectionCard>
      ) : null}
    </div>
  );
}
