/**
 * @vitest-environment happy-dom
 */
import { afterEach, describe, expect, it } from "vitest";
import { createEmptyDraft } from "@/lib/business-plan-generator";
import { mergeDraftToDocument } from "@/lib/business-plan-document";
import {
  createBusinessPlanPdfHost,
  ensurePdfTargetReady,
  exportBusinessPlanHtmlForPdf,
  PDF_HOST_CLASS,
  waitForPdfLayout,
} from "@/lib/business-plan-html-export";

describe("business-plan-pdf-export", () => {
  afterEach(() => {
    document.querySelectorAll(`.${PDF_HOST_CLASS}`).forEach((node) => node.remove());
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

  it("creates off-screen article host in main document", () => {
    const documentModel = mergeDraftToDocument(createEmptyDraft("prog-001"));
    const { host, target, cleanup } = createBusinessPlanPdfHost(documentModel, []);

    expect(host.className).toBe(PDF_HOST_CLASS);
    expect(host.style.left).toBe("-10000px");
    expect(host.style.zIndex).toBe("-1");
    expect(host.querySelector("style")?.textContent).toContain(PDF_HOST_CLASS);
    expect(target.className).toBe("doc");
    expect(target.textContent).toContain(documentModel.programTitle);

    cleanup();
    expect(document.body.contains(host)).toBe(false);
  });

  it("waits until target has content", async () => {
    const documentModel = mergeDraftToDocument(createEmptyDraft("prog-001"));
    const { target, cleanup } = createBusinessPlanPdfHost(documentModel, []);

    await ensurePdfTargetReady(target);
    expect(target.textContent).toContain(documentModel.programTitle);

    cleanup();
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
