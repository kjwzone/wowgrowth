import { describe, expect, it } from "vitest";
import { announcementMetadataSchema } from "@/lib/ai/schemas";
import { normalizeAnnouncementMetadata } from "@/lib/ai/normalize-announcement-metadata";

describe("normalizeAnnouncementMetadata", () => {
  it("coerces mixed gemini shapes into schema", () => {
    const normalized = normalizeAnnouncementMetadata({
      title: "특허분쟁 지원사업",
      agency: "한국지식재산보호원",
      target: null,
      region: "전국",
      businessStage: "전체",
      industry: ["제조", "IT"],
      support_amount: 5000000,
      applicationPeriod: "2026-06-01 ~ 2026-06-22",
      required_documents: "사업계획서\n신청서",
      eligibility: [{ name: "중소기업" }, "벤처기업"],
      bonus_points: null,
      summary: "공고 요약",
    });

    const parsed = announcementMetadataSchema.safeParse(normalized);
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;

    expect(parsed.data.target).toBe("");
    expect(parsed.data.industry).toBe("제조, IT");
    expect(parsed.data.support_amount).toBe("5000000");
    expect(parsed.data.required_documents).toEqual(["사업계획서", "신청서"]);
    expect(parsed.data.eligibility).toEqual(["중소기업", "벤처기업"]);
    expect(parsed.data.bonus_points).toEqual([]);
  });

  it("accepts korean field aliases", () => {
    const normalized = normalizeAnnouncementMetadata({
      공고명: "2026 창업패키지",
      주관기관: "중기부",
      지원대상: "예비창업자",
      지역: "전국",
      신청기간: "2026-01-01 ~ 2026-03-31",
      요약: "창업 지원",
    });

    const parsed = announcementMetadataSchema.safeParse(normalized);
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;

    expect(parsed.data.title).toBe("2026 창업패키지");
    expect(parsed.data.agency).toBe("중기부");
  });
});
