import { describe, expect, it } from "vitest";
import { completePipeline, createEmptyDraft } from "@/lib/business-plan-generator";
import {
  prepareForSubmission,
  validateForSubmission,
} from "@/lib/business-plan-submission";

describe("business-plan-submission", () => {
  it("rejects submission when sections are empty", () => {
    const draft = createEmptyDraft("prog-001");
    const cleared = {
      ...draft,
      sections: draft.sections.map((s, i) =>
        i >= 5 ? { ...s, content: "" } : s,
      ),
    };
    const result = validateForSubmission(cleared);
    expect(result.ok).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("accepts submission after full pipeline", () => {
    const draft = completePipeline(createEmptyDraft("prog-001"));
    const result = validateForSubmission(draft);
    expect(result.ok).toBe(true);
  });

  it("sets status to ready on successful prepare", () => {
    const draft = completePipeline(createEmptyDraft("prog-001"));
    const { draft: ready, result } = prepareForSubmission(draft);
    expect(result.ok).toBe(true);
    expect(ready.status).toBe("ready");
  });
});
