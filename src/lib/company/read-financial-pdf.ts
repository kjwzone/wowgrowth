const configurePdfWorker = (pdfjs: typeof import("pdfjs-dist")): void => {
  if (typeof window === "undefined" || pdfjs.GlobalWorkerOptions.workerSrc) {
    return;
  }

  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
};

/** 브라우저에서 PDF 재무제표 텍스트 추출 */
export const readPdfFileAsText = async (file: File): Promise<string> => {
  const pdfjs = await import("pdfjs-dist");
  configurePdfWorker(pdfjs);

  const data = new Uint8Array(await file.arrayBuffer());
  const pdf = await pdfjs.getDocument({ data, useSystemFonts: true }).promise;

  try {
    const pageTexts: string[] = [];

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum += 1) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item) => ("str" in item ? item.str : ""))
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();

      if (pageText) {
        pageTexts.push(pageText);
      }
    }

    return pageTexts.join("\n");
  } finally {
    await pdf.cleanup();
  }
};
