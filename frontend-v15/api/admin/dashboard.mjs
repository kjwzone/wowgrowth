import { fetchAdminDashboardSummary } from "../lib/admin-dashboard-fetch.mjs";
import { sendJson, setCors } from "../lib/http-response.mjs";
import { createSupabaseAdminClient } from "../lib/supabase-admin.mjs";

export default async function handler(req, res) {
  setCors(res);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "GET") {
    return sendJson(res, 405, { ok: false, message: "GET only" });
  }

  const { client, error: configError } = createSupabaseAdminClient();
  if (!client) {
    return sendJson(res, 503, {
      ok: false,
      message: configError ?? "Supabase가 연결되지 않았습니다.",
    });
  }

  try {
    const summary = await fetchAdminDashboardSummary(client);
    return sendJson(res, 200, { ok: true, source: "supabase", summary });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "관리자 대시보드 조회에 실패했습니다.";
    return sendJson(res, 500, { ok: false, message });
  }
}
