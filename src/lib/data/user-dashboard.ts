import { unstable_noStore as noStore } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { levelLabel } from "@/lib/data/matching-results";

export type OnboardingStep = {
  id: string;
  label: string;
  description: string;
  done: boolean;
  href: string;
};

export type UserDashboardSummary = {
  company: {
    id: string;
    company_name: string;
    industry: string;
    region: string;
  } | null;
  publishedPrograms: number;
  matchCount: number;
  diagnosisCount: number;
  businessPlanCount: number;
  onboardingSteps: OnboardingStep[];
  completionPercent: number;
  topMatches: Array<{
    id: string;
    score: number;
    recommendationLabel: string;
    programTitle: string;
    program_id: string;
  }>;
  recentPrograms: Array<{
    id: string;
    title: string;
    agency: string;
    region: string | null;
    application_end_date: string | null;
  }>;
};

export const buildOnboardingSteps = (state: {
  hasCompany: boolean;
  matchCount: number;
  diagnosisCount: number;
  businessPlanCount: number;
}): OnboardingStep[] => [
  {
    id: "company",
    label: "기업정보 등록",
    description: "업종·지역·재무 입력",
    done: state.hasCompany,
    href: state.hasCompany ? "/company/detail" : "/company/new",
  },
  {
    id: "programs",
    label: "지원사업 탐색",
    description: "게시 공고 확인",
    done: state.hasCompany,
    href: "/programs",
  },
  {
    id: "matches",
    label: "추천 생성",
    description: "AI 맞춤 추천",
    done: state.matchCount > 0,
    href: "/matches",
  },
  {
    id: "diagnosis",
    label: "기업진단",
    description: "성장 진단 보고서",
    done: state.diagnosisCount > 0,
    href: "/reports/diagnosis",
  },
  {
    id: "plan",
    label: "사업계획서",
    description: "AI 초안 작성",
    done: state.businessPlanCount > 0,
    href: "/business-plans",
  },
];

export const onboardingCompletionPercent = (
  steps: ReadonlyArray<OnboardingStep>,
): number =>
  steps.length === 0
    ? 0
    : Math.round((steps.filter((step) => step.done).length / steps.length) * 100);

const daysUntil = (dateStr: string | null): number | null => {
  if (!dateStr) return null;
  const end = new Date(dateStr);
  if (Number.isNaN(end.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  return Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

export const formatDeadlineLabel = (dateStr: string | null): string | null => {
  const days = daysUntil(dateStr);
  if (days === null) return null;
  if (days < 0) return "마감";
  if (days === 0) return "오늘 마감";
  if (days <= 7) return `D-${days}`;
  return null;
};

export const fetchUserDashboardSummary = async (params: {
  userId: string;
  isStaff: boolean;
}): Promise<UserDashboardSummary> => {
  noStore();
  const supabase = await createClient();

  const { data: company } = await supabase
    .from("companies")
    .select("id, company_name, industry, region, owner_id")
    .eq("owner_id", params.userId)
    .maybeSingle();

  const scopeByCompany = !params.isStaff && Boolean(company);
  const emptyCounts = !params.isStaff && !company;

  const [
    publishedRes,
    recentProgramsRes,
    matchCountRes,
    diagnosisCountRes,
    planCountRes,
    topMatchesRes,
  ] = await Promise.all([
    supabase
      .from("support_programs")
      .select("id", { count: "exact", head: true })
      .eq("status", "published"),
    supabase
      .from("support_programs")
      .select("id, title, agency, region, application_end_date")
      .eq("status", "published")
      .order("application_end_date", { ascending: true, nullsFirst: false })
      .limit(5),
    emptyCounts
      ? Promise.resolve({ count: 0 })
      : scopeByCompany
        ? supabase
            .from("matching_results")
            .select("id", { count: "exact", head: true })
            .eq("company_id", company!.id)
        : supabase.from("matching_results").select("id", { count: "exact", head: true }),
    emptyCounts
      ? Promise.resolve({ count: 0 })
      : scopeByCompany
        ? supabase
            .from("diagnosis_reports")
            .select("id", { count: "exact", head: true })
            .eq("company_id", company!.id)
        : supabase.from("diagnosis_reports").select("id", { count: "exact", head: true }),
    emptyCounts
      ? Promise.resolve({ count: 0 })
      : scopeByCompany
        ? supabase
            .from("business_plan_drafts")
            .select("id", { count: "exact", head: true })
            .eq("company_id", company!.id)
        : supabase.from("business_plan_drafts").select("id", { count: "exact", head: true }),
    emptyCounts
      ? Promise.resolve({ data: [] })
      : (() => {
          let query = supabase
            .from("matching_results")
            .select("id, score, recommendation_level, program_id")
            .order("score", { ascending: false })
            .limit(5);
          if (scopeByCompany) {
            query = query.eq("company_id", company!.id);
          }
          return query;
        })(),
  ]);

  const matchCount = matchCountRes.count ?? 0;
  const diagnosisCount = diagnosisCountRes.count ?? 0;
  const businessPlanCount = planCountRes.count ?? 0;

  const onboardingSteps = buildOnboardingSteps({
    hasCompany: Boolean(company),
    matchCount,
    diagnosisCount,
    businessPlanCount,
  });

  const programIds = [
    ...new Set((topMatchesRes.data ?? []).map((row) => row.program_id)),
  ];
  const programMap = new Map<string, string>();

  if (programIds.length > 0) {
    const { data: programs } = await supabase
      .from("support_programs")
      .select("id, title")
      .in("id", programIds);
    (programs ?? []).forEach((program) => programMap.set(program.id, program.title));
  }

  const topMatches = (topMatchesRes.data ?? []).map((row) => ({
    id: row.id,
    score: row.score,
    recommendationLabel: levelLabel(row.recommendation_level),
    programTitle: programMap.get(row.program_id) ?? "공고",
    program_id: row.program_id,
  }));

  return {
    company: company
      ? {
          id: company.id,
          company_name: company.company_name,
          industry: company.industry,
          region: company.region,
        }
      : null,
    publishedPrograms: publishedRes.count ?? 0,
    matchCount,
    diagnosisCount,
    businessPlanCount,
    onboardingSteps,
    completionPercent: onboardingCompletionPercent(onboardingSteps),
    topMatches,
    recentPrograms: recentProgramsRes.data ?? [],
  };
};
