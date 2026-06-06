import { handleApiRoute } from "@/lib/api/response";
import { ApiError } from "@/lib/api/errors";
import { requireAuth } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ id: string }> };

export const GET = async (_request: Request, { params }: Props) =>
  handleApiRoute(async () => {
    await requireAuth();
    const { id: programId } = await params;
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("program_metadata")
      .select("*")
      .eq("program_id", programId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new ApiError("INTERNAL_ERROR", error.message);
    }
    return data ?? [];
  });
