import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { MatchPlanList } from "@/components/business-plans/match-plan-list";
import { PageCard } from "@/components/ui/page-card";
import { getSessionProfile } from "@/lib/auth/get-session";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

const levelLabel = (level: string): string => {
  const map: Record<string, string> = {
    high: "높음",
    medium: "중간",
    low: "낮음",
  };
  return map[level] ?? level;
};

export default async function BusinessPlansPage() {
  const session = await getSessionProfile();
  if (!session) redirect("/login");

  const supabase = await createClient();
  const isStaff =
    session.profile.role === "admin" || session.profile.role === "reviewer";

  const { data: company } = await supabase
    .from("companies")
    .select("id")
    .eq("owner_id", session.userId)
    .maybeSingle();

  const matchesQuery = company
    ? supabase
        .from("matching_results")
        .select("id, score, recommendation_level, program_id")
        .eq("company_id", company.id)
        .order("score", { ascending: false })
        .limit(20)
    : isStaff
      ? supabase
          .from("matching_results")
          .select("id, score, recommendation_level, program_id")
          .order("score", { ascending: false })
          .limit(20)
      : null;

  const { data: rawMatches } = matchesQuery ? await matchesQuery : { data: [] };

  const programIds = [...new Set((rawMatches ?? []).map((m) => m.program_id))];
  const programMap = new Map<string, string>();
  if (programIds.length > 0) {
    const { data: programs } = await supabase
      .from("support_programs")
      .select("id, title")
      .in("id", programIds);
    (programs ?? []).forEach((p) => programMap.set(p.id, p.title));
  }

  const matchesForPlan = (rawMatches ?? []).map((m) => ({
    id: m.id,
    programId: m.program_id,
    programTitle: programMap.get(m.program_id) ?? "지원사업",
    score: m.score,
    recommendationLevel: levelLabel(m.recommendation_level),
  }));

  const { data: plans } = company
    ? await supabase
        .from("business_plan_drafts")
        .select("id, title, status, created_at, program_id")
        .eq("company_id", company.id)
        .order("created_at", { ascending: false })
    : isStaff
      ? await supabase
          .from("business_plan_drafts")
          .select("id, title, status, created_at, program_id")
          .order("created_at", { ascending: false })
          .limit(50)
      : { data: [] };

  const planProgramIds = [...new Set((plans ?? []).map((p) => p.program_id))];
  if (planProgramIds.length > 0) {
    const { data: planPrograms } = await supabase
      .from("support_programs")
      .select("id, title")
      .in("id", planProgramIds);
    (planPrograms ?? []).forEach((p) => programMap.set(p.id, p.title));
  }

  return (
    <AppShell title="사업계획서 초안" role={session.profile.role}>
      <PageCard title="사업계획서 초안 생성">
        {!company && !isStaff ? (
          <div className="space-y-2 text-sm text-slate-600">
            <p>기업정보를 먼저 등록해야 사업계획서를 생성할 수 있습니다.</p>
            <Link href="/company/new" className="inline-block underline">
              기업정보 등록
            </Link>
          </div>
        ) : (
          <MatchPlanList matches={matchesForPlan} />
        )}
      </PageCard>

      <PageCard title="초안 목록" className="mt-4">
        {(plans ?? []).length === 0 ? (
          <p className="text-sm text-slate-500">생성된 사업계획서가 없습니다.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {(plans ?? []).map((p) => (
              <li key={p.id} className="py-3">
                <Link
                  href={`/business-plans/${p.id}`}
                  className="font-medium hover:underline"
                >
                  {p.title || programMap.get(p.program_id) || "사업계획서"}
                </Link>
                <p className="text-sm text-slate-500">
                  {programMap.get(p.program_id)} · {p.status}
                </p>
              </li>
            ))}
          </ul>
        )}
      </PageCard>
    </AppShell>
  );
}
