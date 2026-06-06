/**
 * 사업계획서 초안 작성 — Cursor Agent Skill 정책
 * @see AGENTS.md
 * @see .cursor/skills/business-plan-writer/SKILL.md
 * @see .cursor/skills/gov-funding-plan/SKILL.md
 */

export type BusinessPlanSkillId = "business-plan-writer" | "gov-funding-plan";

export const BUSINESS_PLAN_SKILL_PATHS: Record<BusinessPlanSkillId, string> = {
  "business-plan-writer": ".cursor/skills/business-plan-writer/SKILL.md",
  "gov-funding-plan": ".cursor/skills/gov-funding-plan/SKILL.md",
};

export const BUSINESS_PLAN_WORKSPACE_PATHS: Record<BusinessPlanSkillId, string> = {
  "business-plan-writer": "_workspace/business-plan",
  "gov-funding-plan": "_workspace/gov-funding-plan",
};

const RND_PROGRAM_PATTERN =
  /TIPS|R&D|연구개발|기술개발|창업성장기술|중소기업\s*기술|과학기술|정부출연|이노비즈/i;

export const selectBusinessPlanSkill = (program: {
  title?: string;
  category?: string | null;
  agency?: string;
}): BusinessPlanSkillId => {
  const haystack = `${program.title ?? ""} ${program.category ?? ""} ${program.agency ?? ""}`;
  return RND_PROGRAM_PATTERN.test(haystack)
    ? "gov-funding-plan"
    : "business-plan-writer";
};

export const isGovFundingSkill = (skillId: BusinessPlanSkillId): boolean =>
  skillId === "gov-funding-plan";
