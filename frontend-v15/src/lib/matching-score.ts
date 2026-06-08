import type { CompanyProfile, MatchingResult, SupportProgram } from "@/types";

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

export type MatchScoreResult = {
  score: number;
  recommendationLevel: MatchingResult["level"];
  reasons: string[];
  gaps: string[];
  suggestions: string[];
};

const levelFromScore = (score: number): MatchingResult["level"] => {
  if (score >= 70) return "high";
  if (score >= 40) return "medium";
  return "low";
};

const isActiveProgram = (program: SupportProgram): boolean =>
  program.status === "모집중" || program.status === "마감임박";

const industryMatchesCategory = (industry: string, category: SupportProgram["category"]): boolean => {
  const text = industry.toLowerCase();
  if (category === "창업") {
    return /소프트|saas|it|정보|서비스|벤처|스타트/.test(text);
  }
  if (category === "R&D") {
    return /소프트|ai|연구|기술|정보|제조/.test(text);
  }
  if (category === "수출") {
    return /수출|글로벌|제조|무역/.test(text);
  }
  if (category === "스마트공장") {
    return /제조|공장|스마트|iot/.test(text);
  }
  return text.includes(category.toLowerCase());
};

const normalizeRegion = (raw: string | undefined): string => {
  const value = (raw ?? "전국").trim();
  if (!value || value === "전국" || /전국|국내\s*전체/.test(value)) return "전국";
  return REGION_TAGS.find((tag) => value.includes(tag)) ?? "전국";
};

const inferRegionFromText = (text: string): string | null => {
  const bracket = text.match(/\[([^\]]+)\]/);
  if (bracket) {
    const hit = REGION_TAGS.find((tag) => bracket[1]!.includes(tag));
    if (hit) return hit;
  }
  return REGION_TAGS.find((tag) => text.includes(tag)) ?? null;
};

export const resolveCompanyRegion = (company: CompanyProfile): string =>
  normalizeRegion(company.region);

export const resolveProgramRegion = (program: SupportProgram): string => {
  const fromField = normalizeRegion(program.region);
  if (fromField !== "전국") return fromField;
  const text = [program.title, program.agency].join(" ");
  return inferRegionFromText(text) ?? "전국";
};

const isRegionEligible = (companyRegion: string, programRegion: string): boolean =>
  programRegion === "전국" ||
  companyRegion === "전국" ||
  programRegion === companyRegion;

const programText = (program: SupportProgram): string =>
  [program.title, program.summary, program.category, ...program.target, ...program.benefits]
    .join(" ")
    .toLowerCase();

const productKeywordMatch = (company: CompanyProfile, program: SupportProgram): boolean => {
  const text = programText(program);
  const tokens = [
    company.product,
    company.industry,
    ...company.patents,
    ...company.certifications,
  ]
    .join(" ")
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((token) => token.length >= 2);

  const keywords = [...new Set(tokens)].slice(0, 12);
  return keywords.some((keyword) => text.includes(keyword));
};

/** 규칙 기반 추천 점수 — 기업마당 실시간 공고 × 기업 프로필 */
export const computeMatchScore = (
  company: CompanyProfile,
  program: SupportProgram,
): MatchScoreResult => {
  const reasons: string[] = [];
  const gaps: string[] = [];
  const suggestions: string[] = [];

  if (!isActiveProgram(program)) {
    return {
      score: 0,
      recommendationLevel: "low",
      reasons: ["모집이 마감된 공고입니다."],
      gaps: [],
      suggestions: [],
    };
  }

  const companyRegion = resolveCompanyRegion(company);
  const programRegion = resolveProgramRegion(program);

  if (!isRegionEligible(companyRegion, programRegion)) {
    return {
      score: 0,
      recommendationLevel: "low",
      reasons: [`지원지역(${programRegion})이 기업 소재지(${companyRegion})와 맞지 않습니다.`],
      gaps: [
        `${programRegion} 한정 공고 — ${companyRegion} 소재 기업은 신청 대상에서 제외될 수 있습니다.`,
      ],
      suggestions: ["소재지에 맞는 지역·전국 단위 공고를 우선 검토하세요."],
    };
  }

  let score = 48;

  if (programRegion === "전국") {
    score += 12;
    reasons.push("전국 단위 공고로 지역 제약이 적습니다.");
  } else {
    score += 18;
    reasons.push(
      `기업 소재지(${companyRegion})와 공고 지원지역(${programRegion})이 일치합니다.`,
    );
  }

  if (industryMatchesCategory(company.industry, program.category)) {
    score += 16;
    reasons.push(`${company.industry} 업종이 「${program.category}」 분야 공고와 부합합니다.`);
  } else if (program.category !== "기타") {
    gaps.push(`공고 분야(${program.category})와 업종 매칭이 약합니다.`);
    suggestions.push("사업계획서에 업종·아이템과 공고 목적의 연계성을 명시하세요.");
  }

  if (program.category === "창업" && company.certifications.some((c) => /벤처|이노/.test(c))) {
    score += 8;
    reasons.push(`${company.certifications.filter((c) => /벤처|이노/.test(c)).join(", ")} 인증 보유`);
  }

  if (program.category === "R&D" && company.patents.length > 0) {
    score += 8;
    reasons.push(`IP·특허 ${company.patents.length}건 — R&D 공고 적합도 상승`);
  }

  if (/성장|series|스케일/.test(company.stage.toLowerCase()) && program.category === "창업") {
    score += 6;
    reasons.push(`${company.stage} 단계가 창업·성장 지원 공고와 부합합니다.`);
  }

  if (company.employees >= 5) {
    score += 4;
    reasons.push(`임직원 ${company.employees}명 — 사업화·고용 계획 서술 근거 확보`);
  }

  if (productKeywordMatch(company, program)) {
    score += 10;
    reasons.push(`공고 제목·요약과 기업 아이템(${company.product.slice(0, 24)}…) 키워드 정합`);
  }

  if (program.supportAmount && program.supportAmount !== "미정") {
    suggestions.push(`지원 규모: ${program.supportAmount}`);
  }

  if (program.daysLeft >= 0 && program.daysLeft <= 14) {
    suggestions.push(`마감 D-${program.daysLeft} — ${program.title} 서류·사업계획서 준비를 서두르세요.`);
  }

  if (program.target.length > 0) {
    suggestions.push(`지원 대상: ${program.target.slice(0, 2).join(", ")}${program.target.length > 2 ? " …" : ""}`);
  } else {
    gaps.push("공고 지원 대상·자격 요건을 원문에서 확인 필요");
  }

  const clamped = Math.max(0, Math.min(100, Math.round(score)));

  if (reasons.length === 0) {
    reasons.push("기업 프로필과 공고 메타데이터 기준 기본 추천 점수를 산출했습니다.");
  }

  return {
    score: clamped,
    recommendationLevel: levelFromScore(clamped),
    reasons: reasons.slice(0, 4),
    gaps: gaps.slice(0, 3),
    suggestions: suggestions.slice(0, 3),
  };
};

export const toMatchingResult = (
  company: CompanyProfile,
  program: SupportProgram,
): MatchingResult => {
  const scored = computeMatchScore(company, program);
  return {
    programId: program.id,
    programTitle: program.title,
    agency: program.agency,
    score: scored.score,
    level: scored.recommendationLevel,
    reasons: scored.reasons,
    gaps: scored.gaps,
    suggestions: scored.suggestions,
    deadline: program.deadline,
    daysLeft: program.daysLeft,
    programStatus: program.status,
    source: program.source ?? "mock",
  };
};

export const buildMatchingResults = (
  company: CompanyProfile,
  programs: readonly SupportProgram[],
  limit = 3,
): MatchingResult[] =>
  [...programs]
    .filter(isActiveProgram)
    .map((program) => toMatchingResult(company, program))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

export const buildMatchingSummary = (results: readonly MatchingResult[]): string => {
  if (results.length === 0) {
    return "모집 중인 공고가 없거나 매칭 가능한 공고를 찾지 못했습니다. 정부지원사업 목록을 확인하세요.";
  }
  const titles = results.map((item) => item.programTitle).join(" · ");
  return `실시간 공고 ${results.length}건 기준 — ${titles}에 집중 신청을 권장합니다.`;
};
