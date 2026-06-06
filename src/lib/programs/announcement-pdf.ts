import { sanitizeTextForJsonStorage } from "@/lib/company/sanitize-json-text";

export const ANNOUNCEMENT_PDF_MAX_BYTES = 5 * 1024 * 1024;
export const ANNOUNCEMENT_CONTENT_MAX_CHARS = 100_000;

export type AnnouncementPdfUpload = {
  fileName: string;
  sizeBytes: number;
  contentText: string;
};

export const isAnnouncementPdfFile = (file: Pick<File, "name" | "type">): boolean => {
  const name = file.name.toLowerCase();
  return name.endsWith(".pdf") || file.type === "application/pdf";
};

export const readAnnouncementPdfAsText = async (
  file: File,
): Promise<AnnouncementPdfUpload> => {
  if (!isAnnouncementPdfFile(file)) {
    throw new Error("PDF 파일만 업로드할 수 있습니다.");
  }

  if (file.size > ANNOUNCEMENT_PDF_MAX_BYTES) {
    throw new Error(
      `PDF 크기는 ${Math.round(ANNOUNCEMENT_PDF_MAX_BYTES / (1024 * 1024))}MB 이하여야 합니다.`,
    );
  }

  const { readPdfFileAsText } = await import("@/lib/company/read-financial-pdf");
  const rawText = await readPdfFileAsText(file);
  const contentText = sanitizeTextForJsonStorage(rawText).slice(
    0,
    ANNOUNCEMENT_CONTENT_MAX_CHARS,
  );

  if (!contentText.trim()) {
    throw new Error(
      "PDF에서 읽을 수 있는 텍스트가 없습니다. 텍스트가 포함된 PDF를 업로드해 주세요.",
    );
  }

  return {
    fileName: sanitizeTextForJsonStorage(file.name),
    sizeBytes: file.size,
    contentText,
  };
};

export const formatAnnouncementContentForStorage = (
  upload: AnnouncementPdfUpload,
): string =>
  `[공고 원문 PDF: ${upload.fileName}]\n${upload.contentText}`;
