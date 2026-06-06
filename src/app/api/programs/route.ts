import { z } from "zod";
import { handleApiRoute } from "@/lib/api/response";
import { ApiError } from "@/lib/api/errors";
import { requireAuth } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().optional(),
  region: z.string().optional(),
  category: z.string().optional(),
  status: z.enum(["draft", "published", "closed"]).optional(),
});

export const GET = async (request: Request) =>
  handleApiRoute(async () => {
    await requireAuth();
    const { searchParams } = new URL(request.url);
    const query = listQuerySchema.parse(Object.fromEntries(searchParams));
    const supabase = await createClient();

    let builder = supabase
      .from("support_programs")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    if (query.status) builder = builder.eq("status", query.status);
    if (query.region) builder = builder.eq("region", query.region);
    if (query.category) builder = builder.eq("category", query.category);
    if (query.q) builder = builder.ilike("title", `%${query.q}%`);

    const from = (query.page - 1) * query.pageSize;
    const to = from + query.pageSize - 1;
    const { data, error, count } = await builder.range(from, to);

    if (error) {
      throw new ApiError("INTERNAL_ERROR", error.message);
    }

    return {
      items: data ?? [],
      page: query.page,
      pageSize: query.pageSize,
      total: count ?? 0,
    };
  });
