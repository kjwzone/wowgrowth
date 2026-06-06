import { createClient } from "@/lib/supabase/server";
import { ApiError } from "@/lib/api/errors";
import type { Company } from "@/lib/types/database";

export const getCompanyForUser = async (userId: string): Promise<Company> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("companies")
    .select("*")
    .eq("owner_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new ApiError("INTERNAL_ERROR", error.message);
  }
  if (!data) {
    throw new ApiError("VALIDATION_ERROR", "먼저 기업정보를 등록하세요.");
  }

  return data as Company;
};
