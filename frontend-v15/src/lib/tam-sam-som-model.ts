export type TamSamSomTierKey = "tam" | "sam" | "som";

export type TamSamSomTier = {
  key: TamSamSomTierKey;
  acronym: string;
  titleKo: string;
  titleEn: string;
  focusKo: string;
  example: string;
  valueLabel: string;
};

const TIER_META: Record<
  TamSamSomTierKey,
  { acronym: string; titleKo: string; titleEn: string; focusKo: string }
> = {
  tam: {
    acronym: "TAM",
    titleKo: "전체 가용 시장",
    titleEn: "Total Available Market",
    focusKo: "전체 시장 규모",
  },
  sam: {
    acronym: "SAM",
    titleKo: "유효 가용 시장",
    titleEn: "Serviceable Available Market",
    focusKo: "자사 기술·서비스로 접근 가능한 시장",
  },
  som: {
    acronym: "SOM",
    titleKo: "수익 가능 시장",
    titleEn: "Serviceable Obtainable Market",
    focusKo:
      "경쟁·국가·트렌드·유통 채널을 고려해 현실적으로 확보 가능한 시장 점유",
  },
};

const DEFAULT_EXAMPLES: Record<TamSamSomTierKey, string> = {
  tam: "전체 대상 시장 규모 (예: 국내 중소·벤처 약 400만社)",
  sam: "자사 솔루션이 도달 가능한 세그먼트 (예: 정부지원 수요 50만社)",
  som: "1차 목표 점유 규모 (예: 5,000社, MAU 500社)",
};

const extractValueLabel = (segment: string): string => {
  const match = segment.match(/([\d,]+)\s*(만?\s*社|개사|억\s*원|만\s*원|명|%)/);
  if (match) {
    return `${match[1]?.replace(/,/g, "")}${match[2]?.replace(/\s/g, "")}`;
  }
  const num = segment.match(/([\d,]+)/);
  return num ? num[1]!.replace(/,/g, "") : "";
};

/** TAM/SAM/SOM 한 줄(■ TAM/SAM/SOM: …)에서 한글 예시·규모 추출 */
export const buildTamSamSomTiers = (content: string): TamSamSomTier[] | null => {
  const line = content
    .split("\n")
    .map((item) => item.trim())
    .find((item) => /TAM\s*\/\s*SAM\s*\/\s*SOM/i.test(item));

  if (!line) return null;

  const body = line.replace(/^■\s*TAM\s*\/\s*SAM\s*\/\s*SOM\s*:\s*/i, "").trim();
  const segments = body.split("/").map((part) => part.trim()).filter(Boolean);
  const keys: TamSamSomTierKey[] = ["tam", "sam", "som"];

  return keys.map((key, index) => {
    const example = segments[index]?.trim() || DEFAULT_EXAMPLES[key];
    const valueLabel = extractValueLabel(example) || "—";
    const meta = TIER_META[key];

    return {
      key,
      acronym: meta.acronym,
      titleKo: meta.titleKo,
      titleEn: meta.titleEn,
      focusKo: meta.focusKo,
      example,
      valueLabel,
    };
  });
};
