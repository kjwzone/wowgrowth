import { describe, expect, it } from "vitest";
import { createEmptyDraft } from "@/lib/business-plan-generator";
import {
  hasFormBlocks,
  parseFormBlocks,
} from "@/lib/business-plan-form-blocks";

describe("business-plan-form-blocks", () => {
  it("parses ■ headings, tables, and bullets", () => {
    const content = [
      "■ 선행 개발 실적",
      "| 연도 | 거래처 | 매출액 |",
      "| --- | --- | --- |",
      "| 2025 | A사 | 100 |",
      "■ 활용 계획",
      "1) 기술적 측면 — 통합",
      "○ 세부 근거",
    ].join("\n");

    const blocks = parseFormBlocks(content);
    expect(blocks).toHaveLength(2);
    expect(blocks[0]?.title).toBe("선행 개발 실적");
    const table = blocks[0]?.items[0];
    expect(table?.kind).toBe("table");
    if (table?.kind === "table") {
      expect(table.table.columns).toEqual(["연도", "거래처", "매출액"]);
      expect(table.table.rows).toEqual([["2025", "A사", "100"]]);
    }
    expect(blocks[1]?.items[0]).toMatchObject({ kind: "bullet", level: 1 });
    expect(blocks[1]?.items[1]).toMatchObject({ kind: "bullet", level: 2 });
  });

  it("ignores 심화 deep blocks", () => {
    const content = ["■ 선행 개발 실적", "| a | b |", "■ 심화 — 보강", "· 추가"].join(
      "\n",
    );
    const blocks = parseFormBlocks(content);
    expect(blocks.map((b) => b.title)).toEqual(["선행 개발 실적"]);
  });

  it("generated 실현 가능성 section contains required form blocks", () => {
    const draft = createEmptyDraft("prog-001");
    const solution = draft.sections.find((s) => s.title.includes("실현 가능성"));
    expect(solution).toBeDefined();
    const content = solution!.content;

    expect(hasFormBlocks(content)).toBe(true);
    const titles = parseFormBlocks(content).map((b) => b.title);
    expect(titles).toContain("선행 개발 실적");
    expect(titles).toContain("지식재산권 확보 현황");
    expect(titles.some((t) => t.includes("활용 계획"))).toBe(true);
    expect(titles.some((t) => t.includes("세부 개발"))).toBe(true);
    expect(titles.some((t) => t.includes("경쟁기술"))).toBe(true);
    expect(titles.some((t) => t.includes("사업 추진 일정"))).toBe(true);
  });

  it("generated 문제 인식 section contains 문제점/필요성 blocks", () => {
    const draft = createEmptyDraft("prog-001");
    const problem = draft.sections.find((s) => s.title.includes("문제 인식"));
    const titles = parseFormBlocks(problem!.content).map((b) => b.title);
    expect(titles.some((t) => t.includes("문제점"))).toBe(true);
    expect(titles.some((t) => t.includes("필요성"))).toBe(true);
  });
});
