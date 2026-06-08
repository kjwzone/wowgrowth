import { describe, expect, it } from "vitest";
import { isAiFallbackError } from "@/lib/business-plan-ai-client";

describe("business-plan-ai-client", () => {
  it("detects fallback-worthy AI errors", () => {
    expect(isAiFallbackError(new Error("GEMINI_API_KEY가 설정되지 않았습니다."))).toBe(true);
    expect(isAiFallbackError(new Error("503 Service Unavailable"))).toBe(true);
    expect(isAiFallbackError(new Error("The operation was aborted"))).toBe(true);
    expect(isAiFallbackError(new Error("Failed to fetch"))).toBe(true);
    expect(isAiFallbackError(new Error("Gemini timeout (45000ms)"))).toBe(true);
    expect(isAiFallbackError(new Error("unknown"))).toBe(false);
  });
});
