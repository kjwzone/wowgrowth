export const BIZINFO_API_URL =
  "https://www.bizinfo.go.kr/uss/rss/bizinfoApi.do";

export const getBizinfoApiKey = (): string | undefined =>
  process.env.BIZINFO_API_KEY?.trim() || undefined;

export const isBizinfoConfigured = (): boolean => Boolean(getBizinfoApiKey());
