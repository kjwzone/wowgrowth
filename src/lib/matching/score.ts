import type { Company } from "@/lib/types/database";
import type { SupportProgram } from "@/lib/types/database";

export type MatchScoreResult = {
  score: number;
  recommendationLevel: "high" | "medium" | "low";
  reasons: string[];
  risks: string[];
  improvementTasks: string[];
};

const levelFromScore = (score: number): MatchScoreResult["recommendationLevel"] => {
  if (score >= 70) return "high";
  if (score >= 40) return "medium";
  return "low";
};

/** MVP-1: 규칙 기반 추천점수 (AI 없음) */
export const computeMatchScore = (
  company: Pick<Company, "region" | "industry">,
  program: Pick<SupportProgram, "region" | "category" | "status">,
): MatchScoreResult => {
  let score = 50;
  const reasons: string[] = [];
  const risks: string[] = [];
  const improvementTasks: string[] = [];

  if (program.status !== "published") {
    return {
      score: 0,
      recommendationLevel: "low",
      reasons: ["공고가 게시 상태가 아닙니다."],
      risks: [],
      improvementTasks: [],
    };
  }

  if (
    program.region &&
    program.region !== "전국" &&
    company.region === program.region
  ) {
    score += 20;
    reasons.push("기업 지역이 공고 지원지역과 일치합니다.");
  } else if (program.region && program.region !== "전국") {
    score -= 10;
    risks.push("지역 조건이 일치하지 않을 수 있습니다.");
    improvementTasks.push("지원지역 요건을 다시 확인하세요.");
  }

  if (program.category && company.industry.includes(program.category)) {
    score += 15;
    reasons.push("업종/분야가 공고 카테고리와 유사합니다.");
  }

  const clamped = Math.max(0, Math.min(100, score));
  if (reasons.length === 0) {
    reasons.push("기본 조건을 기준으로 추천 점수를 산출했습니다.");
  }

  return {
    score: clamped,
    recommendationLevel: levelFromScore(clamped),
    reasons,
    risks,
    improvementTasks,
  };
};
