import { describe, expect, it } from "vitest";
import { computeMatchScore } from "@/lib/matching/score";

describe("computeMatchScore", () => {
  it("returns zero score for non-published programs", () => {
    const result = computeMatchScore(
      { region: "서울", industry: "AI/SaaS" },
      { region: "서울", category: "창업", status: "draft" },
    );
    expect(result.score).toBe(0);
    expect(result.recommendationLevel).toBe("low");
  });

  it("boosts score when region matches", () => {
    const result = computeMatchScore(
      { region: "서울", industry: "AI/SaaS" },
      { region: "서울", category: "창업", status: "published" },
    );
    expect(result.score).toBeGreaterThanOrEqual(60);
    expect(result.reasons.some((r) => r.includes("지역"))).toBe(true);
  });

  it("clamps score between 0 and 100", () => {
    const result = computeMatchScore(
      { region: "부산", industry: "제조" },
      { region: "서울", category: "농업", status: "published" },
    );
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });
});
