import { describe, expect, it } from "vitest";
import {
  buildBizinfoApiUrl,
  DEFAULT_BIZINFO_PAGE_SIZE,
  mapBizinfoToSupportProgram,
} from "@/lib/bizinfo-client";

describe("bizinfo-client", () => {
  it("builds same-origin API URL (not cross-origin Next.js)", () => {
    const url = buildBizinfoApiUrl({ category: "창업" });
    expect(url.startsWith("/api/bizinfo?")).toBe(true);
    expect(url).not.toContain("wowgrowth.vercel.app");
    expect(url).toContain(`pageSize=${DEFAULT_BIZINFO_PAGE_SIZE}`);
    expect(url).toContain("category=%EC%B0%BD%EC%97%85");
  });

  it("maps API program to SupportProgram", () => {
    const program = mapBizinfoToSupportProgram({
      id: "bizinfo-PBLN_1",
      title: "테스트",
      agency: "중소벤처기업부",
      category: "창업",
      region: "전국",
      supportAmount: "공고 확인",
      deadline: "2026-12-31",
      daysLeft: 10,
      status: "모집중",
      summary: "<p>요약 본문</p><p>☞ 대상 기업</p><p>- 스타트업</p>",
      trgetNm: "중소기업",
      fileNm: "신청서.hwp",
      reqstMthPapersCn: "온라인 접수",
      applicationPeriod: "20260101 ~ 20261231",
      externalUrl: "https://www.bizinfo.go.kr",
      source: "bizinfo",
    });

    expect(program.source).toBe("bizinfo");
    expect(program.matchScore).toBeNull();
    expect(program.summaryHtml).toContain("요약 본문");
    expect(program.target).toContain("중소기업");
    expect(program.documents).toContain("신청서.hwp");
    expect(program.benefits.some((b) => b.includes("온라인"))).toBe(true);
    expect(program.externalUrl).toBe("https://www.bizinfo.go.kr");
  });
});
