import type { CompanyProfile, MatchingResult } from "@/types";

export type DiagnosisDimension = {
  label: string;
  score: number;
  note: string;
};

export type CompanyDiagnosisReport = {
  companyName: string;
  generatedAt: string;
  overallScore: number;
  status: CompanyProfile["diagnosisStatus"];
  summary: string;
  dimensions: DiagnosisDimension[];
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  topMatches: { programTitle: string; score: number; agency: string }[];
};

const dimensionScore = (base: number, offset: number): number =>
  Math.min(100, Math.max(40, base + offset));

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

  return {
    companyName: company.name,
    generatedAt: new Date().toISOString().slice(0, 10),
    overallScore,
    status: company.diagnosisStatus,
    summary: `${company.name}은(는) ${company.industry} 분야 ${company.stage} 기업으로, AI 정부지원 매칭 적합도 ${overallScore}점 수준입니다`,
    dimensions: [
      {
        label: "기술·IP",
        score: dimensionScore(overallScore, company.patents.length > 0 ? 6 : -8),
        note: company.patents.join(" · ") || "특허·IP 등록 [확인 필요]",
      },
      {
        label: "재무·성장",
        score: dimensionScore(overallScore, 2),
        note: `매출 ${company.revenue} · 임직원 ${company.employees}명`,
      },
      {
        label: "인증·신뢰",
        score: dimensionScore(overallScore, company.certifications.length * 3),
        note: company.certifications.join(", "),
      },
      {
        label: "공고 적합도",
        score: topMatches[0]?.score ?? overallScore,
        note: topMatches[0]
          ? `최우선 ${topMatches[0].programTitle} (${topMatches[0].score}점)`
          : "매칭 결과 없음",
      },
    ],
    strengths: [
      ...company.certifications.map((cert) => `${cert} 보유`),
      company.patents[0] ? `IP: ${company.patents[0]}` : "제품·서비스 명확",
      ...matching.flatMap((item) => item.reasons.slice(0, 1)),
    ].slice(0, 5),
    weaknesses: weaknesses.length > 0 ? weaknesses.slice(0, 5) : ["공고별 세부 요건 매핑 보완 필요"],
    recommendations:
      recommendations.length > 0
        ? recommendations.slice(0, 5)
        : ["기업정보 최신화 후 AI 매칭 재실행", "사업계획서 초안 작성"],
    topMatches,
  };
};
