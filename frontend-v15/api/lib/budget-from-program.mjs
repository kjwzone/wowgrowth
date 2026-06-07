const SUMMARY_PREFIX = "■ [사업비 요약]";
const ITEM_PREFIX = "■ [비목]";

const parseAmountToken = (raw) => {
  const text = String(raw).replace(/,/g, "").trim();
  const eok = text.match(/(\d+(?:\.\d+)?)\s*억/);
  if (eok) return Math.round(parseFloat(eok[1]) * 100_000_000);
  const man = text.match(/(\d+(?:\.\d+)?)\s*만/);
  if (man) return Math.round(parseFloat(man[1]) * 10_000);
  const million = text.match(/(\d+(?:\.\d+)?)\s*백만/);
  if (million) return Math.round(parseFloat(million[1]) * 1_000_000);
  const plain = text.match(/(\d+)/);
  return plain ? Number.parseInt(plain[1], 10) : 0;
};

const parseGovSupportMaxKrw = (supportAmount) => {
  if (!supportAmount || supportAmount.includes("공고")) return 0;
  return parseAmountToken(supportAmount);
};

const detectProgramKind = (text) => {
  if (/수출|해외|바이어|전시|상담회|코믹|글로벌/.test(text)) return "export";
  if (/R&D|연구|기술개발|TIPS|과학|실증|장비/.test(text)) return "rnd";
  if (/창업|스타트업|초기창업|벤처/.test(text)) return "startup";
  return "general";
};

const parseCashMatchRatio = (text) => {
  const cash = text.match(/현금\s*(\d{1,2})\s*%|(\d{1,2})\s*%\s*현금|현금\s*부담[^\d]*(\d{1,2})\s*%/);
  if (cash) return Number(cash[1] ?? cash[2] ?? cash[3]) / 100;
  const self = text.match(/자부담[^\d]*(\d{1,2})\s*%/);
  if (self) return Number(self[1]) / 100;
  return 0.1;
};

const parseInKindRatio = (text) => {
  if (/현물\s*불가|현물\s*인정\s*안|현물\s*제외/.test(text)) return 0;
  const inKind = text.match(/현물\s*(\d{1,2})\s*%/);
  if (inKind) return Number(inKind[1]) / 100;
  return 0.2;
};

const extractGovMaxFromText = (text) => {
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
      const amount = parseAmountToken(match[1]);
      if (amount >= 5_000_000) return amount;
    }
  }
  return 0;
};

export const parseBudgetConstraintsFromProgram = (program = {}) => {
  const corpus = [
    program.supportAmount,
    program.summary,
    program.summaryHtml?.replace?.(/<[^>]+>/g, " "),
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

  const eligibleCategories =
    programKind === "export"
      ? ["인건비", "외주 용역비", "광고 선전비", "여비", "지급 수수료"]
      : programKind === "rnd"
        ? ["인건비", "연구 재료비", "연구 활동비", "외주 용역비", "기계장치 구매비"]
        : ["인건비", "외주 용역비", "광고 선전비", "기계장치 구매비", "지급 수수료"];

  const notes = [];
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

const allocate = (total, ratios) => {
  const sum = ratios.reduce((acc, ratio) => acc + ratio, 0);
  const amounts = ratios.map((ratio) => Math.round((total * ratio) / sum));
  const diff = total - amounts.reduce((acc, value) => acc + value, 0);
  if (diff !== 0) amounts[0] += diff;
  return amounts;
};

const lineItemTotal = (item) => item.govSupport + item.selfCash + item.selfInKind;

export const serializeBudgetExecutionPlan = (plan) => {
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

export const buildBudgetExecutionPlanFromProgram = ({
  constraints,
  companyName = "와우그로스(주)",
  product = "AI SaaS",
  programTitle = "정부지원사업",
}) => {
  const gov = constraints.govSupportMaxKrw;
  const selfCash = Math.round(gov * constraints.cashMatchRatio);
  const selfInKind = Math.round(gov * constraints.inKindRatio);
  const total = gov + selfCash + selfInKind;

  const templatesByKind = {
    export: [
      { category: "인건비", plan: `[기존] 해외마케팅 PM — ${programTitle}` },
      { category: "인건비", plan: "[신규] 통역·바이어 매칭 인력" },
      { category: "외주 용역비", plan: "현지 시장조사·수출 컨설팅" },
      { category: "광고 선전비", plan: "전시 부스·홍보물·디지털 마케팅" },
      { category: "여비", plan: "현지 출장·바이어 미팅" },
      { category: "지급 수수료", plan: "통역·법무·대행 수수료" },
    ],
    rnd: [
      { category: "인건비", plan: `[기존] 연구책임자 — ${product}` },
      { category: "연구 재료비", plan: "GPU·데이터셋·API" },
      { category: "연구 활동비", plan: "실증 PoC·성능 검증" },
      { category: "외주 용역비", plan: "보안·품질 검증" },
      { category: "기계장치 구매비", plan: "AI 워크스테이션" },
    ],
    startup: [
      { category: "인건비", plan: `[기존] ${companyName} 핵심 인력` },
      { category: "인건비", plan: "[신규] AI·백엔드·PM" },
      { category: "외주 용역비", plan: "UI/UX·LLM Agent 구축" },
      { category: "광고 선전비", plan: "B2B 세일즈·PoC" },
      { category: "지급 수수료", plan: "특허·인증" },
    ],
    general: [
      { category: "인건비", plan: `[기존] ${programTitle} 수행 인력` },
      { category: "외주 용역비", plan: `${product} 고도화` },
      { category: "광고 선전비", plan: "사업화 마케팅" },
      { category: "지급 수수료", plan: "특허·컨설팅" },
    ],
  };

  const templates = templatesByKind[constraints.programKind].filter((item) =>
    constraints.eligibleCategories.includes(item.category),
  );

  const govShares =
    constraints.programKind === "export"
      ? [0, 0.35, 0.2, 0.25, 0.12, 0.08]
      : constraints.programKind === "rnd"
        ? [0.45, 0.15, 0.12, 0.13, 0.15]
        : [0.15, 0.4, 0.25, 0.12, 0.08];

  const govAmounts = allocate(gov, govShares.slice(0, templates.length));
  const cashAmounts = allocate(
    selfCash,
    templates.map((_, index) => (index === 1 ? 2 : 1)),
  );
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

export const buildBudgetSectionContentFromProgram = (program, company) => {
  const constraints = parseBudgetConstraintsFromProgram(program);
  const plan = buildBudgetExecutionPlanFromProgram({
    constraints,
    companyName: company?.name,
    product: company?.product,
    programTitle: program?.title,
  });

  return [
    serializeBudgetExecutionPlan(plan),
    `■ 공고 지원한도: ${constraints.govSupportMaxKrw.toLocaleString("ko-KR")}원`,
    constraints.notes.length > 0 ? `■ 공고 조건: ${constraints.notes.join(" · ")}` : "",
    `■ 사업 유형: ${constraints.programKind}`,
  ]
    .filter(Boolean)
    .join("\n");
};

export const isGenericBudgetContent = (content) => {
  if (!content.includes(SUMMARY_PREFIX)) return true;
  if (content.includes("GPU 워크스테이션") && content.includes("143000000")) return true;
  return false;
};

const mergeSection = (plan, sectionTitle, content) => ({
  ...plan,
  sections: (plan.sections ?? []).map((section) =>
    section.section_title === sectionTitle ? { ...section, content } : section,
  ),
});

export const enrichPlanBudgetFromProgram = (plan, body) => {
  const program = body?.program ?? {};
  const company = body?.company ?? { name: "와우그로스(주)", product: "AI SaaS" };
  const budgetSection = (plan.sections ?? []).find((s) =>
    (s.section_title ?? "").includes("사업비"),
  );
  if (!budgetSection) return plan;

  const content = budgetSection.content ?? "";
  if (!isGenericBudgetContent(content) && content.includes(SUMMARY_PREFIX)) {
    return plan;
  }

  const enriched = buildBudgetSectionContentFromProgram(program, company);
  return mergeSection(plan, budgetSection.section_title, enriched);
};

export const buildBudgetConstraintsForPrompt = (program) =>
  parseBudgetConstraintsFromProgram(program ?? {});
