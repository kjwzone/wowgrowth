import { z } from "zod";
import { handleApiRoute } from "@/lib/api/response";
import { ApiError } from "@/lib/api/errors";
import { requireAuth } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { computeMatchScore } from "@/lib/matching/score";

const bodySchema = z.object({
  companyId: z.string().uuid(),
});

export const POST = async (request: Request) =>
  handleApiRoute(async () => {
    const { userId, profile } = await requireAuth();
    const { companyId } = bodySchema.parse(await request.json());
    const supabase = await createClient();
    const isStaff =
      profile.role === "admin" || profile.role === "reviewer";

    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("id, owner_id, region, industry")
      .eq("id", companyId)
      .single();

    if (companyError || !company) {
      throw new ApiError("NOT_FOUND", "기업정보를 찾을 수 없습니다.");
    }
    if (company.owner_id !== userId && !isStaff) {
      throw new ApiError("FORBIDDEN", "본인 기업만 추천 생성할 수 있습니다.");
    }

    const { data: programs, error: programsError } = await supabase
      .from("support_programs")
      .select("id, region, category, status")
      .eq("status", "published");

    if (programsError) {
      throw new ApiError("INTERNAL_ERROR", programsError.message);
    }

    const rows = (programs ?? []).map((program) => {
      const result = computeMatchScore(
        { region: company.region, industry: company.industry },
        program,
      );
      return {
        company_id: companyId,
        program_id: program.id,
        score: result.score,
        recommendation_level: result.recommendationLevel,
        reasons: result.reasons,
        risks: result.risks,
        improvement_tasks: result.improvementTasks,
        status: "draft" as const,
      };
    });

    if (rows.length === 0) {
      return { created: 0, items: [] };
    }

    const { data, error } = await supabase
      .from("matching_results")
      .upsert(rows, { onConflict: "company_id,program_id" })
      .select();

    if (error) {
      throw new ApiError("INTERNAL_ERROR", error.message);
    }

    return { created: data?.length ?? 0, items: data };
  });
