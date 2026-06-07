import { handleApiRoute } from "@/lib/api/response";
import { ApiError } from "@/lib/api/errors";
import { requireAuth } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export const GET = async (
  _request: Request,
  context: { params: Promise<{ id: string }> },
) =>
  handleApiRoute(async () => {
    await requireAuth();
    const { id } = await context.params;
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("business_plan_drafts")
      .select(
        "id, company_id, program_id, matching_result_id, title, status, plan_json, model, prompt_version, schema_version, updated_at",
      )
      .eq("id", id)
      .single();

    if (error || !data) {
      throw new ApiError("NOT_FOUND", "사업계획서 초안을 찾을 수 없습니다.");
    }

    return data;
  });
