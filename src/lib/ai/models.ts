/** @google/generative-ai 에서 현재 호출 가능한 모델 (2025-06 기준) */
export const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";

export const GEMINI_MODEL_CANDIDATES = [
  process.env.GEMINI_MODEL,
  DEFAULT_GEMINI_MODEL,
  "gemini-2.5-flash-lite",
].filter((m, i, arr): m is string => Boolean(m) && arr.indexOf(m) === i);

export const isRateLimitError = (error: unknown): boolean => {
  const msg = error instanceof Error ? error.message : String(error ?? "");
  return msg.includes("429") || msg.toLowerCase().includes("quota");
};

export const isModelNotFoundError = (error: unknown): boolean => {
  const msg = error instanceof Error ? error.message : String(error ?? "");
  return msg.includes("404") || msg.toLowerCase().includes("not found");
};
