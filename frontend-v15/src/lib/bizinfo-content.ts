export const decodeHtmlEntities = (text: string): string =>
  text
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");

export const stripHtmlToPlain = (html: string): string => {
  if (!html.trim()) return "";

  return decodeHtmlEntities(
    html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n")
      .replace(/<\/li>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/\u00a0/g, " "),
  )
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n");
};

export const sanitizeBizinfoHtml = (html: string): string => {
  if (!html.trim()) return "";

  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "")
    .replace(/\son\w+='[^']*'/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/(<[^>]+)\sstyle="[^"]*"/gi, "$1");
};

export const isHtmlContent = (value: string): boolean => /<[^>]+>/.test(value);

export const splitBizinfoTarget = (trgetNm: string | undefined): string[] =>
  (trgetNm ?? "")
    .split(/[,·/|]/)
    .map((part) => part.trim())
    .filter(Boolean);

export const splitBizinfoDocuments = (fileNm: string | undefined): string[] =>
  (fileNm ?? "")
    .split("@")
    .map((part) => part.trim())
    .filter(Boolean);

type ParseBizinfoFieldsInput = {
  summaryHtml: string;
  trgetNm?: string;
  fileNm?: string;
  reqstMthPapersCn?: string;
};

const isBenefitHeader = (text: string): boolean =>
  /지원|공동관|체재|운영|혜택|지원내용|바우처|융자|보조/.test(text) &&
  !/등록 완료|참가기업|참여기업|모집 대상|신청 대상|대상기업/.test(text);

export const parseBizinfoFields = (
  input: ParseBizinfoFieldsInput,
): {
  summaryPlain: string;
  targets: string[];
  benefits: string[];
  documents: string[];
} => {
  const lines = stripHtmlToPlain(input.summaryHtml).split("\n");
  const intro: string[] = [];
  const targets: string[] = [];
  const benefits: string[] = [];
  let mode: "intro" | "target" | "benefit" = "intro";

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    if (line.startsWith("☞")) {
      const text = line.replace(/^☞\s*/, "").trim();
      if (isBenefitHeader(text)) {
        mode = "benefit";
        benefits.push(text);
      } else {
        mode = "target";
        targets.push(text);
      }
      continue;
    }

    if (/^[-·•]/.test(line)) {
      const text = line.replace(/^[-·•]\s*/, "").trim();
      (mode === "benefit" ? benefits : targets).push(text);
      continue;
    }

    if (line.startsWith("※")) {
      benefits.push(line);
      mode = "benefit";
      continue;
    }

    if (mode === "intro") {
      intro.push(line);
    } else if (mode === "benefit") {
      benefits.push(line);
    } else {
      targets.push(line);
    }
  }

  const apiTargets = splitBizinfoTarget(input.trgetNm);
  const mergedTargets = [...new Set([...apiTargets, ...targets])];
  const documents = splitBizinfoDocuments(input.fileNm);

  if (documents.length === 0 && input.reqstMthPapersCn?.trim()) {
    documents.push(`신청 방법: ${input.reqstMthPapersCn.trim()}`);
  }

  const summaryPlain =
    intro.join("\n\n") ||
    stripHtmlToPlain(input.summaryHtml).slice(0, 600) ||
    "상세 내용은 기업마당 원문을 확인하세요.";

  return {
    summaryPlain,
    targets: mergedTargets.length > 0 ? mergedTargets : ["공고 원문에서 확인"],
    benefits:
      benefits.length > 0
        ? benefits
        : input.reqstMthPapersCn?.trim()
          ? [`신청 방법: ${input.reqstMthPapersCn.trim()}`]
          : ["지원 내용은 기업마당 공고 원문을 확인하세요."],
    documents:
      documents.length > 0
        ? documents
        : ["공고 첨부파일 — 기업마당 원문 참조"],
  };
};
