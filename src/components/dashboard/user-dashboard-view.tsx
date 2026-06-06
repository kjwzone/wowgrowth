import Link from "next/link";
import { OnboardingProgress } from "@/components/dashboard/onboarding-progress";
import { MatchScoreBar } from "@/components/dashboard/match-score-bar";
import { PageCard } from "@/components/ui/page-card";
import { StatCard } from "@/components/ui/stat-card";
import { formatDeadlineLabel } from "@/lib/data/user-dashboard";
import type { UserDashboardSummary } from "@/lib/data/user-dashboard";
import type { AppRole } from "@/lib/types/database";

const roleLabel: Record<AppRole, string> = {
  user: "일반 사용자",
  admin: "관리자",
  reviewer: "검수자",
};

const roleBadgeClass: Record<AppRole, string> = {
  user: "bg-blue-100 text-blue-800",
  admin: "bg-violet-100 text-violet-800",
  reviewer: "bg-amber-100 text-amber-800",
};

type UserDashboardViewProps = {
  email: string;
  role: AppRole;
  summary: UserDashboardSummary;
  isStaff: boolean;
};

const companyEditHref = (companyId: string, isStaff: boolean) =>
  isStaff ? `/company/edit?id=${companyId}` : "/company/edit";

export const UserDashboardView = ({
  email,
  role,
  summary,
  isStaff,
}: UserDashboardViewProps) => (
  <div className="space-y-6">
    <section className="overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 p-6 text-white shadow-lg">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-300">WOW Growth에 오신 것을 환영합니다</p>
          <h2 className="mt-1 text-2xl font-semibold">{email}</h2>
          <span
            className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-medium ${roleBadgeClass[role]}`}
          >
            {roleLabel[role]}
          </span>
        </div>
        <div className="rounded-xl bg-white/10 px-5 py-4 text-center backdrop-blur">
          <p className="text-3xl font-bold">{summary.completionPercent}%</p>
          <p className="mt-1 text-xs text-slate-300">전체 진행률</p>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <Link
          href={summary.company ? "/company/detail" : "/company/new"}
          className="rounded-md bg-white px-4 py-2 text-sm font-medium text-slate-900 transition hover:bg-slate-100"
        >
          {summary.company ? "기업정보 보기" : "기업정보 등록"}
        </Link>
        <Link
          href="/programs"
          className="rounded-md border border-white/30 px-4 py-2 text-sm text-white transition hover:bg-white/10"
        >
          지원사업 둘러보기
        </Link>
        {isStaff ? (
          <Link
            href="/admin"
            className="rounded-md border border-white/30 px-4 py-2 text-sm text-white transition hover:bg-white/10"
          >
            관리자 대시보드
          </Link>
        ) : null}
      </div>
    </section>

    <OnboardingProgress
      steps={summary.onboardingSteps}
      completionPercent={summary.completionPercent}
    />

    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="게시 공고"
        value={summary.publishedPrograms}
        hint="신청 가능한 지원사업"
        href="/programs"
        tone="ok"
        icon="📋"
      />
      <StatCard
        label="추천 사업"
        value={summary.matchCount}
        hint={isStaff ? "전체 추천 결과" : "내 기업 추천"}
        href="/matches"
        tone={summary.matchCount > 0 ? "accent" : "default"}
        icon="🎯"
      />
      <StatCard
        label="기업진단"
        value={summary.diagnosisCount}
        hint="생성된 진단 보고서"
        href="/reports/diagnosis"
        icon="📊"
      />
      <StatCard
        label="사업계획서"
        value={summary.businessPlanCount}
        hint="AI 초안"
        href="/business-plans"
        icon="📝"
      />
    </div>

    <div className="grid gap-4 lg:grid-cols-2">
      <PageCard
        title={summary.company && !summary.company.isOwnCompany ? "등록 기업" : "내 기업"}
        description={
          summary.company && !summary.company.isOwnCompany
            ? "관리자: 플랫폼에 등록된 최근 기업"
            : undefined
        }
      >
        {summary.company ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
              <p className="text-lg font-semibold text-slate-900">
                {summary.company.company_name}
              </p>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex gap-2">
                  <dt className="w-16 shrink-0 text-slate-500">업종</dt>
                  <dd className="text-slate-800">{summary.company.industry}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-16 shrink-0 text-slate-500">소재지</dt>
                  <dd className="text-slate-800">{summary.company.region}</dd>
                </div>
              </dl>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/company/detail"
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
              >
                상세 보기
              </Link>
              <Link
                href={companyEditHref(summary.company.id, isStaff)}
                className="rounded-md bg-slate-900 px-3 py-1.5 text-sm text-white"
              >
                수정
              </Link>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
            <p className="text-sm text-slate-600">
              등록된 기업정보가 없습니다. 먼저 기업정보를 등록하면 맞춤 추천과
              진단을 받을 수 있습니다.
            </p>
            <Link
              href="/company/new"
              className="mt-4 inline-block rounded-md bg-slate-900 px-4 py-2 text-sm text-white"
            >
              기업정보 등록하기
            </Link>
          </div>
        )}
      </PageCard>

      <PageCard
        title="추천 TOP"
        description={summary.topMatches.length > 0 ? "점수가 높은 순" : undefined}
      >
        {summary.topMatches.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 p-6 text-center">
            <p className="text-sm text-slate-500">
              {summary.company
                ? "아직 추천 결과가 없습니다. 추천사업 메뉴에서 생성해 보세요."
                : "기업정보 등록 후 추천을 생성할 수 있습니다."}
            </p>
            {summary.company ? (
              <Link href="/matches" className="mt-3 inline-block text-sm underline">
                추천 생성하기
              </Link>
            ) : null}
          </div>
        ) : (
          <ul className="space-y-4">
            {summary.topMatches.map((match) => (
              <li key={match.id}>
                <Link
                  href={`/matches/${match.id}`}
                  className="block rounded-lg border border-slate-100 p-3 transition hover:border-indigo-200 hover:bg-indigo-50/30"
                >
                  <p className="truncate text-sm font-medium text-slate-900">
                    {match.programTitle}
                  </p>
                  <div className="mt-2">
                    <MatchScoreBar score={match.score} label={match.recommendationLabel} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </PageCard>
    </div>

    <PageCard title="마감 임박 공고" description="게시 중인 지원사업">
      {summary.recentPrograms.length === 0 ? (
        <p className="text-sm text-slate-500">게시된 공고가 없습니다.</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {summary.recentPrograms.map((program) => {
            const deadline = formatDeadlineLabel(program.application_end_date);
            return (
              <li key={program.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <Link
                    href={`/programs/${program.id}`}
                    className="truncate font-medium hover:underline"
                  >
                    {program.title}
                  </Link>
                  <p className="text-sm text-slate-500">
                    {program.agency} · {program.region ?? "지역 미정"}
                  </p>
                </div>
                {deadline ? (
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                      deadline === "마감"
                        ? "bg-slate-100 text-slate-500"
                        : "bg-rose-100 text-rose-700"
                    }`}
                  >
                    {deadline}
                  </span>
                ) : program.application_end_date ? (
                  <span className="shrink-0 text-xs text-slate-400">
                    ~{program.application_end_date}
                  </span>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
      <Link href="/programs" className="mt-3 inline-block text-sm underline">
        전체 공고 보기
      </Link>
    </PageCard>
  </div>
);
