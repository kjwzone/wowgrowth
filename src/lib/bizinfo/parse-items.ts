import type { BizinfoListResponse, BizinfoRawItem } from "@/lib/bizinfo/types";

export const parseBizinfoItems = (payload: BizinfoListResponse | unknown): BizinfoRawItem[] => {
  if (!payload || typeof payload !== "object") {
    return [];
  }

  const root = payload as BizinfoListResponse;
  const jsonArray = root.jsonArray;

  if (Array.isArray(jsonArray)) {
    return jsonArray.filter(isRecord);
  }

  if (jsonArray && typeof jsonArray === "object") {
    const item = jsonArray.item;
    if (Array.isArray(item)) {
      return item.filter(isRecord);
    }
    if (item && isRecord(item)) {
      return [item];
    }
  }

  return [];
};

const isRecord = (value: unknown): value is BizinfoRawItem =>
  typeof value === "object" && value !== null;

export const parseBizinfoTotal = (
  payload: BizinfoListResponse | unknown,
  fallback: number,
): number => {
  if (!payload || typeof payload !== "object") {
    return fallback;
  }

  const jsonArray = (payload as BizinfoListResponse).jsonArray;
  if (jsonArray && typeof jsonArray === "object" && !Array.isArray(jsonArray)) {
    const totCnt = Number(jsonArray.totCnt);
    if (Number.isFinite(totCnt) && totCnt > 0) {
      return totCnt;
    }
  }

  return fallback;
};
