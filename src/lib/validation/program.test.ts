import { describe, expect, it } from "vitest";
import {
  programInputSchema,
  programStatusUpdateSchema,
  toProgramInsertRow,
} from "@/lib/validation/program";

describe("programInputSchema", () => {
  it("parses admin program input", () => {
    const parsed = programInputSchema.parse({
      title: "테스트 공고",
      agency: "중기부",
      status: "published",
      content: "원문",
    });
    expect(parsed.title).toBe("테스트 공고");
  });

  it("maps to insert row", () => {
    const input = programInputSchema.parse({
      title: "T",
      agency: "A",
      content: "[공고 원문 PDF: test.pdf]\n공고 본문",
    });
    const row = toProgramInsertRow(input, "admin-id");
    expect(row.created_by).toBe("admin-id");
    expect(row.content_raw).toContain("공고 본문");
  });

  it("parses status update payload", () => {
    const parsed = programStatusUpdateSchema.parse({ status: "published" });
    expect(parsed.status).toBe("published");
  });
});
