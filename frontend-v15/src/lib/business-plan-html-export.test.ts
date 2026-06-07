import { describe, expect, it } from "vitest";
import { createEmptyDraft } from "@/lib/business-plan-generator";
import { mergeDraftToDocument } from "@/lib/business-plan-document";
import { exportBusinessPlanHtml } from "@/lib/business-plan-html-export";
import { selectReferenceImages } from "@/lib/business-plan-reference-images";

describe("business-plan-html-export", () => {
  it("exports HTML document with tables and reference images", () => {
    const draft = createEmptyDraft("prog-001");
    const document = mergeDraftToDocument(draft);
    const images = selectReferenceImages("초기창업패키지", "창업");
    const html = exportBusinessPlanHtml(document, images);

    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("kv-table");
    expect(html).toContain("참고 이미지");
    expect(html).toContain("Wikimedia Commons");
    expect(images.length).toBe(3);
  });
});
