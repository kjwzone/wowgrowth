import { describe, expect, it } from "vitest";
import {
  formatElapsedSeconds,
  PLAN_GENERATION_STEPS,
  resolvePlanGenerationStepIndex,
} from "@/lib/business-plans/generation-progress";

describe("generation-progress", () => {
  it("advances steps by elapsed time", () => {
    expect(resolvePlanGenerationStepIndex(500)).toBe(0);
    expect(resolvePlanGenerationStepIndex(3_000)).toBe(1);
    expect(resolvePlanGenerationStepIndex(30_000)).toBe(2);
  });

  it("jumps to final step when finished", () => {
    expect(resolvePlanGenerationStepIndex(1_000, true)).toBe(
      PLAN_GENERATION_STEPS.length - 1,
    );
  });

  it("formats elapsed seconds", () => {
    expect(formatElapsedSeconds(4_500)).toBe(4);
  });
});
