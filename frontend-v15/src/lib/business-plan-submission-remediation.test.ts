import { describe, expect, it } from "vitest";
import { completePipeline, createEmptyDraft } from "@/lib/business-plan-generator";
import { validateForSubmission } from "@/lib/business-plan-submission";
import {
  getPrimaryRemediation,
  resolveRemediationForItem,
} from "@/lib/business-plan-submission-remediation";

describe("business-plan-submission-remediation", () => {
  it("suggests jumping to the first empty section", () => {
    const draft = createEmptyDraft("prog-001");
    const cleared = {
      ...draft,
      sections: draft.sections.map((section, index) =>
        index >= 5 ? { ...section, content: "" } : section,
      ),
    };
    const { checklist } = validateForSubmission(cleared);
    const sectionItem = checklist.find((item) => item.item.includes("필수 섹션"));
    expect(sectionItem).toBeDefined();

    const step = resolveRemediationForItem(cleared, sectionItem!);
    expect(step?.action.type).toBe("jump-section");
    if (step?.action.type === "jump-section") {
      expect(step.action.sectionId).toBe(cleared.sections[5]?.id);
    }
  });

  it("prioritizes pipeline remediation before completeness", () => {
    const draft = createEmptyDraft("prog-001");
    const { checklist } = validateForSubmission(draft);
    const primary = getPrimaryRemediation(draft, checklist);

    expect(primary?.action.type).toBe("generate-full");
    if (primary?.action.type === "generate-full") {
      expect(primary.action.mode).toBe("pipeline");
    }
  });

  it("returns null for passed checklist items", () => {
    const draft = completePipeline(createEmptyDraft("prog-001"));
    const { checklist } = validateForSubmission(draft);
    const passed = checklist.find((item) => item.pass);
    expect(passed).toBeDefined();
    expect(resolveRemediationForItem(draft, passed!)).toBeNull();
  });
});
