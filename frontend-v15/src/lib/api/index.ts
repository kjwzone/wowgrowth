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
  completePipeline,
  createEmptyDraft,
  generateSectionContent,
  getPipelineDelayMs,
  runPipelineStep,
} from "@/lib/business-plan-generator";
import { getPipelineForSkill } from "@/lib/business-plan-skill";
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

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

let draftCache: BusinessPlanDraft = businessPlanDraft;

export const programApi = {
  list: async (): Promise<SupportProgram[]> => {
    await delay(200);
    return programs;
  },
  getById: async (id: string): Promise<SupportProgram | undefined> => {
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
