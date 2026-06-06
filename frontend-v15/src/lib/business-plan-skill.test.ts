import { describe, expect, it } from "vitest";
import {
  getPipelineForSkill,
  selectBusinessPlanSkill,
} from "@/lib/business-plan-skill";

describe("business-plan-skill", () => {
  it("selects gov-funding-plan for R&D programs", () => {
    expect(
      selectBusinessPlanSkill({
        title: "중소기업 기술개발 지원사업",
        category: "R&D",
        agency: "중소벤처기업부",
      }),
    ).toBe("gov-funding-plan");
  });

  it("selects business-plan-writer for startup package", () => {
    expect(
      selectBusinessPlanSkill({
        title: "2026 초기창업패키지",
        category: "창업",
        agency: "창업진흥원",
      }),
    ).toBe("business-plan-writer");
  });

  it("returns 5-step pipeline per skill", () => {
    expect(getPipelineForSkill("business-plan-writer")).toHaveLength(5);
    expect(getPipelineForSkill("gov-funding-plan")[1]?.agent).toBe("tech-writer");
  });
});
