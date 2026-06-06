import { describe, expect, it } from "vitest";
import { scoreBarTone } from "@/components/dashboard/match-score-bar";

describe("match-score-bar", () => {
  it("maps score to bar tone", () => {
    expect(scoreBarTone(80)).toBe("bg-emerald-500");
    expect(scoreBarTone(55)).toBe("bg-amber-400");
    expect(scoreBarTone(20)).toBe("bg-slate-400");
  });
});
