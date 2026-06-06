import { describe, expect, it } from "vitest";
import {
  formatFinancialsForAi,
  parseStoredFinancials,
  toStoredFinancials,
} from "@/lib/company/financials";

describe("company financials", () => {
  it("parses v1 stored financials", () => {
    const value = parseStoredFinancials({
      version: "v1",
      summary_text: "매출 10억",
      statement_files: [
        {
          id: "1",
          file_name: "2024.csv",
          mime_type: "text/csv",
          size_bytes: 100,
          content_text: "year,revenue\n2024,1000",
          uploaded_at: "2026-01-01T00:00:00.000Z",
        },
      ],
      updated_at: "2026-01-01T00:00:00.000Z",
    });
    expect(value.summaryText).toBe("매출 10억");
    expect(value.files).toHaveLength(1);
  });

  it("formats legacy financials as summary", () => {
    const text = formatFinancialsForAi({ revenue_2024: 1000 });
    expect(text).toContain("revenue_2024");
  });

  it("stores combined summary and files", () => {
    const stored = toStoredFinancials({
      summaryText: "영업이익 2억",
      files: [],
    });
    expect(stored.version).toBe("v1");
    expect(stored.summary_text).toBe("영업이익 2억");
  });

  it("sanitizes invalid characters for jsonb storage", () => {
    const stored = toStoredFinancials({
      summaryText: "매출\u0000 10억",
      files: [
        {
          id: "1",
          file_name: "재무제표.pdf",
          mime_type: "application/pdf",
          size_bytes: 100,
          content_text: "영업이익\u0000 1억",
          uploaded_at: "2026-01-01T00:00:00.000Z",
        },
      ],
    });
    expect(stored.summary_text).toBe("매출 10억");
    expect(stored.statement_files[0]?.content_text).toBe("영업이익 1억");
  });
});
