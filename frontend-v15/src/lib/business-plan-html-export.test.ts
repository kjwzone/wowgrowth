import { describe, expect, it } from "vitest";
import { createEmptyDraft } from "@/lib/business-plan-generator";
import { mergeDraftToDocument } from "@/lib/business-plan-document";
import { exportBusinessPlanHtml } from "@/lib/business-plan-html-export";
import { selectReferenceImages } from "@/lib/business-plan-reference-images";

describe("business-plan-html-export", () => {
  it("exports TAM/SAM/SOM concentric diagram from 목표 시장 table for growth strategy", () => {
    const draft = createEmptyDraft("prog-001");
    const growthSection = draft.sections.find((s) => s.title.includes("성장전략"));
    if (growthSection) {
      growthSection.content = [
        "■ 목표 시장 및 고객 분석",
        "| 시장 구분 | 규모(시장 금액) | 산출 근거 |",
        "| TAM (전체시장) | 약 6조원 | 전체 시장 규모 |",
        "| SAM (유효시장) | 약 8,400억원 | 도달 가능 세그먼트 |",
        "| SOM (수익시장) | 약 2,400억원 | Bottom-up 산출 |",
      ].join("\n");
    }
    const document = mergeDraftToDocument(draft);
    const html = exportBusinessPlanHtml(document, []);

    expect(html).toContain("tam-diagram");
    expect(html).toContain("전체 가용 시장");
    expect(html).toContain("유효 가용 시장");
    expect(html).toContain("수익 가능 시장");
    expect(html).toContain('viewBox="0 0 280 160"');
    expect(html).toContain("약 6조원");
  });
  it("exports budget execution plan tables for 사업비 section", () => {
    const draft = createEmptyDraft("prog-001");
    const budgetSection = draft.sections.find((s) => s.title.includes("사업비"));
    if (budgetSection) {
      budgetSection.content =
        "■ [사업비 요약] 일반지역|143000000|100000000|14000000|29000000\n■ [비목] 인건비|대표자 인건비|0|0|29000000|29000000";
    }
    const document = mergeDraftToDocument(draft);
    const html = exportBusinessPlanHtml(document, []);

    expect(html).toContain("budget-plan");
    expect(html).toContain("사업비 집행 계획");
    expect(html).toContain("정부지원사업비");
  });

  it("exports deep outline blocks in HTML", () => {
    const draft = createEmptyDraft("prog-001");
    const section = draft.sections.find((s) => s.title === "일반현황");
    if (section) {
      section.content = "■ 기업명: 테스트\n■ 심화 — 정합성\n· 공고 부합도 검토";
    }
    const document = mergeDraftToDocument(draft);
    const html = exportBusinessPlanHtml(document, []);
    expect(html).toContain("deep-outline");
    expect(html).toContain("■ 심화 — 정합성");
  });

  it("exports HTML document with tables and reference images", () => {
    const draft = createEmptyDraft("prog-001");
    const document = mergeDraftToDocument(draft);
    const images = selectReferenceImages("초기창업패키지", "와우그로스(주)", "AI SaaS");
    const html = exportBusinessPlanHtml(document, images);

    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("kv-table");
    expect(html).toContain("참고 이미지");
    expect(html).toContain("BM 구성도");
    expect(html).toContain("<svg");
    expect(images.length).toBe(3);
  });
});
