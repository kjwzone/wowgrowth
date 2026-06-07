import { describe, expect, it } from "vitest";
import {
  normalizeBusinessPlanContent,
  normalizeOutlineLine,
  parseDeepBlocks,
  splitPrimaryAndDeep,
} from "@/lib/business-plan-outline";

describe("business-plan-outline", () => {
  it("splits primary body from deep blocks", () => {
    const content = "■ 기업명: 와우그로스\n■ 심화 — 정합성 분석\n· 공고 부합도 검토";
    const { primary, deep } = splitPrimaryAndDeep(content);
    expect(primary).toContain("기업명");
    expect(deep).toContain("심화");
  });

  it("parses deep outline blocks", () => {
    const content = `■ 기업명: 테스트
■ 심화 — 예산·집행 상세
· 공고 지원 한도: 1억원
· 분기별 집행: Q1 인건비 40%
■ 심화 — 리스크
· 비목 전용 금지 준수`;

    const blocks = parseDeepBlocks(content);
    expect(blocks).toHaveLength(2);
    expect(blocks[0]?.title).toBe("예산·집행 상세");
    expect(blocks[0]?.items[0]).toContain("공고 지원 한도");
  });

  it("removes trailing periods and converts endings", () => {
    expect(normalizeOutlineLine("사업을 설계합니다.")).toBe("사업을 설계함");
    expect(normalizeOutlineLine("필요합니다")).toBe("필요함");
  });

  it("normalizes legacy 【심화】 headers to ■ 심화 format", () => {
    const normalized = normalizeBusinessPlanContent("【심화 — 테스트】\n· 항목입니다.");
    expect(normalized).toContain("■ 심화 — 테스트");
    expect(normalized).not.toContain(".");
  });
});
