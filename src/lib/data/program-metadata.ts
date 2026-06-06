import { unstable_noStore as noStore } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ProgramMetadataRow = {
  id: string;
  program_id: string;
  status: string;
  task_type: string;
  model: string;
  prompt_version: string;
  metadata_json: Record<string, unknown>;
  extracted_fields: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export const fetchProgramMetadataById = async (id: string) => {
  noStore();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("program_metadata")
    .select(
      "id, program_id, status, task_type, model, prompt_version, metadata_json, extracted_fields, created_at, updated_at",
    )
    .eq("id", id)
    .maybeSingle();

  return { data: data as ProgramMetadataRow | null, error: error?.message ?? null };
};

export const fetchProgramById = async (programId: string) => {
  noStore();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("support_programs")
    .select("id, title, agency, region, status")
    .eq("id", programId)
    .maybeSingle();

  return { data, error: error?.message ?? null };
};

export const fetchPendingMetadataReviews = async () => {
  noStore();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("program_metadata")
    .select(
      "id, program_id, status, task_type, created_at, extracted_fields",
    )
    .in("status", ["reviewing", "draft"])
    .order("created_at", { ascending: false });

  return { data: data ?? [], error: error?.message ?? null };
};
