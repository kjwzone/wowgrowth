import { describe, expect, it } from "vitest";
import {
  buildDefaultBudgetExecutionPlan,
  parseBudgetExecutionPlan,
  parseGovSupportMaxKrw,
  serializeBudgetExecutionPlan,
} from "@/lib/budget-execution-plan-model";

describe("budget-execution-plan-model", () => {
  it("parses support amount from program text", () => {
    expect(parseGovSupportMaxKrw("최대 1억원")).toBe(100_000_000);
    expect(parseGovSupportMaxKrw("최대 3억원")).toBe(300_000_000);
  });

  it("builds default plan scaled to gov support limit", () => {
    const plan = buildDefaultBudgetExecutionPlan({ govSupportMaxKrw: 100_000_000 });
    expect(plan.summary.totalAmount).toBe(143_000_000);
    expect(plan.summary.govSupportAmount).toBe(100_000_000);
    expect(plan.items.length).toBeGreaterThanOrEqual(5);
  });

  it("round-trips serialize and parse", () => {
    const plan = buildDefaultBudgetExecutionPlan();
    const content = serializeBudgetExecutionPlan(plan);
    const parsed = parseBudgetExecutionPlan(content);

    expect(parsed?.summary.totalAmount).toBe(plan.summary.totalAmount);
    expect(parsed?.items).toHaveLength(plan.items.length);
    expect(parsed?.items[0]?.category).toBe("인건비");
  });
});
