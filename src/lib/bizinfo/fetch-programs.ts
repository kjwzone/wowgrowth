import { ApiError } from "@/lib/api/errors";
import { BIZINFO_API_URL, getBizinfoApiKey } from "@/lib/bizinfo/env";
import { filterBizinfoPrograms, mapBizinfoItemToProgram } from "@/lib/bizinfo/map-program";
import { parseBizinfoItems, parseBizinfoTotal } from "@/lib/bizinfo/parse-items";
import type {
  BizinfoListResponse,
  FetchBizinfoProgramsParams,
  FetchBizinfoProgramsResult,
} from "@/lib/bizinfo/types";

const MAX_PAGE_SIZE = 50;

const buildHashtags = (params: FetchBizinfoProgramsParams): string | undefined => {
  const tags: string[] = [];
  if (params.category && params.category !== "전체") {
    tags.push(params.category);
  }
  if (params.region && params.region !== "전체") {
    tags.push(params.region);
  }
  if (params.query?.trim()) {
    tags.push(params.query.trim());
  }
  return tags.length > 0 ? tags.join(",") : undefined;
};

export const fetchBizinfoPrograms = async (
  params: FetchBizinfoProgramsParams = {},
): Promise<FetchBizinfoProgramsResult> => {
  const apiKey = getBizinfoApiKey();
  if (!apiKey) {
    throw new ApiError(
      "CONFIG_ERROR",
      "BIZINFO_API_KEY가 설정되지 않았습니다. 기업마당 API 인증키를 등록하세요.",
    );
  }

  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, params.pageSize ?? 20));

  const searchParams = new URLSearchParams({
    crtfcKey: apiKey,
    dataType: "json",
    pageIndex: String(page),
    pageUnit: String(pageSize),
  });

  const hashtags = buildHashtags(params);
  if (hashtags) {
    searchParams.set("hashtags", hashtags);
  }

  const response = await fetch(`${BIZINFO_API_URL}?${searchParams.toString()}`, {
    headers: {
      Accept: "application/json",
      "User-Agent": "WOWGrowth/1.0 (+https://wowgrowth.vercel.app)",
    },
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    throw new ApiError(
      "UPSTREAM_ERROR",
      `기업마당 API 호출 실패 (${response.status})`,
    );
  }

  const payload = (await response.json()) as BizinfoListResponse;
  const rawItems = parseBizinfoItems(payload);
  const mapped = rawItems.map((item) => mapBizinfoItemToProgram(item));
  const filtered = filterBizinfoPrograms(mapped, {
    query: params.query,
    category: params.category,
    region: params.region,
  });

  return {
    items: filtered,
    page,
    pageSize,
    total: parseBizinfoTotal(payload, filtered.length),
    source: "bizinfo",
  };
};

export const findBizinfoProgramById = async (
  id: string,
): Promise<FetchBizinfoProgramsResult["items"][number] | null> => {
  const pblancId = id.startsWith("bizinfo-") ? id.slice("bizinfo-".length) : id;
  const result = await fetchBizinfoPrograms({ page: 1, pageSize: MAX_PAGE_SIZE });
  return (
    result.items.find((item) => item.id === id || item.pblancId === pblancId) ?? null
  );
};
