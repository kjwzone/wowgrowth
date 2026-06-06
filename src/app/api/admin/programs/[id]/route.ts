import { handleApiRoute } from "@/lib/api/response";
import { ApiError } from "@/lib/api/errors";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { programInputSchema, toProgramUpdateRow } from "@/lib/validation/program";

type Props = { params: Promise<{ id: string }> };

export const PATCH = async (request: Request, { params }: Props) =>
  handleApiRoute(async () => {
    const { userId } = await requireRole(["admin"]);
    const { id } = await params;
    const body = programInputSchema.parse(await request.json());
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("support_programs")
      .update(toProgramUpdateRow(body, userId))
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new ApiError("INTERNAL_ERROR", error.message);
    }
    if (!data) {
      throw new ApiError("NOT_FOUND", "공고를 찾을 수 없습니다.");
    }
    return data;
  });

export const DELETE = async (_request: Request, { params }: Props) =>
  handleApiRoute(async () => {
    await requireRole(["admin"]);
    const { id } = await params;
    const supabase = await createClient();

    const { error } = await supabase
      .from("support_programs")
      .delete()
      .eq("id", id);

    if (error) {
      throw new ApiError("INTERNAL_ERROR", error.message);
    }
    return { deleted: true, id };
  });
