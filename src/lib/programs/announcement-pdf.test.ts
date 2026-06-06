import { describe, expect, it } from "vitest";
import {
  formatAnnouncementContentForStorage,
  isAnnouncementPdfFile,
} from "@/lib/programs/announcement-pdf";

describe("announcement-pdf", () => {
  it("detects pdf files", () => {
    expect(isAnnouncementPdfFile({ name: "공고.pdf", type: "" })).toBe(true);
    expect(isAnnouncementPdfFile({ name: "공고.txt", type: "application/pdf" })).toBe(
      true,
    );
    expect(isAnnouncementPdfFile({ name: "공고.txt", type: "text/plain" })).toBe(
      false,
    );
  });

  it("formats stored content with source file name", () => {
    const stored = formatAnnouncementContentForStorage({
      fileName: "사업공고.pdf",
      sizeBytes: 1024,
      contentText: "공고 본문",
    });
    expect(stored).toContain("[공고 원문 PDF: 사업공고.pdf]");
    expect(stored).toContain("공고 본문");
  });
});
