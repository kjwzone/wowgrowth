import { describe, expect, it } from "vitest";
import {
  createPatentEntry,
  derivePatentLabels,
  normalizeCompanyProfile,
  patentLabelsToEntries,
} from "@/lib/company-profile-model";
import type { CompanyProfile } from "@/types";

const baseProfile: CompanyProfile = {
  id: "c1",
  name: "테스트(주)",
  businessNumber: "000-00-00000",
  industry: "SW",
  revenue: "10억",
  employees: 10,
  product: "SaaS",
  stage: "성장기",
  certifications: ["벤처기업"],
  patents: ["AI 매칭 (출원)", "자동작성 시스템 (등록)"],
  diagnosisStatus: "완료",
  diagnosisScore: 80,
};

describe("company-profile-model", () => {
  it("creates an empty patent entry with defaults", () => {
    const entry = createPatentEntry();
    expect(entry.kind).toBe("특허");
    expect(entry.status).toBe("출원중");
    expect(entry.country).toBe("대한민국");
    expect(entry.id).toBeTruthy();
  });

  it("derives labels only from entries that have a title", () => {
    const entries = [
      { ...createPatentEntry(), title: "특허 A", status: "등록완료" as const },
      { ...createPatentEntry(), title: "" },
    ];
    expect(derivePatentLabels(entries)).toEqual(["특허 A (등록)"]);
  });

  it("migrates patent string labels into structured entries", () => {
    const entries = patentLabelsToEntries(["AI 매칭 (출원)", "시스템 (등록)"]);
    expect(entries).toHaveLength(2);
    expect(entries[0]?.title).toBe("AI 매칭");
    expect(entries[0]?.status).toBe("출원중");
    expect(entries[1]?.status).toBe("등록완료");
  });

  it("normalizes a profile by backfilling entries and researchOrg", () => {
    const normalized = normalizeCompanyProfile(baseProfile);
    expect(normalized.patentEntries).toHaveLength(2);
    expect(normalized.researchOrg).toBe("없음");
    expect(normalized.patents).toEqual(derivePatentLabels(normalized.patentEntries!));
  });

  it("keeps explicit patentEntries and re-derives patents from them", () => {
    const normalized = normalizeCompanyProfile({
      ...baseProfile,
      patents: [],
      patentEntries: [
        { ...createPatentEntry(), title: "신규 특허", status: "등록완료" },
      ],
      researchOrg: "기업부설연구소",
    });
    expect(normalized.patents).toEqual(["신규 특허 (등록)"]);
    expect(normalized.researchOrg).toBe("기업부설연구소");
  });
});
