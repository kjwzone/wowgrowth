import type { BizinfoProgram, BizinfoRawItem } from "@/lib/bizinfo/types";

const REGION_TAGS = [
  "서울",
  "부산",
  "대구",
  "인천",
  "광주",
  "대전",
  "울산",
  "세종",
  "경기",
  "강원",
  "충북",
  "충남",
  "전북",
  "전남",
  "경북",
  "경남",
  "제주",
] as const;

export const mapLcategoryToDisplayCategory = (lcategory: string): string => {
  const value = lcategory.trim();
  if (!value) return "기타";
  if (/창업|벤처|스타트업/i.test(value)) return "창업";
  if (/기술|R&D|연구|이노/i.test(value)) return "R&D";
  if (/수출|해외|글로벌/i.test(value)) return "수출";
  if (/인력|고용|일자리/i.test(value)) return "인력";
  if (/금융|융자|보증/i.test(value)) return "금융";
  if (/스마트|제조|공장|디지털/i.test(value)) return "스마트공장";
  if (/경영/i.test(value)) return "창업";
  return value.split("@")[0]?.trim() || "기타";
};

export const parseApplicationEndDate = (
  raw: string | undefined,
  now = new Date(),
): { deadline: string; daysLeft: number; period: string } => {
  const period = raw?.trim() ?? "";
  if (!period) {
    return { deadline: "미정", daysLeft: 999, period: "미정" };
  }

  const endToken = period.split("~").at(-1)?.trim().replace(/\D/g, "") ?? "";
  if (endToken.length !== 8) {
    return { deadline: period, daysLeft: 999, period };
  }

  const year = Number(endToken.slice(0, 4));
  const month = Number(endToken.slice(4, 6));
  const day = Number(endToken.slice(6, 8));
  const endDate = new Date(year, month - 1, day, 23, 59, 59);
  const msPerDay = 86_400_000;
  const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / msPerDay);
  const deadline = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  return { deadline, daysLeft, period };
};

export const resolveProgramStatus = (
  daysLeft: number,
): BizinfoProgram["status"] => {
  if (daysLeft < 0) return "마감";
  if (daysLeft <= 7) return "마감임박";
  return "모집중";
};

const extractRegion = (hashTags: string): string => {
  const hit = REGION_TAGS.find((tag) => hashTags.includes(tag));
  return hit ?? "전국";
};

const splitTarget = (trgetNm: string | undefined): string[] =>
  (trgetNm ?? "")
    .split(/[,·/|]/)
    .map((part) => part.trim())
    .filter(Boolean);

export const mapBizinfoItemToProgram = (
  item: BizinfoRawItem,
  now = new Date(),
): BizinfoProgram => {
  const pblancId = item.pblancId ?? item.seq ?? "";
  const title = item.pblancNm ?? item.title ?? "제목 없음";
  const agency = item.jrsdInsttNm ?? item.author ?? "기관 미정";
  const executingAgency = item.excInsttNm ?? "";
  const lcategory = item.lcategory ?? item.pldirSportRealmLclasCodeNm ?? "";
  const applicationRaw = item.reqstBeginEndDe ?? item.reqstDt ?? "";
  const { deadline, daysLeft, period } = parseApplicationEndDate(applicationRaw, now);
  const hashTags = (item.hashTags ?? "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
  const summary = item.bsnsSumryCn ?? item.description ?? "";
  const externalUrl = item.pblancUrl ?? item.link ?? "";

  return {
    id: `bizinfo-${pblancId || title}`,
    pblancId,
    title,
    agency: executingAgency ? `${agency} · ${executingAgency}` : agency,
    executingAgency,
    category: mapLcategoryToDisplayCategory(lcategory),
    region: extractRegion(item.hashTags ?? ""),
    supportAmount: "공고 확인",
    deadline,
    daysLeft: Math.max(daysLeft, -999),
    status: resolveProgramStatus(daysLeft),
    summary: summary || "상세 내용은 기업마당 원문을 확인하세요.",
    target: splitTarget(item.trgetNm),
    applicationPeriod: period,
    externalUrl,
    publishedAt: item.pubDate ?? item.creatPnttm ?? "",
    hashTags,
    source: "bizinfo",
  };
};

export const filterBizinfoPrograms = (
  items: BizinfoProgram[],
  filters: { query?: string; category?: string; region?: string },
): BizinfoProgram[] => {
  const query = filters.query?.trim().toLowerCase() ?? "";
  const category = filters.category?.trim() ?? "";
  const region = filters.region?.trim() ?? "";

  return items.filter((item) => {
    const matchQuery =
      !query ||
      item.title.toLowerCase().includes(query) ||
      item.agency.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query) ||
      item.summary.toLowerCase().includes(query);

    const matchCategory = !category || category === "전체" || item.category === category;
    const matchRegion =
      !region || region === "전체" || item.region === region || item.region === "전국";

    return matchQuery && matchCategory && matchRegion;
  });
};
