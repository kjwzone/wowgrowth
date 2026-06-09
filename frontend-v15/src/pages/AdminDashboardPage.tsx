import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  FileText,
  LayoutDashboard,
  Sparkles,
  Stethoscope,
} from "lucide-react";
import { AdminDataTable } from "@/components/admin/AdminDataTable";
import { AdminPanel } from "@/components/admin/AdminPanel";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { AdminTabBar, type AdminTabItem } from "@/components/admin/AdminTabBar";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { adminDashboardApi } from "@/lib/api";
import { formatAdminDate, type AdminDashboardSummary } from "@/lib/admin-dashboard";
import { getAdminTabCount, type AdminTab } from "@/lib/admin-dashboard-tabs";

const tabs: AdminTabItem<AdminTab>[] = [
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

  const tabsWithCounts = useMemo(
    () =>
      details
        ? tabs.map((tab) => ({
            ...tab,
            count: getAdminTabCount(tab.id, details),
          }))
        : tabs,
    [details],
  );

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
              header: "상태",
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
              key: "applicant",
              header: "신청자",
              render: (row: (typeof details.businessPlans)[number]) => row.applicantName,
            },
            {
              key: "program",
              header: "공고",
              render: (row: (typeof details.businessPlans)[number]) => (
                <p className="text-sm text-on-surface-variant">{row.programTitle}</p>
              ),
            },
            {
              key: "title",
              header: "AI 문서",
              render: (row: (typeof details.businessPlans)[number]) => (
                <div>
                  <p className="font-medium text-primary">{row.title}</p>
                  <p className="text-xs text-on-surface-variant">섹션 {row.sectionCount}개</p>
                </div>
              ),
            },
            {
              key: "created",
              header: "생성일",
              className: "whitespace-nowrap",
              render: (row: (typeof details.businessPlans)[number]) =>
                formatAdminDate(row.createdAt),
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
      <div className="space-y-6">
        <PageHeader title="관리자 대시보드" description="등록 기업·진단·매칭·사업계획서 통합 조회" />
        <AdminPanel title="Supabase 연결 필요">
          <p className="text-sm text-error">{error}</p>
          <p className="mt-2 text-sm text-on-surface-variant">
            Vercel(kd4u) Environment Variables에{" "}
            <code className="rounded bg-surface-container px-1">NEXT_PUBLIC_SUPABASE_URL</code>,{" "}
            <code className="rounded bg-surface-container px-1">SUPABASE_SERVICE_ROLE_KEY</code>를
            등록한 뒤 재배포하세요.
          </p>
        </AdminPanel>
      </div>
    );
  }

  if (!summary || !details) {
    return (
      <div className="flex min-h-[240px] items-center justify-center rounded-xl border border-outline-variant/30 bg-white">
        <p className="text-on-surface-variant">관리자 대시보드 로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="관리자 대시보드"
        description="등록 기업·진단 보고서·AI 매칭·사업계획서 통합 조회"
      />

      <AdminTabBar tabs={tabsWithCounts} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === "overview" ? (
        <div className="space-y-6">
          <AdminPanel title="운영 현황" description="Supabase 실데이터 기준 요약">
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
                label="사업계획서"
                value={summary.businessPlans}
                onClick={() => setActiveTab("plans")}
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
              <StatCard label="AI 작업 성공" value={summary.aiJobs.succeeded} tone="ok" />
              <StatCard
                label="AI 작업 전체"
                value={summary.aiJobs.total}
                hint={`queued ${summary.aiJobs.queued} · running ${summary.aiJobs.running}`}
              />
            </div>
          </AdminPanel>

          <AdminPanel
            title="사용자별 AI 문서 현황"
            description="최근 생성·수정된 사업계획서"
            action={
              details.businessPlans.length > 0 ? (
                <button
                  type="button"
                  onClick={() => setActiveTab("plans")}
                  className="text-sm font-medium text-secondary hover:underline"
                >
                  전체 {details.businessPlans.length}건 보기 →
                </button>
              ) : null
            }
          >
            <AdminDataTable
              columns={planColumns}
              rows={details.businessPlans}
              emptyMessage="생성된 AI 문서가 없습니다."
            />
          </AdminPanel>
        </div>
      ) : null}

      {activeTab === "companies" ? (
        <AdminPanel
          title="등록 기업"
          description={`총 ${details.companies.length}개 기업 · 최신 등록순`}
        >
          <AdminDataTable
            columns={companyColumns}
            rows={details.companies}
            emptyMessage="등록된 기업이 없습니다."
          />
        </AdminPanel>
      ) : null}

      {activeTab === "diagnosis" ? (
        <AdminPanel
          title="기업진단 보고서"
          description={`총 ${details.diagnosisReports.length}건 · 기업별 생성 현황`}
        >
          <AdminDataTable
            columns={diagnosisColumns}
            rows={details.diagnosisReports}
            emptyMessage="생성된 기업진단 보고서가 없습니다."
          />
        </AdminPanel>
      ) : null}

      {activeTab === "matching" ? (
        <AdminPanel
          title="AI 매칭 · 추천 지원사업"
          description={`총 ${details.matchingResults.length}건 · 매칭 점수순`}
        >
          <AdminDataTable
            columns={matchingColumns}
            rows={details.matchingResults}
            emptyMessage="AI 매칭 결과가 없습니다."
          />
        </AdminPanel>
      ) : null}

      {activeTab === "plans" ? (
        <AdminPanel
          title="사용자별 AI 문서·신청 현황"
          description={`총 ${details.businessPlans.length}건 · 사업계획서 생성·수정 현황`}
        >
          <AdminDataTable
            columns={planColumns}
            rows={details.businessPlans}
            emptyMessage="생성된 사업계획서가 없습니다."
          />
        </AdminPanel>
      ) : null}
    </div>
  );
}
