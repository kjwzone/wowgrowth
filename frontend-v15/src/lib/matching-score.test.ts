import { describe, expect, it } from "vitest";
import { companyProfile } from "@/data/company";
import { programs } from "@/data/programs";
import {
  buildMatchingResults,
  buildMatchingSummary,
  computeMatchScore,
  resolveProgramRegion,
} from "@/lib/matching-score";

describe("matching-score", () => {
  it("returns zero for closed programs", () => {
    const program = { ...programs[0]!, status: "마감" as const };
    const result = computeMatchScore(companyProfile, program);
    expect(result.score).toBe(0);
  });

  it("boosts score for industry and region fit", () => {
    const program = {
      ...programs[0]!,
      status: "모집중" as const,
      category: "창업" as const,
      region: "경기",
    };
    const result = computeMatchScore(companyProfile, program);
    expect(result.score).toBeGreaterThanOrEqual(70);
    expect(result.reasons.length).toBeGreaterThan(0);
  });

  it("infers region from title bracket when metadata is nationwide", () => {
    const program = {
      ...programs[0]!,
      title: "[대구] 2026년 관광 숙박시설 환경개선 참가 업체 모집 공고",
      agency: "대구광역시 · 대구문화예술진흥원",
      region: "전국",
    };
    expect(resolveProgramRegion(program)).toBe("대구");
  });

  it("excludes other-region programs for 경기 company", () => {
    const daegu = {
      ...programs[0]!,
      id: "bizinfo-daegu",
      status: "모집중" as const,
      title: "[대구] 2026년 관광 숙박시설 환경개선 참가 업체 모집 공고",
      agency: "대구광역시",
      region: "전국",
    };
    const busan = {
      ...programs[0]!,
      id: "bizinfo-busan",
      status: "모집중" as const,
      title: "[부산] BGC 예비 개발자 점프업 지원 사업 참가자 모집 공고",
      agency: "부산광역시",
      region: "전국",
    };
    const gyeonggi = {
      ...programs[0]!,
      id: "bizinfo-gyeonggi",
      status: "모집중" as const,
      title: "2026년 판교허브 투자유치 밸류업 패키지 지원기업 모집 공고",
      agency: "경기도 · 경기콘텐츠진흥원",
      region: "경기",
    };

    expect(computeMatchScore(companyProfile, daegu).score).toBe(0);
    expect(computeMatchScore(companyProfile, busan).score).toBe(0);

    const results = buildMatchingResults(companyProfile, [daegu, busan, gyeonggi], 3);
    expect(results).toHaveLength(1);
    expect(results[0]?.programId).toBe("bizinfo-gyeonggi");
  });

  it("builds sorted top matches from program list", () => {
    const active = programs.map((p) => ({ ...p, status: "모집중" as const }));
    const results = buildMatchingResults(companyProfile, active, 3);
    expect(results.length).toBeLessThanOrEqual(3);
    if (results.length >= 2) {
      expect(results[0]!.score).toBeGreaterThanOrEqual(results[1]!.score);
    }
    expect(results[0]?.programId).toBeTruthy();
  });

  it("builds summary from results", () => {
    const summary = buildMatchingSummary([
      {
        programId: "a",
        programTitle: "테스트 공고",
        agency: "기관",
        score: 90,
        level: "high",
        reasons: [],
        gaps: [],
        suggestions: [],
      },
    ]);
    expect(summary).toContain("테스트 공고");
  });
});
