/**
 * @vitest-environment happy-dom
 */
import { afterEach, describe, expect, it } from "vitest";
import { createEmptyDraft } from "@/lib/business-plan-generator";
import { mergeDraftToDocument } from "@/lib/business-plan-document";
import {
  createBusinessPlanPdfTarget,
  waitForPdfLayout,
} from "@/lib/business-plan-html-export";

describe("business-plan-pdf-export", () => {
  afterEach(() => {
    document.querySelectorAll(".bp-pdf-export").forEach((node) => node.remove());
  });

  it("creates on-screen hidden root with styles and article content", () => {
    const documentModel = mergeDraftToDocument(createEmptyDraft("prog-001"));
    const { root, target, cleanup } = createBusinessPlanPdfTarget(documentModel, []);

    expect(root.className).toBe("bp-pdf-export");
    expect(root.style.left).toBe("0px");
    expect(root.style.visibility).toBe("hidden");
    expect(root.querySelector("style")?.textContent).toContain(".bp-pdf-export .doc");
    expect(target.className).toBe("doc");
    expect(target.textContent).toContain(documentModel.programTitle);

    cleanup();
    expect(document.body.contains(root)).toBe(false);
  });

  it("waits for layout frames", async () => {
    let frameCount = 0;
    const originalRaf = globalThis.requestAnimationFrame;
    globalThis.requestAnimationFrame = (cb: FrameRequestCallback) => {
      frameCount += 1;
      cb(0);
      return frameCount;
    };

    await waitForPdfLayout();
    expect(frameCount).toBe(2);

    globalThis.requestAnimationFrame = originalRaf;
  });
});
