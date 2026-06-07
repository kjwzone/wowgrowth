import { describe, expect, it } from "vitest";
import {
  buildBudgetExecutionPlanFromProgram,
  buildBudgetSectionContentFromProgram,
  parseBudgetConstraintsFromProgram,
  parseBudgetExecutionPlan,
  parseGovSupportMaxKrw,
  serializeBudgetExecutionPlan,
} from "@/lib/budget-execution-plan-model";

describe("budget-execution-plan-model", () => {
  it("parses support amount from program text", () => {
    expect(parseGovSupportMaxKrw("최대 1억원")).toBe(100_000_000);
    expect(parseGovSupportMaxKrw("최대 3억원")).toBe(300_000_000);
  });

  it("infers export budget from NY comic con style announcement", () => {
    const constraints = parseBudgetConstraintsFromProgram({
      title: "[경기] 2026년 마켓플레이스 특화형 수출지원 뉴욕 코믹콘",
      summary: "해외 전시 참가·바이어 상담 지원 · 기업당 최대 5천만원",
      category: "수출",
      benefits: ["전시 부스·홍보물·현지 출장비 지원"],
    });

    expect(constraints.programKind).toBe("export");
    expect(constraints.govSupportMaxKrw).toBeGreaterThanOrEqual(50_000_000);
    expect(constraints.eligibleCategories).toContain("여비");
  });

  it("builds export plan with travel line item", () => {
    const constraints = parseBudgetConstraintsFromProgram({
      title: "수출바우처 해외전시",
      summary: "기업당 5천만원 지원",
    });
    const plan = buildBudgetExecutionPlanFromProgram({ constraints });
    expect(plan.items.some((item) => item.category === "여비")).toBe(true);
    expect(plan.summary.govSupportAmount).toBe(constraints.govSupportMaxKrw);
  });

  it("builds section content with announcement note", () => {
    const content = buildBudgetSectionContentFromProgram(
      {
        title: "초기창업패키지",
        summary: "최대 1억원 · 현금 10%",
        supportAmount: "최대 1억원",
      },
      { name: "테스트(주)", product: "SaaS" },
    );
    expect(content).toContain("[사업비 요약]");
    expect(content).toContain("공고 지원한도");
  });

  it("round-trips serialize and parse", () => {
    const plan = buildBudgetExecutionPlanFromProgram({
      constraints: parseBudgetConstraintsFromProgram({ supportAmount: "최대 1억원" }),
    });
    const parsed = parseBudgetExecutionPlan(serializeBudgetExecutionPlan(plan));
    expect(parsed?.summary.govSupportAmount).toBe(plan.summary.govSupportAmount);
  });
});
