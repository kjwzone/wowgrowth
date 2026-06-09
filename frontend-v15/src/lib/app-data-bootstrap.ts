import { companyProfile } from "@/data/company";
import { programs } from "@/data/programs";
import { fetchBizinfoProgramsFromApi } from "@/lib/bizinfo-client";
import {
  buildDashboardSnapshot,
  type DashboardSnapshot,
} from "@/lib/dashboard-data";
import { loadStoredProfile, normalizeCompanyProfile } from "@/lib/company-profile-model";
import { buildMatchingResults } from "@/lib/matching-score";
import type { BusinessPlanDraft, CompanyProfile, MatchingResult, SupportProgram } from "@/types";

export type AppDataSource = "bizinfo" | "mock";

export type AppDataBootstrapResult = {
  source: AppDataSource;
  programs: SupportProgram[];
  matching: MatchingResult[];
  snapshot: DashboardSnapshot;
  message?: string;
};

const BIZINFO_BOOTSTRAP_PAGE_SIZE = 50;
const RETRY_DELAYS_MS = [0, 600, 1200] as const;

let bootstrapped = false;
let cachedPrograms: SupportProgram[] | null = null;
let cachedMatching: MatchingResult[] | null = null;
let cachedSnapshot: DashboardSnapshot | null = null;
let cachedSource: AppDataSource = "mock";
let cachedMessage: string | undefined;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const loadCompanyProfile = (): CompanyProfile =>
  normalizeCompanyProfile(loadStoredProfile() ?? companyProfile);

export const isAppDataBootstrapped = (): boolean => bootstrapped;

export const getBootstrappedPrograms = (): SupportProgram[] | null => cachedPrograms;

export const getBootstrappedMatching = (): MatchingResult[] | null => cachedMatching;

export const getBootstrappedSnapshot = (): DashboardSnapshot | null => cachedSnapshot;

export const getBootstrappedSource = (): AppDataSource => cachedSource;

export const clearAppDataBootstrap = (): void => {
  bootstrapped = false;
  cachedPrograms = null;
  cachedMatching = null;
  cachedSnapshot = null;
  cachedSource = "mock";
  cachedMessage = undefined;
};

const buildSnapshot = (
  company: CompanyProfile,
  matching: MatchingResult[],
  plan: BusinessPlanDraft,
  programList: SupportProgram[],
  source: AppDataSource,
): DashboardSnapshot =>
  buildDashboardSnapshot({
    company,
    matching,
    plan,
    programs: programList,
    sources: { matching: source, programs: source },
  });

const applyBootstrap = (
  programList: SupportProgram[],
  source: AppDataSource,
  company: CompanyProfile,
  plan: BusinessPlanDraft,
  message?: string,
): AppDataBootstrapResult => {
  const matching = buildMatchingResults(company, programList, 3);
  const snapshot = buildSnapshot(company, matching, plan, programList, source);

  bootstrapped = true;
  cachedPrograms = programList;
  cachedMatching = matching;
  cachedSnapshot = snapshot;
  cachedSource = source;
  cachedMessage = message;

  return {
    source,
    programs: programList,
    matching,
    snapshot,
    message,
  };
};

/** 로그인 직후 기업마당·매칭·대시보드 데이터를 한 번에 연동 */
export const bootstrapAppData = async (
  plan: BusinessPlanDraft,
): Promise<AppDataBootstrapResult> => {
  const company = loadCompanyProfile();
  let lastMessage = "기업마당 API 연동 실패";

  for (const waitMs of RETRY_DELAYS_MS) {
    if (waitMs > 0) {
      await delay(waitMs);
    }

    const remote = await fetchBizinfoProgramsFromApi({
      pageSize: BIZINFO_BOOTSTRAP_PAGE_SIZE,
    });

    if (remote.ok) {
      return applyBootstrap(remote.items, "bizinfo", company, plan);
    }

    lastMessage = remote.message;
  }

  return applyBootstrap(programs, "mock", company, plan, lastMessage);
};

export const getBootstrapStatusMessage = (): string | undefined => cachedMessage;
