const BIZINFO_API_URL = "https://www.bizinfo.go.kr/uss/rss/bizinfoApi.do";

const REGION_TAGS = [
  "서울", "부산", "대구", "인천", "광주", "대전", "울산", "세종",
  "경기", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주",
];

const mapCategory = (lcategory) => {
  const value = (lcategory ?? "").trim();
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

const parseDeadline = (raw) => {
  const period = (raw ?? "").trim();
  if (!period) return { deadline: "미정", daysLeft: 999, period: "미정" };
  const endToken = period.split("~").at(-1)?.trim().replace(/\D/g, "") ?? "";
  if (endToken.length !== 8) return { deadline: period, daysLeft: 999, period };
  const year = Number(endToken.slice(0, 4));
  const month = Number(endToken.slice(4, 6));
  const day = Number(endToken.slice(6, 8));
  const endDate = new Date(year, month - 1, day, 23, 59, 59);
  const daysLeft = Math.ceil((endDate.getTime() - Date.now()) / 86_400_000);
  const deadline = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  return { deadline, daysLeft, period };
};

const resolveStatus = (daysLeft) => {
  if (daysLeft < 0) return "마감";
  if (daysLeft <= 7) return "마감임박";
  return "모집중";
};

const extractRegion = (hashTags) => {
  const hit = REGION_TAGS.find((tag) => (hashTags ?? "").includes(tag));
  return hit ?? "전국";
};

const parseItems = (payload) => {
  if (!payload || typeof payload !== "object") return [];
  const jsonArray = payload.jsonArray;
  if (Array.isArray(jsonArray)) return jsonArray.filter((item) => item && typeof item === "object");
  if (jsonArray && typeof jsonArray === "object") {
    const item = jsonArray.item;
    if (Array.isArray(item)) return item;
    if (item && typeof item === "object") return [item];
  }
  return [];
};

const mapItem = (item) => {
  const pblancId = item.pblancId ?? item.seq ?? "";
  const title = item.pblancNm ?? item.title ?? "제목 없음";
  const agency = item.jrsdInsttNm ?? item.author ?? "기관 미정";
  const executingAgency = item.excInsttNm ?? "";
  const lcategory = item.lcategory ?? item.pldirSportRealmLclasCodeNm ?? "";
  const applicationRaw = item.reqstBeginEndDe ?? item.reqstDt ?? "";
  const { deadline, daysLeft, period } = parseDeadline(applicationRaw);
  const summary = item.bsnsSumryCn ?? item.description ?? "";
  const externalUrl = item.pblancUrl ?? item.link ?? "";
  const target = (item.trgetNm ?? "")
    .split(/[,·/|]/)
    .map((part) => part.trim())
    .filter(Boolean);

  return {
    id: `bizinfo-${pblancId || title}`,
    pblancId,
    title,
    agency: executingAgency ? `${agency} · ${executingAgency}` : agency,
    category: mapCategory(lcategory),
    region: extractRegion(item.hashTags ?? ""),
    supportAmount: "공고 확인",
    deadline,
    daysLeft: Math.max(daysLeft, -999),
    status: resolveStatus(daysLeft),
    summary: summary || "상세 내용은 기업마당 원문을 확인하세요.",
    target: target.length > 0 ? target : ["공고 원문에서 확인"],
    applicationPeriod: period,
    externalUrl,
    source: "bizinfo",
  };
};

const setCors = (res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
};

export default async function handler(req, res) {
  setCors(res);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ success: false, error: { message: "GET only" } });
  }

  const apiKey = process.env.BIZINFO_API_KEY?.trim();
  if (!apiKey) {
    return res.status(503).json({
      success: false,
      error: { message: "BIZINFO_API_KEY가 설정되지 않았습니다." },
    });
  }

  const page = Math.max(1, Number(req.query.page ?? 1));
  const pageSize = Math.min(50, Math.max(1, Number(req.query.pageSize ?? 20)));
  const hashtags = [req.query.q, req.query.category]
    .filter((value) => value && value !== "전체")
    .join(",");

  const params = new URLSearchParams({
    crtfcKey: apiKey,
    dataType: "json",
    pageIndex: String(page),
    pageUnit: String(pageSize),
  });
  if (hashtags) params.set("hashtags", String(hashtags));

  try {
    const upstream = await fetch(`${BIZINFO_API_URL}?${params.toString()}`, {
      headers: {
        Accept: "application/json",
        "User-Agent": "WOWGrowth-frontend-v15/1.0",
      },
      signal: AbortSignal.timeout(15_000),
    });

    if (!upstream.ok) {
      return res.status(502).json({
        success: false,
        error: { message: `기업마당 API 오류 (${upstream.status})` },
      });
    }

    const payload = await upstream.json();
    const items = parseItems(payload).map(mapItem);

    return res.status(200).json({
      success: true,
      data: { items, total: items.length, page, pageSize, source: "bizinfo" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "기업마당 API 호출 실패";
    return res.status(502).json({ success: false, error: { message } });
  }
}
