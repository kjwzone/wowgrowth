import { handleApiRoute } from "@/lib/api/response";
import { ApiError } from "@/lib/api/errors";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export const GET = async () =>
  handleApiRoute(async () => {
    await requireRole(["admin"]);
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("ai_jobs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      throw new ApiError("INTERNAL_ERROR", error.message);
    }
    return data ?? [];
  });
