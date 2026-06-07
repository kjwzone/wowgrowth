import { jsonResponse } from "../lib/gemini-json.mjs";
import { runSection } from "../lib/business-plan-pipeline.mjs";

export default async function handler(req) {
  if (req.method !== "POST") {
    return jsonResponse(405, { ok: false, message: "Method not allowed" });
  }

  try {
    const body = await req.json();
    if (!body.sectionTitle) {
      return jsonResponse(400, { ok: false, message: "sectionTitle required" });
    }
    const result = await runSection(body);
    return jsonResponse(200, { ok: true, ...result });
  } catch (error) {
    const code = error?.code === "NO_GEMINI_KEY" ? 503 : 500;
    return jsonResponse(code, {
      ok: false,
      message: error instanceof Error ? error.message : "섹션 생성 실패",
      fallback: code === 503 ? "mock" : undefined,
    });
  }
}
