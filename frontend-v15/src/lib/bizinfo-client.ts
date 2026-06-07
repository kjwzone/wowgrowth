import type { ProgramCategory, SupportProgram } from "@/types";

type BizinfoApiProgram = {
  id: string;
  title: string;
  agency: string;
  category: string;
  region: string;
  supportAmount: string;
  deadline: string;
  daysLeft: number;
  status: SupportProgram["status"];
  summary: string;
  target: string[];
  applicationPeriod: string;
  externalUrl: string;
  source: "bizinfo";
};

export const DEFAULT_BIZINFO_PAGE_SIZE = 15;
const FETCH_TIMEOUT_MS = 15_000;

const toProgramCategory = (category: string): ProgramCategory => {
  const allowed: ProgramCategory[] = [
    "창업",
    "R&D",
    "수출",
    "스마트공장",
    "인력",
    "금융",
    "기타",
  ];
  return allowed.includes(category as ProgramCategory)
    ? (category as ProgramCategory)
    : "기타";
};

export const mapBizinfoToSupportProgram = (item: BizinfoApiProgram): SupportProgram => ({
  id: item.id,
  title: item.title,
  agency: item.agency,
  category: toProgramCategory(item.category),
  region: item.region,
  supportAmount: item.supportAmount,
  deadline: item.deadline,
  daysLeft: item.daysLeft,
  matchScore: null,
  status: item.status,
  summary: item.summary,
  target: item.target.length > 0 ? item.target : ["공고 원문에서 확인"],
  benefits: ["지원 내용은 기업마당 공고 원문을 확인하세요."],
  period: item.applicationPeriod,
  documents: ["사업계획서 등 — 공고별 상이"],
  aiFitAnalysis: "기업마당 실시간 공고입니다. AI 매칭 분석은 로그인·기업정보 등록 후 제공됩니다.",
  strategyTip: "기업마당 원문에서 평가 기준·제출 서류·자격 요건을 확인하세요.",
  source: "bizinfo",
  externalUrl: item.externalUrl,
});

/** frontend-v15 배포 도메인(kd4u)의 same-origin Vercel Function만 사용 */
export const buildBizinfoApiUrl = (params: {
  page?: number;
  pageSize?: number;
  q?: string;
  category?: string;
}): string => {
  const searchParams = new URLSearchParams();
  searchParams.set("pageSize", String(params.pageSize ?? DEFAULT_BIZINFO_PAGE_SIZE));
  if (params.page) searchParams.set("page", String(params.page));
  if (params.q) searchParams.set("q", params.q);
  if (params.category && params.category !== "전체") {
    searchParams.set("category", params.category);
  }

  return `/api/bizinfo?${searchParams.toString()}`;
};

const fetchWithTimeout = async (url: string): Promise<Response> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
};

type ApiListResponse = {
  success: boolean;
  data?: {
    items: BizinfoApiProgram[];
    total: number;
    source: "bizinfo";
  };
  error?: { message: string };
};

export type FetchBizinfoProgramsResult =
  | { ok: true; items: SupportProgram[]; total: number }
  | { ok: false; message: string };

const parseApiListResponse = (
  payload: ApiListResponse,
): FetchBizinfoProgramsResult => {
  if (!payload.success || !payload.data?.items?.length) {
    return {
      ok: false,
      message: payload.error?.message ?? "기업마당 공고가 없습니다.",
    };
  }

  return {
    ok: true,
    items: payload.data.items.map(mapBizinfoToSupportProgram),
    total: payload.data.total,
  };
};

const requestBizinfoPrograms = async (params: {
  page?: number;
  pageSize?: number;
  q?: string;
  category?: string;
}): Promise<FetchBizinfoProgramsResult> => {
  try {
    const response = await fetchWithTimeout(buildBizinfoApiUrl(params));
    const payload = (await response.json()) as ApiListResponse;

    if (!response.ok) {
      return {
        ok: false,
        message: payload.error?.message ?? `API 오류 (${response.status})`,
      };
    }

    return parseApiListResponse(payload);
  } catch {
    return { ok: false, message: "기업마당 API 요청 시간 초과" };
  }
};

export const fetchBizinfoProgramsFromApi = async (params: {
  page?: number;
  pageSize?: number;
  q?: string;
  category?: string;
}): Promise<FetchBizinfoProgramsResult> => {
  const pageSize = params.pageSize ?? DEFAULT_BIZINFO_PAGE_SIZE;
  const first = await requestBizinfoPrograms({ ...params, pageSize });
  if (first.ok) return first;

  if (pageSize <= 10) return first;

  const retry = await requestBizinfoPrograms({ ...params, pageSize: 10 });
  return retry.ok ? retry : first;
};

export const fetchBizinfoProgramById = async (
  id: string,
): Promise<SupportProgram | null> => {
  try {
    const list = await fetchBizinfoProgramsFromApi({ pageSize: 20 });
    return list.ok ? list.items.find((item) => item.id === id) ?? null : null;
  } catch {
    return null;
  }
};
