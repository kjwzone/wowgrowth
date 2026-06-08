import { adminReviewItems } from "@/data/adminReview";
import { businessPlanDraft } from "@/data/businessPlan";
import { companyProfile } from "@/data/company";
import {
  dashboardInsights,
  dashboardStats,
} from "@/data/adminReview";
import { buildMatchingResults, buildMatchingSummary } from "@/lib/matching-score";
import { getProgramById, programs } from "@/data/programs";
import {
  fetchBizinfoProgramById,
  fetchBizinfoProgramsFromApi,
} from "@/lib/bizinfo-client";
import {
  adaptApiPlanToDraft,
  draftToApiPlan,
  mergeSectionIntoDraft,
  pipelineStepsFromApiStages,
} from "@/lib/business-plan-adapter";
import { buildAiContext } from "@/lib/business-plan-ai-context";
import { fetchAdminDashboardSummary } from "@/lib/admin-dashboard";
import { buildCompanyDiagnosisReport } from "@/lib/company-diagnosis";
import { businessPlanAiClient, isAiFallbackError } from "@/lib/business-plan-ai-client";
import {
  completePipeline,
  createEmptyDraft,
  generateSectionContent,
  getPipelineDelayMs,
  runPipelineStep,
  setDraftProgram,
} from "@/lib/business-plan-generator";
import { getPipelineForSkill } from "@/lib/business-plan-skill";
import { prepareForSubmission } from "@/lib/business-plan-submission";
import type {
  AdminReviewItem,
  BusinessPlanDraft,
  CompanyProfile,
  DashboardInsight,
  DashboardStats,
  MatchingResult,
  PipelineStep,
  SupportProgram,
  UserSession,
} from "@/types";
import type { SubmissionCheckResult } from "@/lib/business-plan-submission";

export type { SubmissionCheckResult };

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

let draftCache: BusinessPlanDraft = businessPlanDraft;
let bizinfoProgramCache: SupportProgram[] = [];
let cachedProgram: SupportProgram | undefined;
let aiEnabled: boolean | null = null;

const resolveAiEnabled = async (): Promise<boolean> => {
  if (aiEnabled !== null) return aiEnabled;
  aiEnabled = await businessPlanAiClient.isAvailable();
  return aiEnabled;
};

const getAiContext = async (): Promise<ReturnType<typeof buildAiContext>> => {
  const program =
    cachedProgram ?? (await programApi.getById(draftCache.programId)) ?? programs[0]!;
  return buildAiContext(program);
};

export type ProgramListResult = {
  items: SupportProgram[];
  source: "bizinfo" | "mock";
  message?: string;
};

export const programApi = {
  list: async (params?: {
    q?: string;
    category?: string;
  }): Promise<ProgramListResult> => {
    const remote = await fetchBizinfoProgramsFromApi({
      q: params?.q,
      category: params?.category,
    });

    if (remote.ok) {
      bizinfoProgramCache = remote.items;
      return { items: remote.items, source: "bizinfo" };
    }

    await delay(200);
    return {
      items: programs,
      source: "mock",
      message: `기업마당 API를 불러오지 못했습니다. 데모 데이터를 표시합니다. (${remote.message})`,
    };
  },

  getById: async (id: string): Promise<SupportProgram | undefined> => {
    const cached =
      bizinfoProgramCache.find((p) => p.id === id) ?? getProgramById(id);
    if (cached) return cached;

    if (id.startsWith("bizinfo-")) {
      const remote = await fetchBizinfoProgramById(id);
      if (remote) {
        bizinfoProgramCache = [
          ...bizinfoProgramCache.filter((program) => program.id !== id),
          remote,
        ];
        return remote;
      }
      return undefined;
    }

    await delay(150);
    return getProgramById(id);
  },
};

export const companyApi = {
  get: async (): Promise<CompanyProfile> => {
    await delay(150);
    return companyProfile;
  },
  save: async (profile: CompanyProfile): Promise<CompanyProfile> => {
    await delay(300);
    return profile;
  },
};

export type MatchingListResult = {
  items: MatchingResult[];
  source: ProgramListResult["source"];
  message?: string;
  summary: string;
  programsScanned: number;
};

const MATCHING_BIZINFO_PAGE_SIZE = 50;

export const matchingApi = {
  list: async (): Promise<MatchingListResult> => {
    const company = await companyApi.get();
    const remote = await fetchBizinfoProgramsFromApi({
      pageSize: MATCHING_BIZINFO_PAGE_SIZE,
    });

    if (remote.ok) {
      bizinfoProgramCache = remote.items;
      const items = buildMatchingResults(company, remote.items, 3);
      return {
        items,
        source: "bizinfo",
        summary: buildMatchingSummary(items),
        programsScanned: remote.items.length,
      };
    }

    const fallback = await programApi.list();
    const items = buildMatchingResults(company, fallback.items, 3);
    return {
      items,
      source: fallback.source,
      message: `기업마당 실시간 연동 실패(${remote.message}). 임시 데모 공고로 매칭합니다.`,
      summary: buildMatchingSummary(items),
      programsScanned: fallback.items.length,
    };
  },
};

export const businessPlanApi = {
  get: async (): Promise<BusinessPlanDraft> => {
    await delay(200);
    return draftCache;
  },

  /** 공고 상세·매칭 결과에서 선택한 공고로 사업계획서 초안 연동 */
  initForProgram: async (programId: string): Promise<BusinessPlanDraft> => {
    const program = await programApi.getById(programId);
    if (!program) {
      throw new Error(`공고를 찾을 수 없습니다: ${programId}`);
    }

    setDraftProgram(program);
    cachedProgram = program;
    const draft = createEmptyDraft(programId);
    draftCache = draft;
    await delay(150);
    return draft;
  },

  /** Gemini fast(1회) 또는 pipeline(2회) — 기본 fast */
  generateFullDraft: async (
    onProgress?: (draft: BusinessPlanDraft) => void,
    options?: { mode?: "fast" | "pipeline" },
  ): Promise<BusinessPlanDraft> => {
    const programId = draftCache.programId;
    const mode = options?.mode ?? "fast";
    const pipeline = getPipelineForSkill(draftCache.skillId);

    if (await resolveAiEnabled()) {
      const runningSteps: PipelineStep[] =
        mode === "fast"
          ? [{ id: "generate", agent: "plan-writer", label: "AI 초안 생성", status: "running" }]
          : pipeline.map((step, index) => ({
              ...step,
              status: index === 0 ? "running" : "pending",
            }));

      let draft: BusinessPlanDraft = {
        ...createEmptyDraft(programId),
        pipelineSteps: runningSteps,
      };
      onProgress?.(draft);

      try {
        const ctx = await getAiContext();
        const result = await businessPlanAiClient.generate(ctx, mode);
        draft = adaptApiPlanToDraft(result.plan, {
          programId,
          program: ctx.program,
          model: result.model,
          pipelineSteps: pipelineStepsFromApiStages(result.stages, draft.skillId),
        });
        draftCache = draft;
        onProgress?.(draft);
        return draft;
      } catch (error) {
        if (!isAiFallbackError(error)) throw error;
      }
    }

    let draft = createEmptyDraft(programId);
    for (let i = 0; i < pipeline.length; i += 1) {
      draft = runPipelineStep(draft, i);
      onProgress?.(draft);
      await delay(getPipelineDelayMs(pipeline[i]!));
    }
    draft = completePipeline(draft);
    draftCache = draft;
    onProgress?.(draft);
    return draft;
  },

  /** 선택 섹션 — Gemini 심화 또는 mock */
  generateSection: async (
    sectionId: string,
    onProgress?: (draft: BusinessPlanDraft) => void,
  ): Promise<BusinessPlanDraft> => {
    const section = draftCache.sections.find((item) => item.id === sectionId);
    if (!section) throw new Error("섹션을 찾을 수 없습니다.");

    draftCache = {
      ...draftCache,
      activeAgent:
        draftCache.skillId === "gov-funding-plan" ? "tech-writer" : "plan-writer",
    };
    onProgress?.(draftCache);

    if (await resolveAiEnabled()) {
      try {
        const ctx = await getAiContext();
        const result = await businessPlanAiClient.generateSection({
          ctx,
          sectionTitle: section.title,
          existingContent: section.content,
          mode: "deep",
        });
        draftCache = mergeSectionIntoDraft(
          draftCache,
          result.section_title,
          result.content,
        );
        onProgress?.({ ...draftCache, activeAgent: undefined });
        return draftCache;
      } catch (error) {
        if (!isAiFallbackError(error)) throw error;
      }
    }

    await delay(900);
    const draft = generateSectionContent(draftCache, sectionId);
    draftCache = { ...draft, activeAgent: undefined };
    onProgress?.(draftCache);
    return draftCache;
  },

  /** submission-verifier + 로컬 체크 */
  prepareForSubmission: async (): Promise<{
    draft: BusinessPlanDraft;
    result: SubmissionCheckResult;
  }> => {
    if (await resolveAiEnabled()) {
      try {
        const ctx = await getAiContext();
        const verify = await businessPlanAiClient.verify(ctx, draftToApiPlan(draftCache));
        draftCache = {
          ...draftCache,
          verification: verify.self_verification ?? draftCache.verification,
          submissionChecklist: verify.checklist,
          status: verify.ok ? "ready" : "review",
        };
        return {
          draft: draftCache,
          result: {
            ok: verify.ok,
            errors: verify.blocking_issues ?? [],
            checklist: verify.checklist.map((item) => ({
              item: item.item,
              pass: item.passed,
              note: item.message,
            })),
          },
        };
      } catch (error) {
        if (!isAiFallbackError(error)) throw error;
      }
    }

    await delay(600);
    const { draft, result } = prepareForSubmission(draftCache);
    if (result.ok) draftCache = draft;
    return { draft: result.ok ? draft : draftCache, result };
  },
};

export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    await delay(150);
    return dashboardStats;
  },
  getInsights: async (): Promise<DashboardInsight[]> => {
    await delay(150);
    return dashboardInsights;
  },
};

export const diagnosisReportApi = {
  get: async () => {
    await delay(200);
    const company = await companyApi.get();
    const matching = (await matchingApi.list()).items;
    return buildCompanyDiagnosisReport(company, matching);
  },
};

export const adminDashboardApi = {
  getSummary: fetchAdminDashboardSummary,
};

export const adminApi = {
  listReviews: async (): Promise<AdminReviewItem[]> => {
    await delay(200);
    return adminReviewItems;
  },
  updateReview: async (
    id: string,
    patch: Partial<AdminReviewItem>,
  ): Promise<AdminReviewItem> => {
    await delay(300);
    const item = adminReviewItems.find((r) => r.id === id);
    if (!item) throw new Error("Not found");
    return { ...item, ...patch };
  },
};

export const authApi = {
  login: async (email: string, _password: string): Promise<UserSession> => {
    await delay(400);
    return {
      email,
      name: email.includes("admin") ? "관리자" : "김종우",
      role: email.includes("admin") ? "admin" : "user",
    };
  },
  signup: async (email: string, _password: string, name: string): Promise<UserSession> => {
    await delay(500);
    return { email, name, role: "user" };
  },
};

/** 테스트용 캐시 리셋 */
export const resetBusinessPlanCache = (): void => {
  draftCache = businessPlanDraft;
};
