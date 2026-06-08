import type { AiGenerationContext } from "@/lib/business-plan-ai-context";
import type { ApiBusinessPlan, ApiVerifyResult } from "@/lib/business-plan-adapter";

type ApiEnvelope<T> =
  | ({ ok: true } & T)
  | { ok: false; message: string; fallback?: string };

const AI_REQUEST_TIMEOUT_MS = 45_000;

const postJson = async <T>(path: string, body: unknown): Promise<ApiEnvelope<T>> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), AI_REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(`/api/business-plan/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    return (await response.json()) as ApiEnvelope<T>;
  } finally {
    clearTimeout(timer);
  }
};

export type GeneratePlanResponse = {
  plan: ApiBusinessPlan;
  model: string;
  mode: string;
  stages: { stage: string; label: string; status: string }[];
};

export type SectionGenerateResponse = {
  section_title: string;
  content: string;
  model: string;
};

export const businessPlanAiClient = {
  isAvailable: async (): Promise<boolean> => {
    try {
      const response = await fetch("/api/business-plan/health");
      if (!response.ok) return false;
      const data = (await response.json()) as { ok?: boolean };
      return Boolean(data.ok);
    } catch {
      return false;
    }
  },

  generate: async (
    ctx: AiGenerationContext,
    mode: "fast" | "pipeline" = "fast",
  ): Promise<GeneratePlanResponse> => {
    const result = await postJson<GeneratePlanResponse>("generate", {
      ...ctx,
      mode,
    });
    if (!result.ok) {
      throw new Error(result.message);
    }
    return result;
  },

  generateSection: async (params: {
    ctx: AiGenerationContext;
    sectionTitle: string;
    existingContent?: string;
    mode?: "basic" | "deep";
  }): Promise<SectionGenerateResponse> => {
    const result = await postJson<SectionGenerateResponse>("section", {
      ...params.ctx,
      sectionTitle: params.sectionTitle,
      existingContent: params.existingContent,
      mode: params.mode ?? "deep",
    });
    if (!result.ok) {
      throw new Error(result.message);
    }
    return result;
  },

  verify: async (
    ctx: AiGenerationContext,
    plan: ApiBusinessPlan,
  ): Promise<ApiVerifyResult & { model: string }> => {
    const result = await postJson<ApiVerifyResult & { model: string }>("verify", {
      ...ctx,
      plan,
    });
    if (!result.ok) {
      throw new Error(result.message);
    }
    return result;
  },
};

export const isAiFallbackError = (error: unknown): boolean => {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return (
    message.includes("gemini_api_key") ||
    message.includes("503") ||
    message.includes("gemini") ||
    message.includes("abort") ||
    message.includes("timeout") ||
    message.includes("network") ||
    message.includes("failed to fetch")
  );
};
