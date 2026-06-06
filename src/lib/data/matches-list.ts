import { createClient } from "@/lib/supabase/server";
import { levelLabel } from "@/lib/data/matching-results";

export type CompanyForMatches = {
  id: string;
  company_name: string;
  industry: string;
  region: string;
  ownerEmail: string;
};

export type MatchListItem = {
  id: string;
  score: number;
  recommendation_level: string;
  recommendationLabel: string;
  program_id: string;
  company_id: string;
  programTitle: string;
  companyName: string;
};

const loadOwnerEmails = async (
  ownerIds: string[],
): Promise<Map<string, string>> => {
  const map = new Map<string, string>();
  if (ownerIds.length === 0) return map;

  const supabase = await createClient();
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, email")
    .in("id", ownerIds);
  (profiles ?? []).forEach((p) => map.set(p.id, p.email));
  return map;
};

export const fetchMatchesPageData = async (params: {
  userId: string;
  isStaff: boolean;
}) => {
  const supabase = await createClient();
  const selectFields = "id, company_name, industry, region, owner_id";

  let companyRows: {
    id: string;
    company_name: string;
    industry: string;
    region: string;
    owner_id: string;
  }[] = [];

  if (params.isStaff) {
    const { data } = await supabase
      .from("companies")
      .select(selectFields)
      .order("created_at", { ascending: false });
    companyRows = data ?? [];
  } else {
    const { data } = await supabase
      .from("companies")
      .select(selectFields)
      .eq("owner_id", params.userId)
      .maybeSingle();
    companyRows = data ? [data] : [];
  }

  const emailMap = await loadOwnerEmails([
    ...new Set(companyRows.map((c) => c.owner_id)),
  ]);

  const companies: CompanyForMatches[] = companyRows.map((row) => ({
    id: row.id,
    company_name: row.company_name,
    industry: row.industry,
    region: row.region,
    ownerEmail: emailMap.get(row.owner_id) ?? row.owner_id,
  }));

  const companyNameMap = new Map(
    companies.map((c) => [c.id, c.company_name] as const),
  );

  let matchRows: {
    id: string;
    score: number;
    recommendation_level: string;
    program_id: string;
    company_id: string;
  }[] = [];

  if (params.isStaff) {
    const { data } = await supabase
      .from("matching_results")
      .select("id, score, recommendation_level, program_id, company_id")
      .order("score", { ascending: false })
      .limit(100);
    matchRows = data ?? [];
  } else if (companies[0]) {
    const { data } = await supabase
      .from("matching_results")
      .select("id, score, recommendation_level, program_id, company_id")
      .eq("company_id", companies[0].id)
      .order("score", { ascending: false })
      .limit(50);
    matchRows = data ?? [];
  }

  const programIds = [...new Set(matchRows.map((m) => m.program_id))];
  const programMap = new Map<string, string>();
  if (programIds.length > 0) {
    const { data: programs } = await supabase
      .from("support_programs")
      .select("id, title")
      .in("id", programIds);
    (programs ?? []).forEach((p) => programMap.set(p.id, p.title));
  }

  const matches: MatchListItem[] = matchRows.map((m) => ({
    id: m.id,
    score: m.score,
    recommendation_level: m.recommendation_level,
    recommendationLabel: levelLabel(m.recommendation_level),
    program_id: m.program_id,
    company_id: m.company_id,
    programTitle: programMap.get(m.program_id) ?? m.program_id,
    companyName: companyNameMap.get(m.company_id) ?? "기업",
  }));

  return { companies, matches };
};
