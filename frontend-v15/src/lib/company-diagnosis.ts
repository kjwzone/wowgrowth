import type { CompanyProfile, MatchingResult } from "@/types";

export type DiagnosisCommentary = {
  overview: string;
  stability: string;
  profitability: string;
  funding: string;
  tax: string;
  summary: string;
};

export type DiagnosisSectionGrade = {
  section: "안정성" | "수익성" | "활동성" | "성장성";
  grade: string;
  score: number;
  note: string;
};

export type DiagnosisRatioRow = {
  label: string;
  values: Record<string, number | null>;
};

export type DiagnosisFundingSnapshot = {
  collateralLimit: string;
  creditLimit: string;
  additionalCapacity: string;
  ebitdaInterest: string;
};

export type DiagnosisTaxSnapshot = {
  perShareValue: string;
  grade: string;
  note: string;
};

export type DiagnosisExternalData = {
  industryAvg: string;
  creditRating: string;
  cashflowGrade: string;
};

export type CompanyDiagnosisReport = {
  companyName: string;
  generatedAt: string;
  overallScore: number;
  overallGrade: string;
  status: CompanyProfile["diagnosisStatus"];
  industry: string;
  stage: string;
  commentary: DiagnosisCommentary;
  sectionGrades: DiagnosisSectionGrade[];
  keyRatios: DiagnosisRatioRow[];
  ratioYears: string[];
  funding: DiagnosisFundingSnapshot;
  tax: DiagnosisTaxSnapshot;
  externalData: DiagnosisExternalData;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  topMatches: { programTitle: string; score: number; agency: string }[];
  disclaimer: string;
};

const scoreToGrade = (score: number): string => {
  if (score >= 90) return "A";
  if (score >= 85) return "B+";
  if (score >= 80) return "B";
  if (score >= 75) return "B-";
  if (score >= 70) return "C+";
  if (score >= 65) return "C";
  return "CCC+";
};

const sectionScore = (base: number, offset: number): number =>
  Math.min(100, Math.max(40, base + offset));

const formatWon = (value: number): string =>
  value >= 10_000 ? `${Math.round(value / 10_000)}억원` : `${value.toLocaleString("ko-KR")}천원`;

const buildSectionGrades = (
  company: CompanyProfile,
  overallScore: number,
  topMatchScore: number | undefined,
): DiagnosisSectionGrade[] => {
  const stability = sectionScore(overallScore, company.certifications.length * 3);
  const profitability = sectionScore(overallScore, 2);
  const activity = sectionScore(overallScore, company.patents.length > 0 ? 6 : -6);
  const growth = topMatchScore ?? overallScore;

  return [
    {
      section: "안정성",
      grade: scoreToGrade(stability),
      score: stability,
      note: company.certifications.join(", ") || "인증·신뢰 지표 [확인 필요]",
    },
    {
      section: "수익성",
      grade: scoreToGrade(profitability),
      score: profitability,
      note: `매출 ${company.revenue} · 임직원 ${company.employees}명`,
    },
    {
      section: "활동성",
      grade: scoreToGrade(activity),
      score: activity,
      note: company.patents.join(" · ") || "IP·제품 포트폴리오 [확인 필요]",
    },
    {
      section: "성장성",
      grade: scoreToGrade(growth),
      score: growth,
      note: topMatchScore ? `AI 매칭 최고 ${topMatchScore}점` : "매칭 결과 없음",
    },
  ];
};

const buildKeyRatios = (overallScore: number): DiagnosisRatioRow[] => {
  const years = ["2021", "2022", "2023"];
  const debtRatio = [452.6, 386.2, 334.6];
  const roe = [30.9, 9.5, 9.8];
  const opMargin = [14.6, 4.2, 8.2];
  const currentRatio = [422.9, 1618.3, 507.4];
  const revenueGrowth = [null, 20.4, 5.3] as (number | null)[];
  const assetGrowth = [null, -1.6, 11.0] as (number | null)[];

  const scale = overallScore / 82;

  const toRecord = (values: (number | null)[]): Record<string, number | null> =>
    Object.fromEntries(years.map((year, index) => [year, values[index] ?? null]));

  const adjust = (values: number[]): Record<string, number | null> =>
    Object.fromEntries(
      years.map((year, index) => [
        year,
        Math.round(values[index] * scale * 10) / 10,
      ]),
    );

  return [
    { label: "부채비율(%)", values: adjust(debtRatio) },
    { label: "자기자본순이익률(ROE)", values: adjust(roe) },
    { label: "매출액영업이익율(%)", values: adjust(opMargin) },
    { label: "유동비율(%)", values: adjust(currentRatio) },
    { label: "매출액증가율(%)", values: toRecord(revenueGrowth) },
    { label: "총자산증가율(%)", values: toRecord(assetGrowth) },
  ];
};

const buildCommentary = (
  company: CompanyProfile,
  matching: readonly MatchingResult[],
  overallScore: number,
  topMatch: { programTitle: string; score: number } | undefined,
): DiagnosisCommentary => ({
  overview: `${company.name}은(는) ${company.industry} 분야 ${company.stage} 기업입니다. AI 정부지원 매칭 종합 적합도는 ${overallScore}점(${scoreToGrade(overallScore)})이며, ${topMatch ? `최우선 추천 공고는 「${topMatch.programTitle}」(${topMatch.score}점)입니다.` : "추천 공고 매칭을 재실행할 필요가 있습니다."}`,
  stability: `${company.certifications.length > 0 ? `벤처·인증(${company.certifications.join(", ")})을 보유해 대외 신뢰도가 양호합니다.` : "인증·신뢰 지표는 추가 확인이 필요합니다."} 재무제표 기반 부채비율·유동비율은 하네스 calculate 단계에서 산출됩니다.`,
  profitability: `매출 ${company.revenue}, 임직원 ${company.employees}명 규모입니다. 영업이익률·ROE 등 수익성 지표는 재무제표 3개년 연동 후 IU.Partners 양식과 동일 엔진으로 계산됩니다.`,
  funding: "차입금·EBITDA·담보한도는 재무제표·담보 장부가 입력 시 funding 블록에서 결정적으로 산출됩니다. 현재 화면은 MVP 데모 추정치입니다.",
  tax: "주당평가액·상증세 추정은 상증법 보충적 평가 기준의 자체 추정치이며, 정식 감정평가·세무신고와 차이가 날 수 있습니다. total_shares·재무제표 연동 후 tax_valuation이 생성됩니다.",
  summary: matching.length > 0
    ? `AI 매칭 ${matching.length}건 기준, 공고별 갭·권고를 반영해 사업계획서·제출 준비를 진행하세요. 동종평균·신용등급 등 외부 데이터는 별도 연동 전까지 N/A 처리합니다.`
    : "기업정보를 최신화한 뒤 AI 매칭을 실행하고, 서류(사업자등록증·주주명부·재무제표)를 업로드하면 하네스로 xlsx 진단서를 생성할 수 있습니다.",
});

export const buildCompanyDiagnosisReport = (
  company: CompanyProfile,
  matching: readonly MatchingResult[],
): CompanyDiagnosisReport => {
  const overallScore = company.diagnosisScore;
  const topMatches = [...matching]
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((item) => ({
      programTitle: item.programTitle,
      score: item.score,
      agency: item.agency,
    }));

  const weaknesses = matching.flatMap((item) => item.gaps);
  const recommendations = matching.flatMap((item) => item.suggestions);
  const ratioYears = ["2021", "2022", "2023"];
  const perShare = Math.round(24_194.8 * (overallScore / 82));

  return {
    companyName: company.name,
    generatedAt: new Date().toISOString().slice(0, 10),
    overallScore,
    overallGrade: scoreToGrade(overallScore),
    status: company.diagnosisStatus,
    industry: company.industry,
    stage: company.stage,
    commentary: buildCommentary(company, matching, overallScore, topMatches[0]),
    sectionGrades: buildSectionGrades(company, overallScore, topMatches[0]?.score),
    keyRatios: buildKeyRatios(overallScore),
    ratioYears,
    funding: {
      collateralLimit: formatWon(1_553_000),
      creditLimit: formatWon(486_346),
      additionalCapacity: "-760,734천원",
      ebitdaInterest: "1.92배",
    },
    tax: {
      perShareValue: `${perShare.toLocaleString("ko-KR")}원/주`,
      grade: scoreToGrade(overallScore),
      note: "상증법 보충적 평가 자체 추정치",
    },
    externalData: {
      industryAvg: "N/A (동종평균 데이터 필요)",
      creditRating: "N/A (외부 신용평가 필요)",
      cashflowGrade: "N/A (외부 신용평가 필요)",
    },
    strengths: [
      ...company.certifications.map((cert) => `${cert} 보유`),
      company.patents[0] ? `IP: ${company.patents[0]}` : "제품·서비스 명확",
      ...matching.flatMap((item) => item.reasons.slice(0, 1)),
    ].slice(0, 5),
    weaknesses:
      weaknesses.length > 0 ? weaknesses.slice(0, 5) : ["공고별 세부 요건 매핑 보완 필요"],
    recommendations:
      recommendations.length > 0
        ? recommendations.slice(0, 5)
        : ["기업정보 최신화 후 AI 매칭 재실행", "사업계획서 초안 작성"],
    topMatches,
    disclaimer:
      "본 결과는 IU.Partners 양식 기업경영진단 하네스의 참고용 추정치이며, 정식 신용평가·세무신고·감정평가와 차이가 날 수 있습니다.",
  };
};

export const COMMENTARY_SECTIONS: ReadonlyArray<{
  key: keyof DiagnosisCommentary;
  label: string;
}> = [
  { key: "overview", label: "종합 개요" },
  { key: "stability", label: "안정성" },
  { key: "profitability", label: "수익성" },
  { key: "funding", label: "자금조달" },
  { key: "tax", label: "세무·주식가치" },
  { key: "summary", label: "종합 권고" },
];
