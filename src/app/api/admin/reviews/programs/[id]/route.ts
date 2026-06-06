import { z } from "zod";
import { handleApiRoute } from "@/lib/api/response";
import { ApiError } from "@/lib/api/errors";
import { requireRole } from "@/lib/auth/session";
import { revalidateReviewPages } from "@/lib/data/revalidate-review-pages";
import { createClient } from "@/lib/supabase/server";
const bodySchema = z.object({
  status: z.enum(["draft", "reviewing", "approved", "rejected"]),
  metadata: z.record(z.unknown()).optional(),
  reviewComment: z.string().optional(),
});

type Props = { params: Promise<{ id: string }> };

export const PATCH = async (request: Request, { params }: Props) =>
  handleApiRoute(async () => {
    const { userId } = await requireRole(["admin", "reviewer"]);
    const { id: metadataId } = await params;
    const body = bodySchema.parse(await request.json());
    const supabase = await createClient();

    const { data: before, error: fetchError } = await supabase
      .from("program_metadata")
      .select("*")
      .eq("id", metadataId)
      .single();

    if (fetchError || !before) {
      throw new ApiError("NOT_FOUND", "메타데이터를 찾을 수 없습니다.");
    }

    const mergedJson = body.metadata
      ? { ...(before.metadata_json as object), ...body.metadata }
      : before.metadata_json;

    const { data: after, error: updateError } = await supabase
      .from("program_metadata")
      .update({
        status: body.status,
        metadata_json: mergedJson,
        extracted_fields: body.metadata
          ? { ...(before.extracted_fields as object), ...body.metadata }
          : before.extracted_fields,
      })
      .eq("id", metadataId)
      .select()
      .single();

    if (updateError || !after) {
      throw new ApiError("INTERNAL_ERROR", updateError?.message ?? "수정 실패");
    }

    await supabase.from("review_logs").insert({
      review_target_type: "program_metadata",
      review_target_id: metadataId,
      action:
        body.status === "approved"
          ? "approved"
          : body.status === "rejected"
            ? "rejected"
            : "updated",
      before_json: before.metadata_json,
      after_json: after.metadata_json,
      review_comment: body.reviewComment ?? null,
      actor_id: userId,
    });

    revalidateReviewPages(metadataId, before.program_id);

    return after;  });
