import { describe, expect, it } from "vitest";
import { sanitizeTextForJsonStorage } from "@/lib/company/sanitize-json-text";

describe("sanitizeTextForJsonStorage", () => {
  it("removes null bytes", () => {
    expect(sanitizeTextForJsonStorage("매출\u0000 10억")).toBe("매출 10억");
  });

  it("removes lone surrogates", () => {
    expect(sanitizeTextForJsonStorage("a\uD800b")).toBe("ab");
    expect(sanitizeTextForJsonStorage("a\uDC00b")).toBe("ab");
  });

  it("preserves valid supplementary characters", () => {
    expect(sanitizeTextForJsonStorage("\uD83D\uDE00")).toBe("😀");
  });

  it("preserves newlines and tabs", () => {
    expect(sanitizeTextForJsonStorage("line1\nline2\ttab")).toBe("line1\nline2\ttab");
  });
});
