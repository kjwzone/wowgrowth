import { createClient } from "@/lib/supabase/server";
import {
  fetchMatchesPageData,
  type CompanyForMatches,
  type MatchListItem,
} from "@/lib/data/matches-list";

export type PlanListItem = {
  id: string;
  company_id: string;
  program_id: string;
  title: string;
  status: string;
  created_at: string;
  programTitle: string;
};

export const groupItemsByCompanyId = <T extends { company_id: string }>(
  items: ReadonlyArray<T>,
): Map<string, T[]> =>
  items.reduce<Map<string, T[]>>((acc, item) => {
    const bucket = acc.get(item.company_id) ?? [];
    bucket.push(item);
    acc.set(item.company_id, bucket);
    return acc;
  }, new Map());

export const fetchBusinessPlansPageData = async (params: {
  userId: string;
  isStaff: boolean;
}): Promise<{
  companies: CompanyForMatches[];
  matches: MatchListItem[];
  plans: PlanListItem[];
}> => {
  const { companies, matches } = await fetchMatchesPageData(params);
  const supabase = await createClient();

  const companyIds = companies.map((company) => company.id);
  if (companyIds.length === 0) {
    return { companies, matches, plans: [] };
  }

  const { data: planRows } = await supabase
    .from("business_plan_drafts")
    .select("id, company_id, program_id, title, status, created_at")
    .in("company_id", companyIds)
    .order("created_at", { ascending: false });

  const programMap = new Map<string, string>();
  matches.forEach((match) => programMap.set(match.program_id, match.programTitle));

  const missingProgramIds = [
    ...new Set(
      (planRows ?? [])
        .map((plan) => plan.program_id)
        .filter((programId) => !programMap.has(programId)),
    ),
  ];

  if (missingProgramIds.length > 0) {
    const { data: programs } = await supabase
      .from("support_programs")
      .select("id, title")
      .in("id", missingProgramIds);
    (programs ?? []).forEach((program) => programMap.set(program.id, program.title));
  }

  const plans: PlanListItem[] = (planRows ?? []).map((plan) => ({
    id: plan.id,
    company_id: plan.company_id,
    program_id: plan.program_id,
    title: plan.title,
    status: plan.status,
    created_at: plan.created_at,
    programTitle: programMap.get(plan.program_id) ?? plan.program_id,
  }));

  return { companies, matches, plans };
};
