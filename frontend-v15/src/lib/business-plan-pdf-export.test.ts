/**
 * @vitest-environment happy-dom
 */
import { afterEach, describe, expect, it } from "vitest";
import { createEmptyDraft } from "@/lib/business-plan-generator";
import { mergeDraftToDocument } from "@/lib/business-plan-document";
import {
  createBusinessPlanPdfIframe,
  exportBusinessPlanHtmlForPdf,
  PDF_IFRAME_CLASS,
  waitForPdfLayout,
} from "@/lib/business-plan-html-export";

describe("business-plan-pdf-export", () => {
  afterEach(() => {
    document.querySelectorAll(`.${PDF_IFRAME_CLASS}`).forEach((node) => node.remove());
  });

  it("injects PDF-specific styles into export HTML", () => {
    const documentModel = mergeDraftToDocument(createEmptyDraft("prog-001"));
    const html = exportBusinessPlanHtmlForPdf(documentModel, []);

    expect(html).toContain("body { margin: 0; padding: 0; background: #ffffff; }");
    expect(html).toContain("Malgun Gothic");
    expect(html).not.toContain("fonts.googleapis.com");
    expect(html).toContain(documentModel.programTitle);
    expect(html).toContain("<article class=\"doc\">");
  });

  it("loads visible article content inside iframe", async () => {
    const documentModel = mergeDraftToDocument(createEmptyDraft("prog-001"));
    const html = exportBusinessPlanHtmlForPdf(documentModel, []);
    const { iframe, target, cleanup } = await createBusinessPlanPdfIframe(html);

    expect(iframe.className).toBe(PDF_IFRAME_CLASS);
    expect(iframe.style.visibility).toBe("visible");
    expect(iframe.style.opacity).toBe("1");
    expect(target.className).toBe("doc");
    expect(target.textContent).toContain(documentModel.programTitle);

    cleanup();
    expect(document.body.contains(iframe)).toBe(false);
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
