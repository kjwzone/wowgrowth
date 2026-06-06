import { describe, expect, it } from "vitest";
import { selectBusinessPlanSkill } from "@/lib/ai/business-plan-skill";

describe("business-plan-skill", () => {
  it("selects gov-funding-plan for R&D-style programs", () => {
    expect(
      selectBusinessPlanSkill({
        title: "2026 TIPS 트랙",
        category: "창업",
        agency: "중소벤처기업부",
      }),
    ).toBe("gov-funding-plan");
  });

  it("selects business-plan-writer for startup package programs", () => {
    expect(
      selectBusinessPlanSkill({
        title: "2026 초기창업패키지",
        category: "창업",
        agency: "창업진흥원",
      }),
    ).toBe("business-plan-writer");
  });
});
