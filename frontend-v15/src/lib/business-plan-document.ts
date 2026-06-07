import type { BusinessPlanDraft, BusinessPlanSection } from "@/types";

export type BusinessPlanDocumentSection = {
  order: number;
  id: string;
  title: string;
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

export const buildSectionDocumentBlock = (
  section: BusinessPlanSection,
  order: number,
): BusinessPlanDocumentSection => ({
  order,
  id: section.id,
  title: section.title,
  content: section.content.trim(),
  completeness: section.completeness,
});

export const mergeDraftToDocument = (draft: BusinessPlanDraft): BusinessPlanDocument => {
  const sections = draft.sections.map((section, index) =>
    buildSectionDocumentBlock(section, index + 1),
  );

  const fullText = sections
    .map(
      (section) =>
        `${section.order}. ${section.title}\n${"─".repeat(40)}\n${section.content || "(미작성)"}`,
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
