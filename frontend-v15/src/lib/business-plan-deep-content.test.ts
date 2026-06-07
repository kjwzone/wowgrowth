import { describe, expect, it } from "vitest";
import {
  buildDeepSectionExtras,
  deepSectionCompleteness,
  mergeDeepContent,
} from "@/lib/business-plan-deep-content";

describe("business-plan-deep-content", () => {
  it("merges basic content with deep extras in outline format", () => {
    const merged = mergeDeepContent("기본 내용", ["■ 심화 — 테스트", "· 추가 분석"]);
    expect(merged).toContain("기본 내용");
    expect(merged).toContain("■ 심화 — 테스트");
    expect(merged).not.toContain(".");
  });

  it("builds program-aware deep extras", () => {
    const extras = buildDeepSectionExtras("일반현황", "business-plan-writer", {
      company: {
        name: "와우그로스(주)",
        industry: "SW",
        product: "AI SaaS",
        stage: "성장",
        employees: 12,
        revenue: "5억",
        certifications: ["벤처"],
        patents: ["특허1"],
      },
      program: {
        id: "bizinfo-1",
        title: "뉴욕 코믹콘",
        agency: "KOCCA",
        category: "수출",
        region: "전국",
        supportAmount: "공고 확인",
        deadline: "2026-06-17",
        daysLeft: 11,
        matchScore: null,
        status: "모집중",
        summary: "요약",
        target: ["중소기업"],
        benefits: ["공동관"],
        period: "2026-06-04 ~ 2026-06-17",
        documents: ["신청서.hwp"],
        aiFitAnalysis: "",
        strategyTip: "온라인 접수",
      },
    });

    expect(extras.some((line) => line.includes("뉴욕 코믹콘"))).toBe(true);
    expect(extras.some((line) => line.includes("■ 심화"))).toBe(true);
  });

  it("scores deep content higher than basic", () => {
    expect(deepSectionCompleteness("x".repeat(300))).toBeGreaterThan(85);
  });
});
