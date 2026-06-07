import { jsonResponse } from "../lib/gemini-json.mjs";

export default async function handler() {
  const hasKey = Boolean(process.env.GEMINI_API_KEY);
  return jsonResponse(hasKey ? 200 : 503, {
    ok: hasKey,
    gemini: hasKey,
    model: process.env.GEMINI_MODEL ?? "gemini-2.5-pro",
  });
}
