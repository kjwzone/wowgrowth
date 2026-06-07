import { sectionIdFromTitle } from "@/lib/business-plan-sections";
import { selectBusinessPlanSkill, PROMPT_VERSION } from "@/lib/business-plan-skill";
import type {
  BusinessPlanDraft,
  BusinessPlanSection,
  PipelineStep,
  SupportProgram,
} from "@/types";

export type ApiBusinessPlan = {
  title: string;
  premises?: string;
  sections: { section_title: string; content: string }[];
  self_verification?: { item: string; result: string; notes?: string }[];
  key_risks?: string[];
  evidence_checklist?: string[];
};

export type ApiVerifyResult = {
  ok: boolean;
  checklist: { item: string; passed: boolean; message: string }[];
  blocking_issues?: string[];
  self_verification?: ApiBusinessPlan["self_verification"];
};

const sectionCompleteness = (content: string): number => {
  if (content.length > 400) return 95;
  if (content.length > 200) return 90;
  if (content.length > 80) return 85;
  if (content.length > 20) return 55;
  return 20;
};

export const adaptApiPlanToDraft = (
  plan: ApiBusinessPlan,
  params: {
    programId: string;
    program: SupportProgram;
    pipelineSteps?: PipelineStep[];
    model?: string;
  },
): BusinessPlanDraft => {
  const skillId = selectBusinessPlanSkill(params.program);
  const sections: BusinessPlanSection[] = plan.sections.map((section) => ({
    id: sectionIdFromTitle(section.section_title),
    title: section.section_title,
    content: section.content,
    completeness: sectionCompleteness(section.content),
  }));

  const overallCompleteness =
    sections.length === 0
      ? 0
      : Math.round(
          sections.reduce((sum, section) => sum + section.completeness, 0) /
            sections.length,
        );

  return {
    id: `ai-${params.programId}`,
    programId: params.programId,
    programTitle: params.program.title,
    skillId,
    promptVersion: PROMPT_VERSION,
    pipelineSteps: params.pipelineSteps,
    sections,
    overallCompleteness,
    status: "review",
    verification: plan.self_verification,
    keyRisks: plan.key_risks,
    evidenceChecklist: plan.evidence_checklist,
    aiModel: params.model,
    planTitle: plan.title,
    premises: plan.premises,
  };
};

export const draftToApiPlan = (draft: BusinessPlanDraft): ApiBusinessPlan => ({
  title: draft.planTitle ?? draft.programTitle,
  premises: draft.premises,
  sections: draft.sections.map((section) => ({
    section_title: section.title,
    content: section.content,
  })),
  self_verification: draft.verification,
  key_risks: draft.keyRisks,
  evidence_checklist: draft.evidenceChecklist,
});

export const mergeSectionIntoDraft = (
  draft: BusinessPlanDraft,
  sectionTitle: string,
  content: string,
): BusinessPlanDraft => {
  const sections = draft.sections.map((section) =>
    section.title === sectionTitle
      ? { ...section, content, completeness: sectionCompleteness(content) }
      : section,
  );
  const overallCompleteness = Math.round(
    sections.reduce((sum, s) => sum + s.completeness, 0) / sections.length,
  );
  return { ...draft, sections, overallCompleteness, status: "review" };
};

export const pipelineStepsFromApiStages = (
  stages: { stage: string; label: string; status: string }[],
  skillId: BusinessPlanDraft["skillId"],
): PipelineStep[] => {
  const agentMap: Record<string, string> =
    skillId === "gov-funding-plan"
      ? {
          generate: "plan-writer",
          announcement: "announcement-analyst",
          plan: "tech-writer",
          budget: "budget-planner",
          compliance: "submission-reviewer",
          submission: "submission-reviewer",
        }
      : {
          generate: "plan-writer",
          announcement: "announcement-analyst",
          plan: "plan-writer",
          budget: "budget-designer",
          compliance: "compliance-checker",
          submission: "submission-verifier",
        };

  return stages.map((stage) => ({
    id: stage.stage,
    agent: agentMap[stage.stage] ?? stage.stage,
    label: stage.label,
    status: stage.status === "done" ? "done" : stage.status === "running" ? "running" : "pending",
  }));
};
