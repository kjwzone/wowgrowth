import type { AiGenerationContext } from "@/lib/business-plan-ai-context";
import type { ApiBusinessPlan, ApiVerifyResult } from "@/lib/business-plan-adapter";

type ApiEnvelope<T> =
  | ({ ok: true } & T)
  | { ok: false; message: string; fallback?: string };

const postJson = async <T>(path: string, body: unknown): Promise<ApiEnvelope<T>> => {
  const response = await fetch(`/api/business-plan/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return (await response.json()) as ApiEnvelope<T>;
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
    mode: "fast" | "pipeline" = "pipeline",
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

export const isAiFallbackError = (error: unknown): boolean =>
  error instanceof Error &&
  (error.message.includes("GEMINI_API_KEY") ||
    error.message.includes("503") ||
    error.message.includes("Gemini"));
