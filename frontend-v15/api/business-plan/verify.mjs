import { readJsonBody, sendJson, setCors } from "../lib/http-response.mjs";
import { runVerify } from "../lib/business-plan-pipeline.mjs";

export default async function handler(req, res) {
  setCors(res);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return sendJson(res, 405, { ok: false, message: "Method not allowed" });
  }

  try {
    const body = await readJsonBody(req);
    if (!body.plan) {
      return sendJson(res, 400, { ok: false, message: "plan required" });
    }
    const result = await runVerify(body);
    return sendJson(res, 200, { ok: true, ...result });
  } catch (error) {
    const code = error?.code === "NO_GEMINI_KEY" ? 503 : 500;
    return sendJson(res, code, {
      ok: false,
      message: error instanceof Error ? error.message : "검증 실패",
      fallback: code === 503 ? "mock" : undefined,
    });
  }
}
