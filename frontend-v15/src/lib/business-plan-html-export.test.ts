import { describe, expect, it } from "vitest";
import { createEmptyDraft } from "@/lib/business-plan-generator";
import { mergeDraftToDocument } from "@/lib/business-plan-document";
import { exportBusinessPlanHtml } from "@/lib/business-plan-html-export";
import { selectReferenceImages } from "@/lib/business-plan-reference-images";

describe("business-plan-html-export", () => {
  it("exports TAM/SAM/SOM concentric diagram in Korean for growth strategy", () => {
    const draft = createEmptyDraft("prog-001");
    const growthSection = draft.sections.find((s) => s.title.includes("성장전략"));
    if (growthSection) {
      growthSection.content =
        "■ TAM/SAM/SOM: 국내 중소·벤처 약 400만社 / 정부지원 수요 50만社 / 1차 목표 5,000社\n- GTM: 온라인·파트너·세일즈";
    }
    const document = mergeDraftToDocument(draft);
    const html = exportBusinessPlanHtml(document, []);

    expect(html).toContain("tam-diagram");
    expect(html).toContain("전체 가용 시장");
    expect(html).toContain("유효 가용 시장");
    expect(html).toContain("수익 가능 시장");
    expect(html).toContain('viewBox="0 0 280 160"');
  });
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
