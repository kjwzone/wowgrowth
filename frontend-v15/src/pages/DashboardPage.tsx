import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BarChart3,
  Building2,
  ClipboardList,
  FileBarChart,
  Sparkles,
  Target,
  CalendarClock,
  ArrowRight,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { PageHeader, SectionCard } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { InsightCard } from "@/components/ui/InsightCard";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ScoreBadge } from "@/components/ui/ScoreBadge";
import { dashboardApi, type DashboardSnapshot } from "@/lib/api";
import { cn } from "@/lib/utils";

const quickActions = [
  { to: "/company-profile", label: "기업정보 입력", icon: Building2 },
  { to: "/company-diagnosis", label: "기업진단보고서", icon: FileBarChart },
  { to: "/matching-results", label: "AI 매칭 결과", icon: Sparkles },
  { to: "/business-plan", label: "사업계획서 작성", icon: ClipboardList },
] as const;

export default function DashboardPage() {
  const navigate = useNavigate();
  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(null);

  useEffect(() => {
    void dashboardApi.getSnapshot().then(setSnapshot);
  }, []);

  if (!snapshot) {
    return <p className="text-on-surface-variant">대시보드 로딩 중...</p>;
  }

  const { stats, insights, checklist, scoreTrend, closingPrograms, projectedReadiness, dataSources } =
    snapshot;
  const usingLiveData = dataSources.matching === "bizinfo" && dataSources.programs === "bizinfo";

  return (
    <div className="space-y-6">
      <PageHeader
        title="대시보드"
        description="기업 진단·추천 공고·사업계획서 진행 현황을 한눈에 확인하세요."
        action={
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => navigate("/matching-results")}
              className="inline-flex items-center gap-2 rounded-lg border border-secondary bg-white px-4 py-2 text-sm font-medium text-secondary hover:bg-secondary/5"
            >
              <Sparkles className="h-4 w-4" />
              AI 매칭 보기
            </button>
            <button
              type="button"
              onClick={() => navigate("/business-plan")}
              className="inline-flex items-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-on-secondary hover:opacity-90"
            >
              <ClipboardList className="h-4 w-4" />
              사업계획서 작성
            </button>
          </div>
        }
      />

      <p
        className={cn(
          "rounded-lg border px-4 py-2 text-sm",
          usingLiveData
            ? "border-secondary/30 bg-secondary/5 text-secondary"
            : "border-outline-variant/40 bg-surface-container-low text-on-surface-variant",
        )}
      >
        {usingLiveData
          ? "기업정보·AI 매칭(기업마당)·사업계획서 초안 데이터가 연동되었습니다."
          : "일부 데이터는 데모/캐시 소스입니다. 기업마당 API 연결 시 실시간 공고·매칭이 반영됩니다."}
      </p>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="기업 진단 점수"
          value={`${stats.diagnosisScore}점`}
          sub={stats.diagnosisStatus}
          icon={Target}
          trend="up"
          onClick={() => navigate("/company-diagnosis")}
        />
        <StatCard
          label="추천 지원사업"
          value={stats.recommendedCount}
          sub="AI 매칭 Top 결과"
          icon={Sparkles}
          trend={stats.recommendedCount > 0 ? "neutral" : "down"}
          onClick={() => navigate("/matching-results")}
        />
        <StatCard
          label="진행 중 사업계획서"
          value={stats.activePlans}
          sub="작성·보완 중인 섹션"
          icon={ClipboardList}
          onClick={() => navigate("/business-plan")}
        />
        <StatCard
          label="제출 준비도"
          value={`${stats.readinessScore}%`}
          sub={`보완 후 ${projectedReadiness}% 예상`}
          icon={BarChart3}
          trend={stats.readinessScore >= projectedReadiness ? "neutral" : "up"}
          onClick={() => navigate("/business-plan")}
        />
      </div>

      <SectionCard title="빠른 이동" description="다음 단계로 바로 이동합니다.">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {quickActions.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="flex items-center justify-between rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-4 py-3 text-sm font-medium text-primary transition hover:border-secondary/40 hover:bg-white"
            >
              <span className="inline-flex items-center gap-2">
                <Icon className="h-4 w-4 text-secondary" />
                {label}
              </span>
              <ArrowRight className="h-4 w-4 text-on-surface-variant" />
            </Link>
          ))}
        </div>
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-5">
        <SectionCard
          title="마감 임박 공고"
          description="21일 이내 마감 · AI 매칭 점수 연동"
          className="xl:col-span-3"
        >
          {closingPrograms.length === 0 ? (
            <p className="text-sm text-on-surface-variant">마감 임박 공고가 없습니다.</p>
          ) : (
            <ul className="divide-y divide-outline-variant/20">
              {closingPrograms.map((program) => (
                <li
                  key={program.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/programs/${program.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {program.title}
                    </Link>
                    <p className="mt-1 flex items-center gap-1 text-sm text-on-surface-variant">
                      <CalendarClock className="h-4 w-4 shrink-0" />
                      D-{program.daysLeft} · {program.region} · {program.agency}
                    </p>
                  </div>
                  {program.linkedMatchScore !== null ? (
                    <ScoreBadge score={program.linkedMatchScore} size="sm" />
                  ) : (
                    <span className="rounded-full bg-surface-container px-2 py-1 text-xs text-on-surface-variant">
                      AI 매칭 예정
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="제출 준비도" className="xl:col-span-2">
          <ProgressBar value={stats.readinessScore} label="사업계획서 완성도" />
          <ul className="mt-4 space-y-2 text-sm">
            {checklist.map((item) => (
              <li key={item.id}>
                {item.href ? (
                  <Link
                    to={item.href}
                    className={cn(
                      "flex items-start gap-2 rounded-lg px-2 py-1.5 transition hover:bg-surface-container",
                      item.done ? "text-on-surface-variant" : "font-medium text-primary",
                    )}
                  >
                    <span aria-hidden>{item.done ? "✓" : "○"}</span>
                    <span>{item.label}</span>
                  </Link>
                ) : (
                  <span
                    className={cn(
                      "flex items-start gap-2 px-2 py-1.5",
                      item.done ? "text-on-surface-variant" : "font-medium text-primary",
                    )}
                  >
                    <span aria-hidden>{item.done ? "✓" : "○"}</span>
                    <span>{item.label}</span>
                  </span>
                )}
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {insights.map((insight) => (
          <InsightCard key={insight.id} insight={insight} />
        ))}
      </div>

      <SectionCard title="진단 점수 추이" description="최근 5개월 추정 추이 (현재 진단 점수 기준)">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={scoreTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e4e2e5" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="score" fill="#0040e0" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </SectionCard>
    </div>
  );
}
