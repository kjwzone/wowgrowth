import { adminReviewItems } from "@/data/adminReview";
import { businessPlanDraft } from "@/data/businessPlan";
import { companyProfile } from "@/data/company";
import {
  dashboardInsights,
  dashboardStats,
} from "@/data/adminReview";
import { matchingResults } from "@/data/matching";
import { getProgramById, programs } from "@/data/programs";
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
    return businessPlanDraft;
  },
  generateSection: async (sectionId: string): Promise<string> => {
    await delay(1200);
    const section = businessPlanDraft.sections.find((s) => s.id === sectionId);
    return section?.content || "AI가 생성한 초안 내용입니다.";
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
