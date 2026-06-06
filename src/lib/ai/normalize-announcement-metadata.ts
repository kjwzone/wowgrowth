const toText = (value: unknown, fallback = ""): string => {
  if (value == null) return fallback;
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) {
    return value
      .map((item) => toText(item))
      .filter(Boolean)
      .join(", ");
  }
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const preferred = record.text ?? record.name ?? record.title ?? record.value;
    if (preferred != null) return toText(preferred);
    return JSON.stringify(value);
  }
  return fallback;
};

const toTextList = (value: unknown): string[] => {
  if (value == null) return [];

  if (typeof value === "string") {
    return value
      .split(/\n|•|·|;/)
      .map((item) => item.replace(/^[-*]\s*/, "").trim())
      .filter(Boolean);
  }

  if (!Array.isArray(value)) {
    const text = toText(value);
    return text ? [text] : [];
  }

  return value.flatMap((item) => {
    if (typeof item === "string") {
      const trimmed = item.trim();
      return trimmed ? [trimmed] : [];
    }
    if (typeof item === "object" && item !== null) {
      const record = item as Record<string, unknown>;
      const text = toText(
        record.name ??
          record.title ??
          record.document ??
          record.item ??
          record.text ??
          record,
      );
      return text ? [text] : [];
    }
    const text = toText(item);
    return text ? [text] : [];
  });
};

const pick = (obj: Record<string, unknown>, keys: string[]): unknown => {
  for (const key of keys) {
    const value = obj[key];
    if (value != null && value !== "") return value;
  }
  return undefined;
};

/** Gemini 공고 메타데이터 출력을 Zod 스키마에 맞게 정규화 */
export const normalizeAnnouncementMetadata = (raw: unknown): unknown => {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return raw;
  }

  const obj = raw as Record<string, unknown>;

  return {
    title: toText(pick(obj, ["title", "공고명", "program_title", "name"])),
    agency: toText(pick(obj, ["agency", "주관기관", "organization", "host"])),
    target: toText(pick(obj, ["target", "지원대상", "support_target", "audience"])),
    region: toText(pick(obj, ["region", "지역", "area", "location"])),
    business_stage: toText(
      pick(obj, ["business_stage", "businessStage", "stage", "창업단계"]),
    ),
    industry: toText(pick(obj, ["industry", "업종", "sector"])),
    support_amount: toText(
      pick(obj, ["support_amount", "supportAmount", "amount", "지원금액", "budget"]),
    ),
    application_period: toText(
      pick(obj, [
        "application_period",
        "applicationPeriod",
        "period",
        "신청기간",
        "deadline",
      ]),
    ),
    required_documents: toTextList(
      pick(obj, ["required_documents", "requiredDocuments", "documents", "제출서류"]),
    ),
    eligibility: toTextList(
      pick(obj, ["eligibility", "requirements", "qualifications", "지원자격"]),
    ),
    bonus_points: toTextList(
      pick(obj, ["bonus_points", "bonusPoints", "bonus", "가점", "우대"]),
    ),
    summary: toText(
      pick(obj, ["summary", "description", "overview", "요약", "공고요약"]),
    ),
  };
};
