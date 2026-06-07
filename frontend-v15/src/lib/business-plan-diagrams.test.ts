import { describe, expect, it } from "vitest";
import {
  buildBmDiagramSvg,
  buildBusinessPlanDiagrams,
  buildMvpPreviewSvg,
  buildSystemDiagramSvg,
} from "@/lib/business-plan-diagrams";

const ctx = {
  companyName: "와우그로스(주)",
  product: "AI SaaS",
  programTitle: "2026 수출바우처",
};

describe("business-plan-diagrams", () => {
  it("builds three SVG diagrams with Korean labels", () => {
    const diagrams = buildBusinessPlanDiagrams(ctx);
    expect(diagrams).toHaveLength(3);
    expect(diagrams.map((d) => d.id)).toEqual(["bm", "system", "mvp"]);
    for (const diagram of diagrams) {
      expect(diagram.svg).toContain("<svg");
      expect(diagram.svg).toContain("#0040e0");
      expect(diagram.svg).toContain("font-family");
    }
  });

  it("includes BM and system titles", () => {
    expect(buildBmDiagramSvg(ctx)).toContain("BM 구성도");
    expect(buildSystemDiagramSvg(ctx)).toContain("시스템 구성도");
    expect(buildMvpPreviewSvg(ctx)).toContain("MVP 예상");
  });
});
