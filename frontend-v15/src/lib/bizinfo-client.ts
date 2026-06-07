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

export const getProgramsApiBaseUrl = (): string =>
  import.meta.env.VITE_WOWGROWTH_API_URL?.trim() || "https://wowgrowth.vercel.app";

type ApiListResponse = {
  success: boolean;
  data?: {
    items: BizinfoApiProgram[];
    total: number;
    source: "bizinfo";
  };
  error?: { message: string };
};

export const fetchBizinfoProgramsFromApi = async (params: {
  page?: number;
  pageSize?: number;
  q?: string;
  category?: string;
}): Promise<{ items: SupportProgram[]; total: number } | null> => {
  const searchParams = new URLSearchParams();
  searchParams.set("pageSize", String(params.pageSize ?? 30));
  if (params.page) searchParams.set("page", String(params.page));
  if (params.q) searchParams.set("q", params.q);
  if (params.category && params.category !== "전체") {
    searchParams.set("category", params.category);
  }

  const response = await fetch(
    `${getProgramsApiBaseUrl()}/api/programs/bizinfo?${searchParams.toString()}`,
  );

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as ApiListResponse;
  if (!payload.success || !payload.data?.items) {
    return null;
  }

  return {
    items: payload.data.items.map(mapBizinfoToSupportProgram),
    total: payload.data.total,
  };
};

export const fetchBizinfoProgramById = async (
  id: string,
): Promise<SupportProgram | null> => {
  const encodedId = encodeURIComponent(id.replace(/^bizinfo-/, ""));
  const response = await fetch(
    `${getProgramsApiBaseUrl()}/api/programs/bizinfo/${encodedId}`,
  );
  if (!response.ok) return null;
  const payload = (await response.json()) as {
    success: boolean;
    data?: BizinfoApiProgram;
  };
  if (!payload.success || !payload.data) return null;
  return mapBizinfoToSupportProgram(payload.data);
};
