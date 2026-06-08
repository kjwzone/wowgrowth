import type {
  CompanyProfile,
  PatentEntry,
  PatentKind,
  PatentStatus,
} from "@/types";

export const PATENT_KINDS: PatentKind[] = ["특허", "실용신안", "디자인"];
export const PATENT_STATUSES: PatentStatus[] = ["등록완료", "출원중"];
export const RESEARCH_ORG_OPTIONS = [
  "기업부설연구소",
  "연구전담부서",
  "없음",
] as const;

const STORAGE_KEY = "wow.company.profile";

let idSeq = 0;
const nextId = (): string => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  idSeq += 1;
  return `patent-${Date.now()}-${idSeq}`;
};

export const createPatentEntry = (): PatentEntry => ({
  id: nextId(),
  kind: "특허",
  applicationNumber: "",
  country: "대한민국",
  title: "",
  filingDate: "",
  holder: "",
  status: "출원중",
});

/** 구조화된 특허 항목을 AI·매칭에서 쓰는 문자열 라벨로 변환 */
export const patentEntryLabel = (entry: PatentEntry): string => {
  const title = entry.title.trim() || "특허";
  const suffix = entry.status === "등록완료" ? "등록" : "출원";
  return `${title} (${suffix})`;
};

export const derivePatentLabels = (entries: PatentEntry[]): string[] =>
  entries
    .filter((entry) => entry.title.trim().length > 0)
    .map(patentEntryLabel);

/** 문자열 라벨 목록을 구조화된 특허 항목으로 변환 (마이그레이션용) */
export const patentLabelsToEntries = (labels: string[]): PatentEntry[] =>
  labels.map((label) => {
    const registered = /등록/.test(label);
    return {
      ...createPatentEntry(),
      title: label.replace(/\s*\((출원|등록)[^)]*\)\s*$/, "").trim() || label,
      status: registered ? "등록완료" : "출원중",
    };
  });

/** patentEntries가 없으면 patents 문자열에서 보강해 일관된 프로필 반환 */
export const normalizeCompanyProfile = (
  profile: CompanyProfile,
): CompanyProfile => {
  const patentEntries =
    profile.patentEntries && profile.patentEntries.length > 0
      ? profile.patentEntries
      : patentLabelsToEntries(profile.patents);
  return {
    ...profile,
    patentEntries,
    patents: derivePatentLabels(patentEntries),
    researchOrg: profile.researchOrg ?? "없음",
  };
};

export const loadStoredProfile = (): CompanyProfile | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return normalizeCompanyProfile(JSON.parse(raw) as CompanyProfile);
  } catch {
    return null;
  }
};

export const persistProfile = (profile: CompanyProfile): void => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {
    /* 저장 실패는 무시 (용량 초과 등) */
  }
};
