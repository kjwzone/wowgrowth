import { GoogleGenerativeAI } from "@google/generative-ai";

const QUALITY_MODEL_CANDIDATES = [
  process.env.GEMINI_MODEL,
  "gemini-2.5-pro",
  "gemini-2.5-flash",
].filter(Boolean);

const FAST_MODEL_CANDIDATES = [
  process.env.GEMINI_FAST_MODEL,
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  process.env.GEMINI_MODEL,
].filter(Boolean);

export const getModelCandidates = (tier = "quality") =>
  tier === "fast" ? [...new Set(FAST_MODEL_CANDIDATES)] : [...new Set(QUALITY_MODEL_CANDIDATES)];

const extractJson = (text) => {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = fenced?.[1]?.trim() ?? trimmed;
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("JSON not found in response");
  return JSON.parse(body.slice(start, end + 1));
};

const GEMINI_CALL_TIMEOUT_MS = 50_000;

const withTimeout = (promise, ms, label) =>
  Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`${label} timeout (${ms}ms)`)), ms);
    }),
  ]);

export const generateJsonWithGemini = async ({
  prompt,
  maxOutputTokens = 8192,
  temperature = 0.25,
  tier = "quality",
}) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const err = new Error("GEMINI_API_KEY가 설정되지 않았습니다.");
    err.code = "NO_GEMINI_KEY";
    throw err;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  let lastError = null;

  for (const modelName of getModelCandidates(tier)) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          temperature,
          maxOutputTokens,
          responseMimeType: "application/json",
        },
      });
      const result = await withTimeout(
        model.generateContent(prompt),
        GEMINI_CALL_TIMEOUT_MS,
        `Gemini ${modelName}`,
      );
      const parsed = extractJson(result.response.text());
      return { data: parsed, model: modelName };
    } catch (error) {
      lastError = error;
      console.warn(`[gemini] ${modelName} failed:`, error?.message ?? error);
    }
  }

  throw lastError ?? new Error("Gemini 호출 실패");
};
