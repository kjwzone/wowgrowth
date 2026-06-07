import {
  buildBusinessPlanDiagrams,
  type BusinessPlanDiagram,
  type DiagramContext,
} from "@/lib/business-plan-diagrams";

export type { BusinessPlanDiagram, DiagramContext };

/** @deprecated Wikimedia URL — 외부 hotlink 차단으로 SVG 다이어그램으로 대체 */
export type ReferenceImage = {
  url?: string;
  svg?: string;
  caption: string;
  source: string;
  sourceUrl?: string;
  license: string;
};

export const buildDiagramReferenceImages = (ctx: DiagramContext): ReferenceImage[] =>
  buildBusinessPlanDiagrams(ctx).map((diagram) => ({
    svg: diagram.svg,
    caption: diagram.caption,
    source: "WOW Growth AI 생성",
    license: "제안서용 인포그래픽 · 벡터 SVG",
  }));

export const selectReferenceImages = (
  programTitle: string,
  companyName = "와우그로스(주)",
  product = "AI 기반 정부지원사업 매칭·사업계획서 자동작성 SaaS",
): ReferenceImage[] =>
  buildDiagramReferenceImages({ companyName, product, programTitle });
