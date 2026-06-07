import type { BusinessPlanSkillId } from "@/lib/business-plan-skill";
import type { BusinessPlanDraft, BusinessPlanSection } from "@/types";

export type BusinessPlanDocumentSection = {
  order: number;
  id: string;
  title: string;
  displayLabel: string;
  content: string;
  completeness: number;
};

export type BusinessPlanDocument = {
  programTitle: string;
  skillId: BusinessPlanDraft["skillId"];
  overallCompleteness: number;
  sections: BusinessPlanDocumentSection[];
  fullText: string;
};

const INTRO_SECTIONS: Record<BusinessPlanSkillId, readonly string[]> = {
  "business-plan-writer": ["일반현황", "창업 아이템 개요 요약", "사업비 집행 계획"],
  "gov-funding-plan": ["과제 개요"],
};

const simplifyNumberedTitle = (title: string): string => {
  const match = title.match(/^(\d+)\.\s*(.+)$/);
  if (!match) return title;

  const [, num, raw] = match;
  const label = raw
    .split("_")[0]
    ?.replace(/\s+(Problem|Solution|Scale-up|Team)\b.*/i, "")
    .trim();

  return label ? `${num}. ${label}` : title;
};

/** 통합 보기용 — 정부 양식 번호 체계 (■ 서두 · 1. 본문) */
export const formatSectionPreviewLabel = (
  title: string,
  skillId: BusinessPlanSkillId,
): string => {
  if (INTRO_SECTIONS[skillId].includes(title)) {
    return `■ ${title}`;
  }

  if (/^\d+\./.test(title)) {
    return simplifyNumberedTitle(title);
  }

  return `■ ${title}`;
};

export const buildSectionDocumentBlock = (
  section: BusinessPlanSection,
  order: number,
  skillId: BusinessPlanSkillId,
): BusinessPlanDocumentSection => ({
  order,
  id: section.id,
  title: section.title,
  displayLabel: formatSectionPreviewLabel(section.title, skillId),
  content: section.content.trim(),
  completeness: section.completeness,
});

export const mergeDraftToDocument = (draft: BusinessPlanDraft): BusinessPlanDocument => {
  const sections = draft.sections.map((section, index) =>
    buildSectionDocumentBlock(section, index + 1, draft.skillId),
  );

  const fullText = sections
    .map(
      (section) =>
        `${section.displayLabel}\n${"─".repeat(40)}\n${section.content || "(미작성)"}`,
    )
    .join("\n\n");

  return {
    programTitle: draft.programTitle,
    skillId: draft.skillId,
    overallCompleteness: draft.overallCompleteness,
    sections,
    fullText,
  };
};

export const countEmptySections = (document: BusinessPlanDocument): number =>
  document.sections.filter((section) => section.content.length < 20).length;
