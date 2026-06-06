import { describe, expect, it } from "vitest";
import {
  completePipeline,
  createEmptyDraft,
  generateSectionContent,
} from "@/lib/business-plan-generator";
import { STARTUP_PACKAGE_SECTION_TITLES } from "@/lib/business-plan-sections";

describe("business-plan-generator", () => {
  it("uses startup-package section titles for 창업패키지", () => {
    const draft = createEmptyDraft("prog-001");
    expect(draft.skillId).toBe("business-plan-writer");
    expect(draft.sections.map((s) => s.title)).toEqual([
      ...STARTUP_PACKAGE_SECTION_TITLES,
    ]);
  });

  it("uses gov-funding skill for R&D program", () => {
    const draft = createEmptyDraft("prog-002");
    expect(draft.skillId).toBe("gov-funding-plan");
    expect(draft.sections.length).toBeGreaterThan(0);
  });

  it("generates section content via plan-writer templates", () => {
    const draft = createEmptyDraft("prog-001");
    const emptySection = draft.sections.find(
      (s) => s.title === "4. 팀 구성 Team_대표자 및 팀원 구성 계획",
    );
    expect(emptySection).toBeDefined();

    const updated = generateSectionContent(draft, emptySection!.id);
    const section = updated.sections.find((s) => s.id === emptySection!.id);
    expect(section?.content).toContain("대표");
    expect(section?.completeness).toBeGreaterThan(50);
  });

  it("completes full pipeline with all sections filled", () => {
    const draft = completePipeline(createEmptyDraft("prog-001"));
    expect(draft.pipelineSteps?.every((s) => s.status === "done")).toBe(true);
    expect(draft.sections.every((s) => s.content.length > 20)).toBe(true);
    expect(draft.status).toBe("review");
  });
});
