import { describe, expect, it } from "vitest";
import {
  GEMINI_MODEL_CANDIDATES,
  isModelNotFoundError,
  isRateLimitError,
} from "@/lib/ai/models";

describe("gemini models", () => {
  it("does not include deprecated 2.0 models", () => {
    expect(GEMINI_MODEL_CANDIDATES).not.toContain("gemini-2.0-flash");
    expect(GEMINI_MODEL_CANDIDATES).not.toContain("gemini-2.0-flash-lite");
    expect(GEMINI_MODEL_CANDIDATES).toContain("gemini-2.5-flash");
  });

  it("detects rate limit errors", () => {
    expect(isRateLimitError(new Error("[429] quota"))).toBe(true);
    expect(isModelNotFoundError(new Error("404 Not Found"))).toBe(true);
  });
});
