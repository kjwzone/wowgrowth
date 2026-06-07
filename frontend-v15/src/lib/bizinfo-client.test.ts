import { describe, expect, it } from "vitest";
import { mapBizinfoToSupportProgram } from "@/lib/bizinfo-client";

describe("bizinfo-client", () => {
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
