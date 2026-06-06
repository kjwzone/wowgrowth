import { createClient } from "@/lib/supabase/server";

export type MatchingResultRow = {
  id: string;
  company_id: string;
  program_id: string;
  score: number;
  recommendation_level: string;
  reasons: string[];
  risks: string[];
  improvement_tasks: string[];
  status: string;
  created_at: string;
};

const asStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string");
};

export const fetchMatchingResultById = async (id: string) => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("matching_results")
    .select(
      "id, company_id, program_id, score, recommendation_level, reasons, risks, improvement_tasks, status, created_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    return { data: null, error: error?.message ?? "not found" };
  }

  const row: MatchingResultRow = {
    ...data,
    reasons: asStringArray(data.reasons),
    risks: asStringArray(data.risks),
    improvement_tasks: asStringArray(data.improvement_tasks),
  };

  return { data: row, error: null };
};

export const levelLabel = (level: string): string => {
  const map: Record<string, string> = {
    high: "높음",
    medium: "중간",
    low: "낮음",
  };
  return map[level] ?? level;
};
