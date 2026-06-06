import { z } from "zod";
import { sanitizeTextForJsonStorage } from "@/lib/company/sanitize-json-text";

export const FINANCIAL_FILE_MAX_COUNT = 3;
export const FINANCIAL_FILE_MAX_BYTES = 512 * 1024;
export const FINANCIAL_PDF_MAX_BYTES = 3 * 1024 * 1024;
export const FINANCIAL_TEXT_MAX_CHARS = 30_000;

export const financialStatementFileSchema = z.object({
  id: z.string().min(1),
  file_name: z.string().min(1),
  mime_type: z.string().min(1),
  size_bytes: z.number().int().nonnegative(),
  content_text: z.string().max(FINANCIAL_TEXT_MAX_CHARS),
  uploaded_at: z.string().min(1),
});

export const companyFinancialsSchema = z.object({
  version: z.literal("v1"),
  summary_text: z.string().max(FINANCIAL_TEXT_MAX_CHARS).default(""),
  statement_files: z.array(financialStatementFileSchema).max(FINANCIAL_FILE_MAX_COUNT).default([]),
  updated_at: z.string().min(1),
});

export type CompanyFinancials = z.infer<typeof companyFinancialsSchema>;
export type FinancialStatementFile = z.infer<typeof financialStatementFileSchema>;

export type FinancialsFormValue = {
  summaryText: string;
  files: FinancialStatementFile[];
};

const asStatementFiles = (value: unknown): FinancialStatementFile[] => {
  if (!Array.isArray(value)) return [];
  const parsed: FinancialStatementFile[] = [];
  for (const item of value) {
    const result = financialStatementFileSchema.safeParse(item);
    if (result.success) parsed.push(result.data);
  }
  return parsed;
};

export const parseStoredFinancials = (
  raw: Record<string, unknown> | null | undefined,
): FinancialsFormValue => {
  if (!raw || Object.keys(raw).length === 0) {
    return { summaryText: "", files: [] };
  }

  if (raw.version === "v1") {
    return {
      summaryText: typeof raw.summary_text === "string" ? raw.summary_text : "",
      files: asStatementFiles(raw.statement_files),
    };
  }

  return {
    summaryText: JSON.stringify(raw, null, 2),
    files: [],
  };
};

export const sanitizeStoredFinancials = (
  financials: CompanyFinancials,
): CompanyFinancials =>
  companyFinancialsSchema.parse({
    ...financials,
    summary_text: sanitizeTextForJsonStorage(financials.summary_text),
    statement_files: financials.statement_files.map((file) => ({
      ...file,
      file_name: sanitizeTextForJsonStorage(file.file_name),
      content_text: sanitizeTextForJsonStorage(file.content_text),
    })),
  });

export const toStoredFinancials = (value: FinancialsFormValue): CompanyFinancials =>
  sanitizeStoredFinancials(
    companyFinancialsSchema.parse({
      version: "v1",
      summary_text: value.summaryText.trim(),
      statement_files: value.files,
      updated_at: new Date().toISOString(),
    }),
  );

export const hasFinancialData = (financials: CompanyFinancials): boolean =>
  financials.summary_text.length > 0 || financials.statement_files.length > 0;

/** AI·진단용 통합 텍스트 */
export const formatFinancialsForAi = (financials: Record<string, unknown>): string => {
  const parsed = parseStoredFinancials(financials);
  const parts: string[] = [];

  if (parsed.summaryText.trim()) {
    parts.push(`[재무정보 요약]\n${parsed.summaryText.trim()}`);
  }

  for (const file of parsed.files) {
    parts.push(
      `[재무제표 파일: ${file.file_name}]\n${file.content_text.slice(0, FINANCIAL_TEXT_MAX_CHARS)}`,
    );
  }

  return parts.join("\n\n") || "[재무정보 미입력]";
};
