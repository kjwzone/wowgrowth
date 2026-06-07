import { jsonResponse } from "../lib/gemini-json.mjs";
import { runFast, runPipeline } from "../lib/business-plan-pipeline.mjs";

export default async function handler(req) {
  if (req.method !== "POST") {
    return jsonResponse(405, { ok: false, message: "Method not allowed" });
  }

  try {
    const body = await req.json();
    if (body.probe) {
      const hasKey = Boolean(process.env.GEMINI_API_KEY);
      return jsonResponse(hasKey ? 200 : 503, { ok: hasKey, gemini: hasKey });
    }
    const mode = body.mode === "fast" ? "fast" : "pipeline";
    const stages = [];

    const result =
      mode === "fast"
        ? await runFast(body)
        : await runPipeline(body, async (stage) => {
            stages.push(stage);
          });

    return jsonResponse(200, {
      ok: true,
      mode,
      plan: result.plan,
      model: result.model,
      stages: result.stages ?? stages,
    });
  } catch (error) {
    const code = error?.code === "NO_GEMINI_KEY" ? 503 : 500;
    return jsonResponse(code, {
      ok: false,
      message: error instanceof Error ? error.message : "생성 실패",
      fallback: code === 503 ? "mock" : undefined,
    });
  }
}
