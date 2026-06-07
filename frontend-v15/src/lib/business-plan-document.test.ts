import { describe, expect, it } from "vitest";
import { createEmptyDraft } from "@/lib/business-plan-generator";
import {
  countEmptySections,
  mergeDraftToDocument,
} from "@/lib/business-plan-document";

describe("business-plan-document", () => {
  it("merges all sections into one document with fullText", () => {
    const draft = createEmptyDraft("prog-001");
    const document = mergeDraftToDocument(draft);

    expect(document.programTitle).toContain("초기창업패키지");
    expect(document.sections).toHaveLength(draft.sections.length);
    expect(document.fullText).toContain("1. 일반현황");
    expect(document.fullText).toContain(draft.sections[0]!.content.slice(0, 20));
  });

  it("counts empty sections", () => {
    const draft = createEmptyDraft("prog-001");
    draft.sections = draft.sections.map((section, index) =>
      index === 0 ? section : { ...section, content: "" },
    );
    const document = mergeDraftToDocument(draft);

    expect(countEmptySections(document)).toBeGreaterThan(0);
  });
});
