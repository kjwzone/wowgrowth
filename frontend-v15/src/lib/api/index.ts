import { adminReviewItems } from "@/data/adminReview";
import { businessPlanDraft } from "@/data/businessPlan";
import { companyProfile } from "@/data/company";
import {
  dashboardInsights,
  dashboardStats,
} from "@/data/adminReview";
import { matchingResults } from "@/data/matching";
import { getProgramById, programs } from "@/data/programs";
import {
  fetchBizinfoProgramById,
  fetchBizinfoProgramsFromApi,
} from "@/lib/bizinfo-client";
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
  SupportProgram,
  UserSession,
} from "@/types";
import type { SubmissionCheckResult } from "@/lib/business-plan-submission";

export type { SubmissionCheckResult };

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

let draftCache: BusinessPlanDraft = businessPlanDraft;
let bizinfoProgramCache: SupportProgram[] = [];

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

export const matchingApi = {
  list: async (): Promise<MatchingResult[]> => {
    await delay(200);
    return matchingResults;
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
    const draft = createEmptyDraft(programId);
    draftCache = draft;
    await delay(150);
    return draft;
  },

  /** business-plan-writer / gov-funding-plan 스킬 파이프라인 시뮬레이션 */
  generateFullDraft: async (
    onProgress?: (draft: BusinessPlanDraft) => void,
  ): Promise<BusinessPlanDraft> => {
    const programId = draftCache.programId;
    let draft = createEmptyDraft(programId);
    const pipeline = getPipelineForSkill(draft.skillId);

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

  /** 선택 섹션 — plan-writer / tech-writer·biz-writer 경로 */
  generateSection: async (
    sectionId: string,
    onProgress?: (draft: BusinessPlanDraft) => void,
  ): Promise<BusinessPlanDraft> => {
    await delay(900);
    const draft = generateSectionContent(draftCache, sectionId);
    draftCache = {
      ...draft,
      activeAgent:
        draft.skillId === "gov-funding-plan" ? "tech-writer" : "plan-writer",
    };
    onProgress?.(draftCache);
    await delay(300);
    draftCache = { ...draftCache, activeAgent: undefined };
    onProgress?.(draftCache);
    return draftCache;
  },

  /** submission-verifier 스킬 — 제출 전 체크리스트 검증 후 ready 상태로 전환 */
  prepareForSubmission: async (): Promise<{
    draft: BusinessPlanDraft;
    result: SubmissionCheckResult;
  }> => {
    await delay(600);
    const { draft, result } = prepareForSubmission(draftCache);
    if (result.ok) {
      draftCache = draft;
    }
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
