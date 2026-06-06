import type { BusinessPlanSkillId } from "@/lib/business-plan-skill";

/** @see src/lib/ai/prompts/startup-package-plan-instructions.ts */
export const STARTUP_PACKAGE_SECTION_TITLES = [
  "일반현황",
  "창업 아이템 개요 요약",
  "1. 문제 인식 Problem_창업 아이템의 필요성",
  "2. 실현 가능성 Solution_창업 아이템의 개발 계획",
  "사업비 집행 계획",
  "3. 성장전략 Scale-up_사업화 추진 전략",
  "4. 팀 구성 Team_대표자 및 팀원 구성 계획",
] as const;

export const GOV_FUNDING_SECTION_TITLES = [
  "과제 개요",
  "1. 기술개발 목표 및 필요성",
  "2. 기술개발 내용 및 방법론",
  "3. 기술성·차별성",
  "4. 사업화 전략 및 시장성",
  "5. 추진체계 및 일정",
  "6. 사업비 편성 및 집행계획",
] as const;

export const getSectionTitlesForSkill = (
  skillId: BusinessPlanSkillId,
): readonly string[] =>
  skillId === "gov-funding-plan"
    ? GOV_FUNDING_SECTION_TITLES
    : STARTUP_PACKAGE_SECTION_TITLES;

export const sectionIdFromTitle = (title: string): string =>
  title
    .replace(/[^\w가-힣]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase()
    .slice(0, 48);
