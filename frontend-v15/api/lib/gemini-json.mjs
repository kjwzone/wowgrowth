import { GoogleGenerativeAI } from "@google/generative-ai";

const MODEL_CANDIDATES = [
  process.env.GEMINI_MODEL,
  "gemini-2.5-pro",
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
].filter(Boolean);

const extractJson = (text) => {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = fenced?.[1]?.trim() ?? trimmed;
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("JSON not found in response");
  return JSON.parse(body.slice(start, end + 1));
};

export const generateJsonWithGemini = async ({
  prompt,
  maxOutputTokens = 8192,
  temperature = 0.25,
}) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const err = new Error("GEMINI_API_KEY가 설정되지 않았습니다.");
    err.code = "NO_GEMINI_KEY";
    throw err;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  let lastError = null;

  for (const modelName of MODEL_CANDIDATES) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          temperature,
          maxOutputTokens,
          responseMimeType: "application/json",
        },
      });
      const result = await model.generateContent(prompt);
      const parsed = extractJson(result.response.text());
      return { data: parsed, model: modelName };
    } catch (error) {
      lastError = error;
      console.warn(`[gemini] ${modelName} failed:`, error?.message ?? error);
    }
  }

  throw lastError ?? new Error("Gemini 호출 실패");
};
