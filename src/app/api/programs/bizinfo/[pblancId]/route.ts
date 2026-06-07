import { ApiError } from "@/lib/api/errors";
import { handleApiRoute } from "@/lib/api/response";
import { findBizinfoProgramById } from "@/lib/bizinfo/fetch-programs";

const corsHeaders = (): HeadersInit => ({
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
});

type RouteContext = { params: Promise<{ pblancId: string }> };

export const OPTIONS = async () =>
  new Response(null, { status: 204, headers: corsHeaders() });

export const GET = async (_request: Request, context: RouteContext) =>
  handleApiRoute(async () => {
    const { pblancId } = await context.params;
    const program = await findBizinfoProgramById(
      pblancId.startsWith("bizinfo-") ? pblancId : `bizinfo-${pblancId}`,
    );
    if (!program) {
      throw new ApiError("NOT_FOUND", "공고를 찾을 수 없습니다.");
    }
    return program;
  }).then((response) => {
    const headers = new Headers(response.headers);
    Object.entries(corsHeaders()).forEach(([key, value]) => headers.set(key, value));
    return new Response(response.body, { status: response.status, headers });
  });
