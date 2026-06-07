import { z } from "zod";
import { handleApiRoute } from "@/lib/api/response";
import { fetchBizinfoPrograms, findBizinfoProgramById } from "@/lib/bizinfo/fetch-programs";

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
  q: z.string().optional(),
  category: z.string().optional(),
  region: z.string().optional(),
});

const corsHeaders = (): HeadersInit => ({
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
});

export const OPTIONS = async () =>
  new Response(null, { status: 204, headers: corsHeaders() });

export const GET = async (request: Request) =>
  handleApiRoute(async () => {
    const { searchParams } = new URL(request.url);
    const query = listQuerySchema.parse(Object.fromEntries(searchParams));
    const result = await fetchBizinfoPrograms({
      page: query.page,
      pageSize: query.pageSize,
      query: query.q,
      category: query.category,
      region: query.region,
    });

    return result;
  }).then((response) => {
    const headers = new Headers(response.headers);
    Object.entries(corsHeaders()).forEach(([key, value]) => headers.set(key, value));
    return new Response(response.body, { status: response.status, headers });
  });
