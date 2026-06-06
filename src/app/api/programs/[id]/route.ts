import { handleApiRoute } from "@/lib/api/response";
import { ApiError } from "@/lib/api/errors";
import { requireAuth } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ id: string }> };

export const GET = async (_request: Request, { params }: Props) =>
  handleApiRoute(async () => {
    await requireAuth();
    const { id } = await params;
    const supabase = await createClient();

    const { data: program, error: programError } = await supabase
      .from("support_programs")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (programError) {
      throw new ApiError("INTERNAL_ERROR", programError.message);
    }
    if (!program) {
      throw new ApiError("NOT_FOUND", "공고를 찾을 수 없습니다.");
    }

    const { data: metadata } = await supabase
      .from("program_metadata")
      .select("*")
      .eq("program_id", id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    return { program, metadata: metadata ?? null };
  });
