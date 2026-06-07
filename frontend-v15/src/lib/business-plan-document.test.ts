import { describe, expect, it } from "vitest";
import { createEmptyDraft } from "@/lib/business-plan-generator";
import {
  countEmptySections,
  formatSectionPreviewLabel,
  mergeDraftToDocument,
} from "@/lib/business-plan-document";

describe("business-plan-document", () => {
  it("formats startup-package preview labels with ■ and numbered body sections", () => {
    expect(formatSectionPreviewLabel("일반현황", "business-plan-writer")).toBe("■ 일반현황");
    expect(formatSectionPreviewLabel("창업 아이템 개요 요약", "business-plan-writer")).toBe(
      "■ 창업 아이템 개요 요약",
    );
    expect(
      formatSectionPreviewLabel(
        "1. 문제 인식 Problem_창업 아이템의 필요성",
        "business-plan-writer",
      ),
    ).toBe("1. 문제 인식");
    expect(
      formatSectionPreviewLabel(
        "3. 성장전략 Scale-up_사업화 추진 전략",
        "business-plan-writer",
      ),
    ).toBe("3. 성장전략");
    expect(formatSectionPreviewLabel("사업비 집행 계획", "business-plan-writer")).toBe(
      "■ 사업비 집행 계획",
    );
  });

  it("merges all sections into one document with fullText", () => {
    const draft = createEmptyDraft("prog-001");
    const document = mergeDraftToDocument(draft);

    expect(document.programTitle).toContain("초기창업패키지");
    expect(document.sections).toHaveLength(draft.sections.length);
    expect(document.sections[0]?.displayLabel).toBe("■ 일반현황");
    expect(document.sections[2]?.displayLabel).toBe("1. 문제 인식");
    expect(document.fullText).toContain("■ 일반현황");
    expect(document.fullText).not.toContain("3. 1. 문제");
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
