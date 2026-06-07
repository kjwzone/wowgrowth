import { sendJson, setCors } from "../lib/http-response.mjs";

export default async function handler(req, res) {
  setCors(res);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "GET") {
    return sendJson(res, 405, { ok: false, message: "GET only" });
  }

  const hasKey = Boolean(process.env.GEMINI_API_KEY);
  return sendJson(res, hasKey ? 200 : 503, {
    ok: hasKey,
    gemini: hasKey,
    model: process.env.GEMINI_MODEL ?? "gemini-2.5-pro",
  });
}
