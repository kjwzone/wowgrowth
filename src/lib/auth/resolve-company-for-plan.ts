import { createClient } from "@/lib/supabase/server";
import { ApiError } from "@/lib/api/errors";
import type { AppRole, Company } from "@/lib/types/database";
import { getCompanyForUser } from "@/lib/auth/get-company";

export const resolveCompanyForBusinessPlan = async (
  userId: string,
  role: AppRole,
  options?: { matchingResultId?: string; programId?: string },
): Promise<Company> => {
  if (!options?.matchingResultId) {
    return getCompanyForUser(userId);
  }

  const supabase = await createClient();
  const { data: match, error: matchError } = await supabase
    .from("matching_results")
    .select("company_id, program_id")
    .eq("id", options.matchingResultId)
    .single();

  if (matchError || !match) {
    throw new ApiError("NOT_FOUND", "추천 결과를 찾을 수 없습니다.");
  }

  if (options.programId && match.program_id !== options.programId) {
    throw new ApiError("VALIDATION_ERROR", "공고와 추천 결과가 일치하지 않습니다.");
  }

  const { data: company, error: companyError } = await supabase
    .from("companies")
    .select("*")
    .eq("id", match.company_id)
    .single();

  if (companyError || !company) {
    throw new ApiError("NOT_FOUND", "기업을 찾을 수 없습니다.");
  }

  const isOwner = company.owner_id === userId;
  const isStaff = role === "admin" || role === "reviewer";
  if (!isOwner && !isStaff) {
    throw new ApiError("FORBIDDEN", "접근 권한이 없습니다.");
  }

  return company as Company;
};
