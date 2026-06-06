import { handleApiRoute } from "@/lib/api/response";
import { ApiError } from "@/lib/api/errors";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { programInputSchema, toProgramInsertRow } from "@/lib/validation/program";

export const POST = async (request: Request) =>
  handleApiRoute(async () => {
    const { userId } = await requireRole(["admin"]);
    const body = programInputSchema.parse(await request.json());
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("support_programs")
      .insert(toProgramInsertRow(body, userId))
      .select()
      .single();

    if (error) {
      throw new ApiError("INTERNAL_ERROR", error.message);
    }
    return data;
  });
