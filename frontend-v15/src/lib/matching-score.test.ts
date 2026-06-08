import { describe, expect, it } from "vitest";
import { companyProfile } from "@/data/company";
import { programs } from "@/data/programs";
import {
  buildMatchingResults,
  buildMatchingSummary,
  computeMatchScore,
} from "@/lib/matching-score";

describe("matching-score", () => {
  it("returns zero for closed programs", () => {
    const program = { ...programs[0]!, status: "마감" as const };
    const result = computeMatchScore(companyProfile, program);
    expect(result.score).toBe(0);
  });

  it("boosts score for industry and region fit", () => {
    const program = {
      ...programs[0]!,
      status: "모집중" as const,
      category: "창업" as const,
      region: "경기",
    };
    const result = computeMatchScore(companyProfile, program);
    expect(result.score).toBeGreaterThanOrEqual(70);
    expect(result.reasons.length).toBeGreaterThan(0);
  });

  it("builds sorted top matches from program list", () => {
    const active = programs.map((p) => ({ ...p, status: "모집중" as const }));
    const results = buildMatchingResults(companyProfile, active, 3);
    expect(results.length).toBeLessThanOrEqual(3);
    if (results.length >= 2) {
      expect(results[0]!.score).toBeGreaterThanOrEqual(results[1]!.score);
    }
    expect(results[0]?.programId).toBeTruthy();
  });

  it("builds summary from results", () => {
    const summary = buildMatchingSummary([
      {
        programId: "a",
        programTitle: "테스트 공고",
        agency: "기관",
        score: 90,
        level: "high",
        reasons: [],
        gaps: [],
        suggestions: [],
      },
    ]);
    expect(summary).toContain("테스트 공고");
  });
});
