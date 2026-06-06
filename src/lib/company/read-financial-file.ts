import {
  FINANCIAL_FILE_MAX_BYTES,
  FINANCIAL_PDF_MAX_BYTES,
  FINANCIAL_TEXT_MAX_CHARS,
} from "@/lib/company/financials";
import { sanitizeTextForJsonStorage } from "@/lib/company/sanitize-json-text";

const ALLOWED_EXTENSIONS = [".csv", ".txt", ".tsv", ".pdf"] as const;

export const isPdfFinancialFile = (file: Pick<File, "name" | "type">): boolean => {
  const name = file.name.toLowerCase();
  return name.endsWith(".pdf") || file.type === "application/pdf";
};

export const isAllowedFinancialFile = (file: Pick<File, "name">): boolean => {
  const name = file.name.toLowerCase();
  return ALLOWED_EXTENSIONS.some((ext) => name.endsWith(ext));
};

export const getFinancialFileMaxBytes = (file: Pick<File, "name" | "type">): number =>
  isPdfFinancialFile(file) ? FINANCIAL_PDF_MAX_BYTES : FINANCIAL_FILE_MAX_BYTES;

const formatSizeLimit = (maxBytes: number): string => {
  if (maxBytes >= 1024 * 1024) {
    return `${Math.round(maxBytes / (1024 * 1024))}MB`;
  }
  return `${Math.round(maxBytes / 1024)}KB`;
};

export const readFinancialFileAsText = async (
  file: File,
): Promise<{ contentText: string }> => {
  if (!isAllowedFinancialFile(file)) {
    throw new Error("CSV, TXT, TSV, PDF 파일만 업로드할 수 있습니다.");
  }

  const maxBytes = getFinancialFileMaxBytes(file);
  if (file.size > maxBytes) {
    throw new Error(`파일 크기는 ${formatSizeLimit(maxBytes)} 이하여야 합니다.`);
  }

  const rawText = isPdfFinancialFile(file)
    ? await (await import("@/lib/company/read-financial-pdf")).readPdfFileAsText(file)
    : await file.text();

  const contentText = sanitizeTextForJsonStorage(rawText).slice(
    0,
    FINANCIAL_TEXT_MAX_CHARS,
  );
  if (!contentText.trim()) {
    throw new Error(
      isPdfFinancialFile(file)
        ? "PDF에서 읽을 수 있는 텍스트가 없습니다. 스캔본이면 요약 텍스트로 입력해 주세요."
        : "파일에서 읽을 수 있는 내용이 없습니다.",
    );
  }

  return { contentText };
};

export const createStatementFileFromUpload = async (
  file: File,
): Promise<{
  id: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  content_text: string;
  uploaded_at: string;
}> => {
  const { contentText } = await readFinancialFileAsText(file);
  return {
    id: crypto.randomUUID(),
    file_name: sanitizeTextForJsonStorage(file.name),
    mime_type: file.type || (isPdfFinancialFile(file) ? "application/pdf" : "text/plain"),
    size_bytes: file.size,
    content_text: contentText,
    uploaded_at: new Date().toISOString(),
  };
};
