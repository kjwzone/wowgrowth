import { readJsonBody, sendJson, setCors } from "../lib/http-response.mjs";
import { runFast, runPipeline } from "../lib/business-plan-pipeline.mjs";

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
    if (body.probe) {
      const hasKey = Boolean(process.env.GEMINI_API_KEY);
      return sendJson(res, hasKey ? 200 : 503, { ok: hasKey, gemini: hasKey });
    }

    const mode = body.mode === "pipeline" ? "pipeline" : "fast";
    const stages = [];

    const result =
      mode === "fast"
        ? await runFast(body)
        : await runPipeline(body, async (stage) => {
            stages.push(stage);
          });

    return sendJson(res, 200, {
      ok: true,
      mode,
      plan: result.plan,
      model: result.model,
      stages: result.stages ?? stages,
    });
  } catch (error) {
    const code = error?.code === "NO_GEMINI_KEY" ? 503 : 500;
    return sendJson(res, code, {
      ok: false,
      message: error instanceof Error ? error.message : "생성 실패",
      fallback: code === 503 ? "mock" : undefined,
    });
  }
}
