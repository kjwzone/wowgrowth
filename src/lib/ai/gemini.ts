import { GoogleGenerativeAI } from "@google/generative-ai";
import { ApiError } from "@/lib/api/errors";
import {
  announcementMetadataSchema,
  type AnnouncementMetadata,
} from "@/lib/ai/schemas";
import type { AiTaskType } from "@/lib/types/database";
import {
  DEFAULT_GEMINI_MODEL,
  GEMINI_MODEL_CANDIDATES,
  isRateLimitError,
} from "@/lib/ai/models";
import { generateJsonWithGemini } from "@/lib/ai/generate-json";

export { DEFAULT_GEMINI_MODEL, GEMINI_MODEL_CANDIDATES };

const ANNOUNCEMENT_CONTENT_MAX_CHARS = 80_000;

const buildPrompt = (content: string, taskType: AiTaskType): string => {
  const schemaHint = `{
  "title": "지원사업명 (string)",
  "agency": "주관기관 (string)",
  "target": "지원대상 (string)",
  "region": "지원지역 (string)",
  "business_stage": "창업단계 (string)",
  "industry": "대상업종 (string)",
  "support_amount": "지원금액 (string)",
  "application_period": "신청기간 (string)",
  "required_documents": ["제출서류1", "제출서류2"],
  "eligibility": ["지원자격1", "지원자격2"],
  "bonus_points": ["가점1", "가점2"],
  "summary": "공고 요약 (string)"
}`;

  const taskLabel =
    taskType === "announcement_summary"
      ? "공고를 핵심 항목별로 요약"
      : "공고에서 구조화 메타데이터를 추출";

  const excerpt = content.slice(0, ANNOUNCEMENT_CONTENT_MAX_CHARS);

  return [
    "당신은 정부지원사업 공고 분석 전문가입니다.",
    `${taskLabel}하고 반드시 아래 JSON 스키마만 출력하세요.`,
    "모든 문자열 필드는 string, 목록 필드는 string[] 로 출력합니다.",
    "null 대신 빈 문자열 \"\" 또는 빈 배열 [] 을 사용합니다.",
    "추가 설명, 마크다운, 코드블록 없이 순수 JSON만 반환합니다.",
    `스키마: ${schemaHint}`,
    "공고 원문:",
    excerpt,
  ].join("\n\n");
};

export const mapGeminiError = (error: unknown): ApiError => {
  const msg =
    error instanceof Error ? error.message : String(error ?? "unknown");

  if (msg.includes("429") || msg.toLowerCase().includes("quota")) {
    return new ApiError(
      "RATE_LIMITED",
      "Gemini API 사용 한도를 초과했습니다. 잠시 후 다시 시도하거나 Google AI Studio에서 요금제/할당량을 확인하세요.",
    );
  }
  if (msg.includes("404") || msg.includes("not found")) {
    return new ApiError(
      "INTERNAL_ERROR",
      "Gemini 모델을 찾을 수 없습니다. .env.local에 GEMINI_MODEL=gemini-2.5-flash 또는 gemini-2.5-flash-lite 를 설정하세요.",
    );
  }
  if (
    msg.includes("API_KEY_INVALID") ||
    msg.includes("API key not valid") ||
    msg.includes("401")
  ) {
    return new ApiError(
      "INTERNAL_ERROR",
      "GEMINI_API_KEY가 유효하지 않습니다. Google AI Studio에서 API 키를 다시 발급하세요.",
    );
  }
  if (msg.includes("fetch failed") || msg.includes("ECONNREFUSED")) {
    return new ApiError(
      "AI_TIMEOUT",
      "Gemini API 서버에 연결하지 못했습니다. 네트워크를 확인하세요.",
    );
  }

  return new ApiError(
    "AI_TIMEOUT",
    `AI 응답을 받지 못했습니다. (${msg.slice(0, 120)})`,
  );
};

export type ExtractResult = {
  metadata: AnnouncementMetadata;
  model: string;
};

export const extractAnnouncementMetadata = async (
  content: string,
  taskType: AiTaskType,
): Promise<ExtractResult> => {
  const { data, model } = await generateJsonWithGemini<AnnouncementMetadata>({
    prompt: buildPrompt(content, taskType),
    schema: announcementMetadataSchema,
    invalidMessage:
      "AI 출력이 스키마와 일치하지 않습니다. 잠시 후 다시 시도해 주세요.",
    temperature: 0.2,
  });

  return { metadata: data, model };
};
