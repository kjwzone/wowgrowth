import { describe, expect, it } from "vitest";
import { mapGeminiError } from "@/lib/ai/gemini";

describe("mapGeminiError", () => {
  it("maps quota errors to RATE_LIMITED", () => {
    const err = mapGeminiError(new Error("[429] quota exceeded"));
    expect(err.code).toBe("RATE_LIMITED");
  });

  it("maps 404 model errors", () => {
    const err = mapGeminiError(new Error("404 Not Found models/gemini-2.0-flash"));
    expect(err.message).toContain("gemini-2.5-flash");
  });
});
