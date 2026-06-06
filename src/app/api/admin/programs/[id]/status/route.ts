import { handleApiRoute } from "@/lib/api/response";
import { ApiError } from "@/lib/api/errors";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { programStatusUpdateSchema } from "@/lib/validation/program";

type Props = { params: Promise<{ id: string }> };

export const PATCH = async (request: Request, { params }: Props) =>
  handleApiRoute(async () => {
    const { userId } = await requireRole(["admin"]);
    const { id } = await params;
    const { status } = programStatusUpdateSchema.parse(await request.json());
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("support_programs")
      .update({ status, updated_by: userId })
      .eq("id", id)
      .select("id, status")
      .single();

    if (error) {
      throw new ApiError("INTERNAL_ERROR", error.message);
    }
    if (!data) {
      throw new ApiError("NOT_FOUND", "공고를 찾을 수 없습니다.");
    }
    return data;
  });
