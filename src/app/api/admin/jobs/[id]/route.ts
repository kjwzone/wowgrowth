import { handleApiRoute } from "@/lib/api/response";
import { ApiError } from "@/lib/api/errors";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ id: string }> };

export const GET = async (_request: Request, { params }: Props) =>
  handleApiRoute(async () => {
    await requireRole(["admin"]);
    const { id } = await params;
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("ai_jobs")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      throw new ApiError("NOT_FOUND", "작업을 찾을 수 없습니다.");
    }
    return data;
  });
