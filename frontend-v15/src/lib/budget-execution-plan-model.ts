export type BudgetSummary = {
  regionLabel: string;
  totalAmount: number;
  govSupportAmount: number;
  selfCashAmount: number;
  selfInKindAmount: number;
};

export type BudgetLineItem = {
  category: string;
  plan: string;
  govSupport: number;
  selfCash: number;
  selfInKind: number;
};

export type BudgetExecutionPlan = {
  summary: BudgetSummary;
  items: BudgetLineItem[];
};

const SUMMARY_PREFIX = "■ [사업비 요약]";
const ITEM_PREFIX = "■ [비목]";

export const formatKrw = (amount: number): string =>
  amount.toLocaleString("ko-KR", { maximumFractionDigits: 0 });

export const pctOfTotal = (part: number, total: number): number =>
  total === 0 ? 0 : Math.round((part / total) * 100);

export const lineItemTotal = (item: BudgetLineItem): number =>
  item.govSupport + item.selfCash + item.selfInKind;

export const parseGovSupportMaxKrw = (supportAmount?: string): number => {
  if (!supportAmount || supportAmount.includes("공고")) return 100_000_000;
  const eok = supportAmount.match(/(\d+(?:\.\d+)?)\s*억/);
  if (eok) return Math.round(parseFloat(eok[1]!) * 100_000_000);
  const man = supportAmount.match(/(\d+(?:,\d+)*)\s*만/);
  if (man) return Number.parseInt(man[1]!.replace(/,/g, ""), 10) * 10_000;
  return 100_000_000;
};

const scaleAmount = (base: number, factor: number): number =>
  Math.round(base * factor);

type BuildPlanInput = {
  govSupportMaxKrw?: number;
  companyName?: string;
  regionLabel?: string;
};

/** 초기창업패키지 양식 기준 기본 사업비 집행계획 (143백만 = 정부 1억 + 자부담 30%) */
export const buildDefaultBudgetExecutionPlan = ({
  govSupportMaxKrw = 100_000_000,
  companyName = "와우그로스(주)",
  regionLabel = "일반지역",
}: BuildPlanInput = {}): BudgetExecutionPlan => {
  const factor = govSupportMaxKrw / 100_000_000;
  const gov = govSupportMaxKrw;
  const selfCash = scaleAmount(14_000_000, factor);
  const selfInKind = scaleAmount(29_000_000, factor);
  const total = gov + selfCash + selfInKind;

  const items: BudgetLineItem[] = [
    {
      category: "인건비",
      plan: `[기존] 대표자 인건비(290만×10개월) — ${companyName} AI·정부지원 SaaS 총괄`,
      govSupport: 0,
      selfCash: 0,
      selfInKind: scaleAmount(29_000_000, factor),
    },
    {
      category: "인건비",
      plan: "[신규] AI·백엔드·PM 3명(개발 400만·영업 240만×10개월)",
      govSupport: scaleAmount(50_000_000, factor),
      selfCash: scaleAmount(14_000_000, factor),
      selfInKind: 0,
    },
    {
      category: "외주 용역비",
      plan: "SaaS UI/UX 고도화·보안 취약점 점검",
      govSupport: scaleAmount(15_000_000, factor),
      selfCash: 0,
      selfInKind: 0,
    },
    {
      category: "외주 용역비",
      plan: "기업마당 API 연동·LLM Agent 파이프라인 구축",
      govSupport: scaleAmount(5_000_000, factor),
      selfCash: 0,
      selfInKind: 0,
    },
    {
      category: "광고 선전비",
      plan: "B2B 세일즈·웨비나·PoC 실증 마케팅",
      govSupport: scaleAmount(10_000_000, factor),
      selfCash: 0,
      selfInKind: 0,
    },
    {
      category: "기계장치 구매비",
      plan: "AI 모델 파인튜닝용 고성능 GPU 워크스테이션",
      govSupport: scaleAmount(12_000_000, factor),
      selfCash: 0,
      selfInKind: 0,
    },
    {
      category: "지급 수수료",
      plan: "특허 등록 비용(3건)",
      govSupport: scaleAmount(8_000_000, factor),
      selfCash: 0,
      selfInKind: 0,
    },
  ];

  return {
    summary: {
      regionLabel,
      totalAmount: total,
      govSupportAmount: gov,
      selfCashAmount: selfCash,
      selfInKindAmount: selfInKind,
    },
    items,
  };
};

const parseAmount = (value: string): number => {
  const cleaned = value.replace(/,/g, "").trim();
  return cleaned ? Number.parseInt(cleaned, 10) : 0;
};

const parseSummaryLine = (line: string): BudgetSummary | null => {
  const body = line.replace(SUMMARY_PREFIX, "").trim();
  const parts = body.split("|").map((part) => part.trim());
  if (parts.length < 5) return null;

  return {
    regionLabel: parts[0]!,
    totalAmount: parseAmount(parts[1]!),
    govSupportAmount: parseAmount(parts[2]!),
    selfCashAmount: parseAmount(parts[3]!),
    selfInKindAmount: parseAmount(parts[4]!),
  };
};

const parseItemLine = (line: string): BudgetLineItem | null => {
  const body = line.replace(ITEM_PREFIX, "").trim();
  const parts = body.split("|").map((part) => part.trim());
  if (parts.length < 6) return null;

  return {
    category: parts[0]!,
    plan: parts[1]!,
    govSupport: parseAmount(parts[2]!),
    selfCash: parseAmount(parts[3]!),
    selfInKind: parseAmount(parts[4]!),
  };
};

export const serializeBudgetExecutionPlan = (plan: BudgetExecutionPlan): string => {
  const { summary, items } = plan;
  const summaryLine = [
    `${SUMMARY_PREFIX} ${summary.regionLabel}`,
    summary.totalAmount,
    summary.govSupportAmount,
    summary.selfCashAmount,
    summary.selfInKindAmount,
  ].join("|");

  const itemLines = items.map((item) =>
    [
      `${ITEM_PREFIX} ${item.category}`,
      item.plan,
      item.govSupport,
      item.selfCash,
      item.selfInKind,
      lineItemTotal(item),
    ].join("|"),
  );

  return [summaryLine, ...itemLines].join("\n");
};

export const parseBudgetExecutionPlan = (content: string): BudgetExecutionPlan | null => {
  const lines = content.split("\n").map((line) => line.trim());

  const summaryLine = lines.find((line) => line.startsWith(SUMMARY_PREFIX));
  if (!summaryLine) return null;

  const summary = parseSummaryLine(summaryLine);
  if (!summary) return null;

  const items = lines.flatMap((line) => {
    if (!line.startsWith(ITEM_PREFIX)) return [];
    const item = parseItemLine(line);
    return item ? [item] : [];
  });

  if (items.length === 0) return null;

  return { summary, items };
};

export const sumBudgetItems = (items: readonly BudgetLineItem[]) =>
  items.reduce(
    (acc, item) => ({
      govSupport: acc.govSupport + item.govSupport,
      selfCash: acc.selfCash + item.selfCash,
      selfInKind: acc.selfInKind + item.selfInKind,
      total: acc.total + lineItemTotal(item),
    }),
    { govSupport: 0, selfCash: 0, selfInKind: 0, total: 0 },
  );
