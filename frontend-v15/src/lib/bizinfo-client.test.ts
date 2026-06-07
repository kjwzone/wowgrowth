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
      summary: "요약",
      target: ["스타트업"],
      applicationPeriod: "20260101 ~ 20261231",
      externalUrl: "https://www.bizinfo.go.kr",
      source: "bizinfo",
    });

    expect(program.source).toBe("bizinfo");
    expect(program.matchScore).toBeNull();
    expect(program.externalUrl).toBe("https://www.bizinfo.go.kr");
  });
});
