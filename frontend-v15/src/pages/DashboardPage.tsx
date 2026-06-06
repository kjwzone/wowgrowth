import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BarChart3,
  ClipboardList,
  Sparkles,
  Target,
  CalendarClock,
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
import { dashboardApi, programApi } from "@/lib/api";
import type { DashboardInsight, DashboardStats, SupportProgram } from "@/types";

const chartData = [
  { month: "1월", score: 62 },
  { month: "2월", score: 68 },
  { month: "3월", score: 74 },
  { month: "4월", score: 78 },
  { month: "5월", score: 82 },
];

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [insights, setInsights] = useState<DashboardInsight[]>([]);
  const [closing, setClosing] = useState<SupportProgram[]>([]);

  useEffect(() => {
    void Promise.all([
      dashboardApi.getStats(),
      dashboardApi.getInsights(),
      programApi.list(),
    ]).then(([s, i, programs]) => {
      setStats(s);
      setInsights(i);
      setClosing(
        programs
          .filter((p) => p.daysLeft <= 14)
          .sort((a, b) => a.daysLeft - b.daysLeft)
          .slice(0, 3),
      );
    });
  }, []);

  if (!stats) {
    return <p className="text-on-surface-variant">대시보드 로딩 중...</p>;
  }

  return (
    <div>
      <PageHeader
        title="대시보드"
        description="기업 진단·추천 공고·사업계획서 진행 현황을 한눈에 확인하세요."
        action={
          <Link
            to="/matching-results"
            className="rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-on-secondary"
          >
            AI 매칭 보기
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="기업 진단 점수"
          value={`${stats.diagnosisScore}점`}
          sub={stats.diagnosisStatus}
          icon={Target}
          trend="up"
        />
        <StatCard
          label="추천 지원사업"
          value={stats.recommendedCount}
          sub="AI 매칭 완료"
          icon={Sparkles}
          trend="neutral"
        />
        <StatCard
          label="진행 중 사업계획서"
          value={stats.activePlans}
          sub="초안 작성 중"
          icon={ClipboardList}
        />
        <StatCard
          label="제출 준비도"
          value={`${stats.readinessScore}%`}
          sub="보완 후 85% 예상"
          icon={BarChart3}
          trend="up"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <SectionCard title="진단 점수 추이" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e2e5" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="score" fill="#0040e0" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>

        <SectionCard title="제출 준비도">
          <ProgressBar value={stats.readinessScore} label="전체 완성도" />
          <ul className="mt-4 space-y-2 text-sm text-on-surface-variant">
            <li>✓ 기업정보 입력 완료</li>
            <li>✓ AI 매칭 완료</li>
            <li>○ 사업계획서 5·6장 보완 필요</li>
            <li>○ 제출 서류 스캔 업로드</li>
          </ul>
        </SectionCard>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {insights.map((insight) => (
          <InsightCard key={insight.id} insight={insight} />
        ))}
      </div>

      <SectionCard title="마감 임박 공고" className="mt-6">
        <ul className="divide-y divide-outline-variant/20">
          {closing.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div>
                <Link to={`/programs/${p.id}`} className="font-medium text-primary hover:underline">
                  {p.title}
                </Link>
                <p className="mt-1 flex items-center gap-1 text-sm text-on-surface-variant">
                  <CalendarClock className="h-4 w-4" />
                  D-{p.daysLeft} · {p.agency}
                </p>
              </div>
              <ScoreBadge score={p.matchScore} size="sm" />
            </li>
          ))}
        </ul>
      </SectionCard>
    </div>
  );
}
