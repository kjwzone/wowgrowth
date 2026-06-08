import type {
  BusinessPlanDraft,
  CompanyProfile,
  DashboardInsight,
  DashboardStats,
  MatchingResult,
  SupportProgram,
} from "@/types";

export type DashboardChecklistItem = {
  id: string;
  label: string;
  done: boolean;
  href?: string;
};

export type DashboardScorePoint = {
  month: string;
  score: number;
};

export type DashboardClosingProgram = SupportProgram & {
  linkedMatchScore: number | null;
};

export type DashboardSnapshot = {
  stats: DashboardStats;
  insights: DashboardInsight[];
  checklist: DashboardChecklistItem[];
  scoreTrend: DashboardScorePoint[];
  closingPrograms: DashboardClosingProgram[];
  projectedReadiness: number;
  dataSources: {
    matching: "bizinfo" | "mock";
    programs: "bizinfo" | "mock";
  };
};

const MIN_SECTION_LENGTH = 20;
const TREND_MONTHS = ["1월", "2월", "3월", "4월", "5월"] as const;
const TREND_FACTORS = [0.76, 0.83, 0.9, 0.95, 1] as const;

export const buildScoreTrend = (currentScore: number): DashboardScorePoint[] =>
  TREND_MONTHS.map((month, index) => ({
    month,
    score: Math.round(currentScore * TREND_FACTORS[index]!),
  }));

export const buildDashboardChecklist = (
  company: CompanyProfile,
  matching: readonly MatchingResult[],
  plan: BusinessPlanDraft,
): DashboardChecklistItem[] => {
  const incompleteSections = plan.sections.filter(
    (section) => section.content.trim().length < MIN_SECTION_LENGTH,
  );

  return [
    {
      id: "company",
      label: "기업정보 입력 완료",
      done: Boolean(company.name && company.businessNumber && company.industry),
      href: "/company-profile",
    },
    {
      id: "matching",
      label: "AI 매칭 완료",
      done: matching.length > 0,
      href: "/matching-results",
    },
    {
      id: "plan-sections",
      label:
        incompleteSections.length > 0
          ? `사업계획서 ${incompleteSections.length}개 섹션 보완 필요`
          : "사업계획서 섹션 작성 완료",
      done: incompleteSections.length === 0,
      href: "/business-plan",
    },
    {
      id: "submission",
      label: "제출 준비 검증 완료",
      done: plan.status === "ready",
      href: "/business-plan",
    },
  ];
};

export const buildDashboardInsights = (
  matching: readonly MatchingResult[],
  closingPrograms: readonly DashboardClosingProgram[],
  plan: BusinessPlanDraft,
  readinessScore: number,
): DashboardInsight[] => {
  const topMatch = [...matching].sort((a, b) => b.score - a.score)[0];
  const urgentProgram = [...closingPrograms].sort((a, b) => a.daysLeft - b.daysLeft)[0];
  const incompleteCount = plan.sections.filter(
    (section) => section.content.trim().length < MIN_SECTION_LENGTH,
  ).length;
  const projected = Math.min(95, readinessScore + incompleteCount * 6 + (plan.status === "ready" ? 10 : 0));

  const insights: DashboardInsight[] = [];

  if (urgentProgram) {
    insights.push({
      id: "closing-alert",
      title: "마감 임박 공고",
      body: `「${urgentProgram.title}」 D-${urgentProgram.daysLeft}. 사업계획서·서류 준비를 우선 진행하세요.`,
      type: "alert",
    });
  }

  if (topMatch) {
    insights.push({
      id: "top-match",
      title: "매칭 추천",
      body: `「${topMatch.programTitle}」 적합도 ${topMatch.score}점 — 현재 가장 유리한 공고입니다.`,
      type: "success",
    });
  }

  insights.push({
    id: "readiness-tip",
    title: "제출 준비도",
    body:
      incompleteCount > 0
        ? `미작성 섹션 ${incompleteCount}개 보완 시 제출 준비도 ${projected}%까지 상승 예상.`
        : plan.status === "ready"
          ? "제출 준비 검증이 완료되었습니다. 다운로드·제출을 진행하세요."
          : "제출 준비 검증을 실행해 최종 점검을 완료하세요.",
    type: "tip",
  });

  return insights;
};

export const buildClosingPrograms = (
  programs: readonly SupportProgram[],
  matching: readonly MatchingResult[],
  limit = 5,
): DashboardClosingProgram[] => {
  const matchByProgramId = new Map(matching.map((item) => [item.programId, item.score]));

  return [...programs]
    .filter((program) => program.daysLeft <= 21)
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, limit)
    .map((program) => ({
      ...program,
      linkedMatchScore: matchByProgramId.get(program.id) ?? program.matchScore,
    }));
};

export const buildDashboardStats = (
  company: CompanyProfile,
  matching: readonly MatchingResult[],
  plan: BusinessPlanDraft,
): DashboardStats => {
  const inProgressSections = plan.sections.filter(
    (section) => section.completeness > 15 && section.completeness < 90,
  ).length;

  return {
    diagnosisStatus: company.diagnosisStatus,
    diagnosisScore: company.diagnosisScore,
    recommendedCount: matching.length,
    activePlans: inProgressSections > 0 ? inProgressSections : plan.overallCompleteness > 0 ? 1 : 0,
    readinessScore: plan.overallCompleteness,
  };
};

export const buildProjectedReadiness = (
  readinessScore: number,
  plan: BusinessPlanDraft,
): number => {
  const incompleteCount = plan.sections.filter(
    (section) => section.content.trim().length < MIN_SECTION_LENGTH,
  ).length;
  return Math.min(95, readinessScore + incompleteCount * 6 + (plan.status === "ready" ? 10 : 0));
};

export const buildDashboardSnapshot = (input: {
  company: CompanyProfile;
  matching: readonly MatchingResult[];
  plan: BusinessPlanDraft;
  programs: readonly SupportProgram[];
  sources: DashboardSnapshot["dataSources"];
}): DashboardSnapshot => {
  const stats = buildDashboardStats(input.company, input.matching, input.plan);
  const closingPrograms = buildClosingPrograms(input.programs, input.matching);
  const projectedReadiness = buildProjectedReadiness(stats.readinessScore, input.plan);

  return {
    stats,
    insights: buildDashboardInsights(
      input.matching,
      closingPrograms,
      input.plan,
      stats.readinessScore,
    ),
    checklist: buildDashboardChecklist(input.company, input.matching, input.plan),
    scoreTrend: buildScoreTrend(stats.diagnosisScore),
    closingPrograms,
    projectedReadiness,
    dataSources: input.sources,
  };
};
