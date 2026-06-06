import { handleApiRoute } from "@/lib/api/response";
import { ApiError } from "@/lib/api/errors";
import { requireAuth } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export const GET = async () =>
  handleApiRoute(async () => {
    const { userId, profile } = await requireAuth();
    const supabase = await createClient();

    if (profile.role === "admin" || profile.role === "reviewer") {
      const { data, error } = await supabase
        .from("matching_results")
        .select("*, companies(company_name), support_programs(title)")
        .order("score", { ascending: false });

      if (error) throw new ApiError("INTERNAL_ERROR", error.message);
      return data ?? [];
    }

    const { data: company } = await supabase
      .from("companies")
      .select("id")
      .eq("owner_id", userId)
      .maybeSingle();

    if (!company) {
      return [];
    }

    const { data, error } = await supabase
      .from("matching_results")
      .select("*, support_programs(title)")
      .eq("company_id", company.id)
      .order("score", { ascending: false });

    if (error) throw new ApiError("INTERNAL_ERROR", error.message);
    return data ?? [];
  });
