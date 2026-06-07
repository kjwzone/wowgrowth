export type BudgetConstraints = {
  govSupportMaxKrw: number;
  cashMatchRatio: number;
  inKindRatio: number;
  regionLabel: string;
  programKind: "export" | "rnd" | "startup" | "general";
  eligibleCategories: string[];
  notes: string[];
};

export type BudgetLineItem = {
  category: string;
  plan: string;
  govSupport: number;
  selfCash: number;
  selfInKind: number;
};

export type BudgetSummary = {
  regionLabel: string;
  totalAmount: number;
  govSupportAmount: number;
  selfCashAmount: number;
  selfInKindAmount: number;
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

const parseAmountToken = (raw: string): number => {
  const text = raw.replace(/,/g, "").trim();
  const eok = text.match(/(\d+(?:\.\d+)?)\s*억/);
  if (eok) return Math.round(parseFloat(eok[1]!) * 100_000_000);
  const man = text.match(/(\d+(?:\.\d+)?)\s*만/);
  if (man) return Math.round(parseFloat(man[1]!) * 10_000);
  const million = text.match(/(\d+(?:\.\d+)?)\s*백만/);
  if (million) return Math.round(parseFloat(million[1]!) * 1_000_000);
  const plain = text.match(/(\d+)/);
  return plain ? Number.parseInt(plain[1]!, 10) : 0;
};

export const parseGovSupportMaxKrw = (supportAmount?: string): number => {
  if (!supportAmount || supportAmount.includes("공고")) return 0;
  return parseAmountToken(supportAmount);
};

const detectProgramKind = (text: string): BudgetConstraints["programKind"] => {
  if (/수출|해외|바이어|전시|상담회|코믹|글로벌/.test(text)) return "export";
  if (/R&D|연구|기술개발|TIPS|과학|실증|장비/.test(text)) return "rnd";
  if (/창업|스타트업|초기창업|벤처/.test(text)) return "startup";
  return "general";
};

const parseCashMatchRatio = (text: string): number => {
  const cash = text.match(/현금\s*(\d{1,2})\s*%|(\d{1,2})\s*%\s*현금|현금\s*부담[^\d]*(\d{1,2})\s*%/);
  if (cash) return Number(cash[1] ?? cash[2] ?? cash[3]) / 100;
  const self = text.match(/자부담[^\d]*(\d{1,2})\s*%/);
  if (self) return Number(self[1]) / 100;
  return 0.1;
};

const parseInKindRatio = (text: string): number => {
  if (/현물\s*불가|현물\s*인정\s*안|현물\s*제외/.test(text)) return 0;
  const inKind = text.match(/현물\s*(\d{1,2})\s*%/);
  if (inKind) return Number(inKind[1]) / 100;
  return 0.2;
};

const extractGovMaxFromText = (text: string): number => {
  const patterns = [
    /(?:기업당|1社|1개사|최대|한도|지원)[^\d]{0,20}(\d+(?:\.\d+)?)\s*억/,
    /정부지원[^\d]{0,20}(\d+(?:\.\d+)?)\s*억/,
    /사업비[^\d]{0,20}(\d+(?:\.\d+)?)\s*억/,
    /(\d+(?:,\d+)*)\s*만\s*원\s*(?:이내|한도|지원)/,
    /(\d+(?:\.\d+)?)\s*백만\s*원/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const amount = parseAmountToken(match[1]!);
      if (amount >= 5_000_000) return amount;
    }
  }
  return 0;
};

export const parseBudgetConstraintsFromProgram = (program: {
  supportAmount?: string;
  summary?: string;
  summaryHtml?: string;
  benefits?: string[];
  region?: string;
  title?: string;
  category?: string;
}): BudgetConstraints => {
  const corpus = [
    program.supportAmount,
    program.summary,
    program.summaryHtml?.replace(/<[^>]+>/g, " "),
    program.title,
    program.category,
    program.region,
    ...(program.benefits ?? []),
  ]
    .filter(Boolean)
    .join("\n");

  const programKind = detectProgramKind(corpus);
  const fromSupportField = parseGovSupportMaxKrw(program.supportAmount);
  const fromText = extractGovMaxFromText(corpus);
  const govSupportMaxKrw =
    fromSupportField ||
    fromText ||
    (programKind === "export" ? 50_000_000 : programKind === "rnd" ? 200_000_000 : 100_000_000);

  const cashMatchRatio = parseCashMatchRatio(corpus);
  const inKindRatio = parseInKindRatio(corpus);

  const eligibleCategories = (() => {
    if (programKind === "export") {
      return ["인건비", "외주 용역비", "광고 선전비", "여비", "지급 수수료"];
    }
    if (programKind === "rnd") {
      return ["인건비", "연구 재료비", "연구 활동비", "외주 용역비", "기계장치 구매비"];
    }
    return ["인건비", "외주 용역비", "광고 선전비", "기계장치 구매비", "지급 수수료"];
  })();

  const notes: string[] = [];
  if (cashMatchRatio > 0) notes.push(`현금 부담 ${Math.round(cashMatchRatio * 100)}%`);
  if (inKindRatio > 0) notes.push(`현물 부담 ${Math.round(inKindRatio * 100)}%`);
  if (fromText && !fromSupportField) notes.push("공고 본문에서 지원한도 추정");

  return {
    govSupportMaxKrw,
    cashMatchRatio: cashMatchRatio || 0.1,
    inKindRatio,
    regionLabel: program.region && program.region !== "전국" ? program.region : "일반지역",
    programKind,
    eligibleCategories,
    notes,
  };
};

const allocate = (total: number, ratios: readonly number[]): number[] => {
  const sum = ratios.reduce((acc, ratio) => acc + ratio, 0);
  const amounts = ratios.map((ratio) => Math.round((total * ratio) / sum));
  const diff = total - amounts.reduce((acc, value) => acc + value, 0);
  if (diff !== 0) amounts[0]! += diff;
  return amounts;
};

type BuildPlanInput = {
  constraints: BudgetConstraints;
  companyName?: string;
  product?: string;
  programTitle?: string;
};

export const buildBudgetExecutionPlanFromProgram = ({
  constraints,
  companyName = "와우그로스(주)",
  product = "AI SaaS",
  programTitle = "정부지원사업",
}: BuildPlanInput): BudgetExecutionPlan => {
  const gov = constraints.govSupportMaxKrw;
  const selfCash = Math.round(gov * constraints.cashMatchRatio);
  const selfInKind = Math.round(gov * constraints.inKindRatio);
  const total = gov + selfCash + selfInKind;

  const itemTemplates: Record<BudgetConstraints["programKind"], BudgetLineItem[]> = {
    export: [
      {
        category: "인건비",
        plan: `[기존] 해외마케팅·영업 PM — ${programTitle} 참가 총괄`,
        govSupport: 0,
        selfCash: 0,
        selfInKind: 0,
      },
      {
        category: "인건비",
        plan: `[신규] 현지 통역·바이어 매칭·전시 운영 인력`,
        govSupport: 0,
        selfCash: 0,
        selfInKind: 0,
      },
      {
        category: "외주 용역비",
        plan: "현지 시장조사·바이어 DB·수출 컨설팅",
        govSupport: 0,
        selfCash: 0,
        selfInKind: 0,
      },
      {
        category: "광고 선전비",
        plan: "해외 전시 부스·홍보물·디지털 마케팅",
        govSupport: 0,
        selfCash: 0,
        selfInKind: 0,
      },
      {
        category: "여비",
        plan: "현지 출장·바이어 미팅·물류 샘플 발송",
        govSupport: 0,
        selfCash: 0,
        selfInKind: 0,
      },
      {
        category: "지급 수수료",
        plan: "통역·법무·현지 대행 수수료",
        govSupport: 0,
        selfCash: 0,
        selfInKind: 0,
      },
    ],
    rnd: [
      {
        category: "인건비",
        plan: `[기존] 연구책임자·ML Engineer — ${product} R&D`,
        govSupport: 0,
        selfCash: 0,
        selfInKind: 0,
      },
      {
        category: "연구 재료비",
        plan: "클라우드 GPU·데이터셋·API 사용료",
        govSupport: 0,
        selfCash: 0,
        selfInKind: 0,
      },
      {
        category: "연구 활동비",
        plan: "실증 PoC·성능 검증·벤치마크",
        govSupport: 0,
        selfCash: 0,
        selfInKind: 0,
      },
      {
        category: "외주 용역비",
        plan: "보안·품질·UX 검증 용역",
        govSupport: 0,
        selfCash: 0,
        selfInKind: 0,
      },
      {
        category: "기계장치 구매비",
        plan: "AI 학습·추론 워크스테이션",
        govSupport: 0,
        selfCash: 0,
        selfInKind: 0,
      },
    ],
    startup: [
      {
        category: "인건비",
        plan: `[기존] 대표자·핵심 인력 — ${companyName} ${product}`,
        govSupport: 0,
        selfCash: 0,
        selfInKind: 0,
      },
      {
        category: "인건비",
        plan: "[신규] AI·백엔드·PM 채용",
        govSupport: 0,
        selfCash: 0,
        selfInKind: 0,
      },
      {
        category: "외주 용역비",
        plan: "UI/UX·보안·LLM Agent 파이프라인 구축",
        govSupport: 0,
        selfCash: 0,
        selfInKind: 0,
      },
      {
        category: "광고 선전비",
        plan: "B2B 세일즈·실증·PoC 마케팅",
        govSupport: 0,
        selfCash: 0,
        selfInKind: 0,
      },
      {
        category: "지급 수수료",
        plan: "특허·인증·법무",
        govSupport: 0,
        selfCash: 0,
        selfInKind: 0,
      },
    ],
    general: [
      {
        category: "인건비",
        plan: `[기존] 사업 수행 인력 — ${programTitle}`,
        govSupport: 0,
        selfCash: 0,
        selfInKind: 0,
      },
      {
        category: "외주 용역비",
        plan: `${product} 고도화·연동 개발`,
        govSupport: 0,
        selfCash: 0,
        selfInKind: 0,
      },
      {
        category: "광고 선전비",
        plan: "사업화·고객 확보 마케팅",
        govSupport: 0,
        selfCash: 0,
        selfInKind: 0,
      },
      {
        category: "지급 수수료",
        plan: "특허·인증·컨설팅",
        govSupport: 0,
        selfCash: 0,
        selfInKind: 0,
      },
    ],
  };

  const templates = itemTemplates[constraints.programKind].filter((item) =>
    constraints.eligibleCategories.includes(item.category),
  );

  const govShares =
    constraints.programKind === "export"
      ? [0, 0.35, 0.2, 0.25, 0.12, 0.08]
      : constraints.programKind === "rnd"
        ? [0.45, 0.15, 0.12, 0.13, 0.15]
        : [0.15, 0.4, 0.25, 0.12, 0.08];

  const govAmounts = allocate(gov, govShares.slice(0, templates.length));
  const cashAmounts = allocate(selfCash, templates.map((_, index) => (index === 1 ? 2 : 1)));
  const inKindAmounts = allocate(
    selfInKind,
    templates.map((_, index) => (index === 0 ? 3 : index === 1 ? 1 : 0)),
  );

  const items = templates.map((item, index) => ({
    ...item,
    govSupport: govAmounts[index] ?? 0,
    selfCash: cashAmounts[index] ?? 0,
    selfInKind: inKindAmounts[index] ?? 0,
  }));

  return {
    summary: {
      regionLabel: constraints.regionLabel,
      totalAmount: total,
      govSupportAmount: gov,
      selfCashAmount: selfCash,
      selfInKindAmount: selfInKind,
    },
    items,
  };
};

/** @deprecated use buildBudgetExecutionPlanFromProgram */
export const buildDefaultBudgetExecutionPlan = ({
  govSupportMaxKrw = 100_000_000,
  companyName = "와우그로스(주)",
  regionLabel = "일반지역",
}: {
  govSupportMaxKrw?: number;
  companyName?: string;
  regionLabel?: string;
} = {}): BudgetExecutionPlan =>
  buildBudgetExecutionPlanFromProgram({
    constraints: {
      govSupportMaxKrw,
      cashMatchRatio: 0.1,
      inKindRatio: 0.2,
      regionLabel,
      programKind: "startup",
      eligibleCategories: ["인건비", "외주 용역비", "광고 선전비", "기계장치 구매비", "지급 수수료"],
      notes: [],
    },
    companyName,
  });

export const buildBudgetSectionContentFromProgram = (program: {
  supportAmount?: string;
  summary?: string;
  summaryHtml?: string;
  benefits?: string[];
  region?: string;
  title?: string;
  category?: string;
}, company: { name: string; product: string }): string => {
  const constraints = parseBudgetConstraintsFromProgram(program);
  const plan = buildBudgetExecutionPlanFromProgram({
    constraints,
    companyName: company.name,
    product: company.product,
    programTitle: program.title,
  });

  return [
    serializeBudgetExecutionPlan(plan),
    `■ 공고 지원한도: ${formatKrw(constraints.govSupportMaxKrw)}원 (${program.supportAmount ?? "본문 추정"})`,
    constraints.notes.length > 0 ? `■ 공고 조건: ${constraints.notes.join(" · ")}` : "",
    `■ 사업 유형: ${constraints.programKind} — ${constraints.eligibleCategories.join(", ")}`,
  ]
    .filter(Boolean)
    .join("\n");
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

export const isGenericBudgetContent = (content: string): boolean => {
  if (!content.includes(SUMMARY_PREFIX)) return true;
  const parsed = parseBudgetExecutionPlan(content);
  if (!parsed) return true;
  return (
    parsed.summary.govSupportAmount === 100_000_000 &&
    parsed.summary.totalAmount === 143_000_000 &&
    parsed.items.some((item) => item.plan.includes("GPU 워크스테이션"))
  );
};
