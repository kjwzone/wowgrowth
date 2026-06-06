/** @see src/lib/ai/business-plan-skill.ts · AGENTS.md */

export type BusinessPlanSkillId = "business-plan-writer" | "gov-funding-plan";

export const BUSINESS_PLAN_SKILL_LABELS: Record<BusinessPlanSkillId, string> = {
  "business-plan-writer": "Business Plan Writer",
  "gov-funding-plan": "Gov Funding Plan",
};

export const PROMPT_VERSION = "v2-startup-package";

const RND_PROGRAM_PATTERN =
  /TIPS|R&D|연구개발|기술개발|창업성장기술|중소기업\s*기술|과학기술|정부출연|이노비즈/i;

export const selectBusinessPlanSkill = (program: {
  title?: string;
  category?: string;
  agency?: string;
}): BusinessPlanSkillId => {
  const haystack = `${program.title ?? ""} ${program.category ?? ""} ${program.agency ?? ""}`;
  return RND_PROGRAM_PATTERN.test(haystack)
    ? "gov-funding-plan"
    : "business-plan-writer";
};

export type PipelineAgentStep = {
  id: string;
  agent: string;
  label: string;
};

export const BUSINESS_PLAN_WRITER_PIPELINE: PipelineAgentStep[] = [
  { id: "announcement", agent: "announcement-analyst", label: "공고 분석" },
  { id: "plan", agent: "plan-writer", label: "사업계획서 작성" },
  { id: "budget", agent: "budget-designer", label: "예산 편성" },
  { id: "compliance", agent: "compliance-checker", label: "규정 준수 검증" },
  { id: "submission", agent: "submission-verifier", label: "제출 검증" },
];

export const GOV_FUNDING_PIPELINE: PipelineAgentStep[] = [
  { id: "announcement", agent: "announcement-analyst", label: "공고 분석" },
  { id: "tech", agent: "tech-writer", label: "기술성 작성" },
  { id: "biz", agent: "biz-writer", label: "사업성 작성" },
  { id: "budget", agent: "budget-planner", label: "예산 편성" },
  { id: "review", agent: "submission-reviewer", label: "제출 검증" },
];

export const getPipelineForSkill = (
  skillId: BusinessPlanSkillId,
): PipelineAgentStep[] =>
  skillId === "gov-funding-plan"
    ? GOV_FUNDING_PIPELINE
    : BUSINESS_PLAN_WRITER_PIPELINE;
