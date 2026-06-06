import { z } from "zod";
import { handleApiRoute } from "@/lib/api/response";
import { ApiError } from "@/lib/api/errors";
import { mayCreateCompany } from "@/lib/company/create-policy";
import { requireAuth } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import {
  companyInputSchema,
  toCompanyRow,
  toCompanyUpdate,
} from "@/lib/validation/company";

const createBodySchema = companyInputSchema.extend({
  ownerId: z.string().uuid().optional(),
});

export const GET = async () =>
  handleApiRoute(async () => {
    const { userId, profile } = await requireAuth();
    const supabase = await createClient();

    if (profile.role === "admin") {
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        throw new ApiError("INTERNAL_ERROR", error.message);
      }
      return data ?? [];
    }

    const { data, error } = await supabase
      .from("companies")
      .select("*")
      .eq("owner_id", userId)
      .maybeSingle();

    if (error) {
      throw new ApiError("INTERNAL_ERROR", error.message);
    }
    return data;
  });

export const POST = async (request: Request) =>
  handleApiRoute(async () => {
    const { userId, profile } = await requireAuth();
    const body = createBodySchema.parse(await request.json());
    const supabase = await createClient();
    const isAdmin = profile.role === "admin";

    const { data: existing } = await supabase
      .from("companies")
      .select("id")
      .eq("owner_id", userId)
      .maybeSingle();

    if (!mayCreateCompany(profile.role, Boolean(existing))) {
      throw new ApiError("CONFLICT", "이미 등록된 기업정보가 있습니다.");
    }

    const ownerId =
      isAdmin && body.ownerId ? body.ownerId : userId;

    const { data, error } = await supabase
      .from("companies")
      .insert(toCompanyRow(body, ownerId))
      .select()
      .single();

    if (error) {
      throw new ApiError("INTERNAL_ERROR", error.message);
    }
    return data;
  });

export const PATCH = async (request: Request) => {
  const url = new URL(request.url);
  const companyId = url.searchParams.get("id");

  return handleApiRoute(async () => {
    const { userId, profile } = await requireAuth();
    const body = companyInputSchema.parse(await request.json());
    const supabase = await createClient();
    const isAdmin = profile.role === "admin";

    const query = supabase.from("companies").update(toCompanyUpdate(body));

    const { data, error } =
      isAdmin && companyId
        ? await query.eq("id", companyId).select().single()
        : await query.eq("owner_id", userId).select().single();

    if (error) {
      throw new ApiError("INTERNAL_ERROR", error.message);
    }
    return data;
  });
};
