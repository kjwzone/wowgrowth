import { GoogleGenerativeAI } from "@google/generative-ai";
import type { z } from "zod";
import { ApiError } from "@/lib/api/errors";
import { mapGeminiError } from "@/lib/ai/gemini";
import {
  extractJsonFromText,
  JSON_ONLY_RESPONSE_SUFFIX,
} from "@/lib/ai/extract-json";
import {
  GEMINI_MODEL_CANDIDATES,
  isRateLimitError,
} from "@/lib/ai/models";

export { GEMINI_MODEL_CANDIDATES };

const isJsonParseError = (error: unknown): boolean => {
  if (!(error instanceof SyntaxError)) return false;
  const msg = error.message.toLowerCase();
  return msg.includes("json") || msg.includes("unexpected token");
};

export const generateJsonWithGemini = async <T>(params: {
  prompt: string;
  schema: z.ZodType<T>;
  invalidMessage?: string;
  maxOutputTokens?: number;
  temperature?: number;
}): Promise<{ data: T; model: string }> => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new ApiError("INTERNAL_ERROR", "GEMINI_API_KEY가 설정되지 않았습니다.");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  let lastError: unknown = null;
  let lastRateLimit: unknown = null;
  let lastSchemaInvalid: unknown = null;

  const prompts = [params.prompt, `${params.prompt}\n\n${JSON_ONLY_RESPONSE_SUFFIX}`];

  for (const modelName of GEMINI_MODEL_CANDIDATES) {
    for (const prompt of prompts) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            temperature: params.temperature ?? 0.3,
            maxOutputTokens: params.maxOutputTokens,
            responseMimeType: "application/json",
          },
        });
        const result = await model.generateContent(prompt);
        const rawText = result.response.text();

        let parsed: unknown;
        try {
          parsed = extractJsonFromText(rawText);
        } catch (parseError) {
          if (isJsonParseError(parseError)) {
            lastSchemaInvalid = parseError;
            console.warn(
              `[gemini] ${modelName} invalid JSON:`,
              rawText.slice(0, 120),
            );
            continue;
          }
          throw parseError;
        }

        const validated = params.schema.safeParse(parsed);
        if (!validated.success) {
          lastSchemaInvalid = validated.error;
          console.warn(`[gemini] ${modelName} schema mismatch`);
          continue;
        }

        return { data: validated.data, model: modelName };
      } catch (error) {
        if (error instanceof ApiError && error.code === "AI_SCHEMA_INVALID") {
          throw error;
        }
        if (isRateLimitError(error)) {
          lastRateLimit = error;
        }
        lastError = error;
        console.warn(
          `[gemini] ${modelName} failed:`,
          error instanceof Error ? error.message : error,
        );
      }
    }
  }

  if (lastSchemaInvalid) {
    throw new ApiError(
      "AI_SCHEMA_INVALID",
      params.invalidMessage ??
        "AI가 JSON이 아닌 형식(mermaid·마크다운 등)으로 응답했습니다. 다시 시도해 주세요.",
    );
  }

  throw mapGeminiError(lastRateLimit ?? lastError);
};
