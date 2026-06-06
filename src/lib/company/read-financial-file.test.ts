import { describe, expect, it } from "vitest";
import {
  getFinancialFileMaxBytes,
  isAllowedFinancialFile,
  isPdfFinancialFile,
} from "@/lib/company/read-financial-file";
import { FINANCIAL_FILE_MAX_BYTES, FINANCIAL_PDF_MAX_BYTES } from "@/lib/company/financials";

describe("read-financial-file", () => {
  it("allows csv, txt, tsv, and pdf", () => {
    expect(isAllowedFinancialFile({ name: "a.csv" })).toBe(true);
    expect(isAllowedFinancialFile({ name: "b.TXT" })).toBe(true);
    expect(isAllowedFinancialFile({ name: "c.tsv" })).toBe(true);
    expect(isAllowedFinancialFile({ name: "d.pdf" })).toBe(true);
    expect(isAllowedFinancialFile({ name: "e.xlsx" })).toBe(false);
  });

  it("detects pdf files", () => {
    expect(isPdfFinancialFile({ name: "report.PDF", type: "" })).toBe(true);
    expect(isPdfFinancialFile({ name: "report.bin", type: "application/pdf" })).toBe(true);
    expect(isPdfFinancialFile({ name: "report.csv", type: "text/csv" })).toBe(false);
  });

  it("uses separate size limits for pdf and text files", () => {
    expect(getFinancialFileMaxBytes({ name: "a.pdf", type: "application/pdf" })).toBe(
      FINANCIAL_PDF_MAX_BYTES,
    );
    expect(getFinancialFileMaxBytes({ name: "a.csv", type: "text/csv" })).toBe(
      FINANCIAL_FILE_MAX_BYTES,
    );
  });
});
