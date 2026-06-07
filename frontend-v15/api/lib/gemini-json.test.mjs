import { describe, expect, it } from "vitest";
import { getModelCandidates } from "./gemini-json.mjs";

describe("getModelCandidates", () => {
  it("prefers flash models for fast tier", () => {
    const models = getModelCandidates("fast");
    expect(models[0]).toMatch(/flash/i);
  });

  it("prefers pro for quality tier", () => {
    const previous = process.env.GEMINI_MODEL;
    process.env.GEMINI_MODEL = "gemini-2.5-pro";
    const models = getModelCandidates("quality");
    expect(models[0]).toBe("gemini-2.5-pro");
    process.env.GEMINI_MODEL = previous;
  });
});
