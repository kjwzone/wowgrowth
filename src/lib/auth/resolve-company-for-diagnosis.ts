import { createClient } from "@/lib/supabase/server";
import { ApiError } from "@/lib/api/errors";
import type { AppRole, Company } from "@/lib/types/database";
import { getCompanyForUser } from "@/lib/auth/get-company";

export const resolveCompanyForDiagnosis = async (
  userId: string,
  role: AppRole,
  companyId?: string,
): Promise<Company> => {
  const isStaff = role === "admin" || role === "reviewer";
  const supabase = await createClient();

  if (companyId) {
    const { data: company, error } = await supabase
      .from("companies")
      .select("*")
      .eq("id", companyId)
      .maybeSingle();

    if (error) {
      throw new ApiError("INTERNAL_ERROR", error.message);
    }
    if (!company) {
      throw new ApiError("NOT_FOUND", "기업정보를 찾을 수 없습니다.");
    }
    if (company.owner_id !== userId && !isStaff) {
      throw new ApiError("FORBIDDEN", "본인 기업만 진단할 수 있습니다.");
    }
    return company as Company;
  }

  if (isStaff) {
    throw new ApiError("VALIDATION_ERROR", "진단할 기업을 선택하세요.");
  }

  return getCompanyForUser(userId);
};
