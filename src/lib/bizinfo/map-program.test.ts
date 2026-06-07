import { describe, expect, it } from "vitest";
import {
  mapBizinfoItemToProgram,
  mapLcategoryToDisplayCategory,
  parseApplicationEndDate,
  resolveProgramStatus,
} from "@/lib/bizinfo/map-program";
import { parseBizinfoItems } from "@/lib/bizinfo/parse-items";

describe("bizinfo parse-items", () => {
  it("parses jsonArray.item array", () => {
    const items = parseBizinfoItems({
      jsonArray: {
        item: [
          { pblancId: "PBLN_1", pblancNm: "테스트 공고" },
          { pblancId: "PBLN_2", pblancNm: "두번째" },
        ],
      },
    });
    expect(items).toHaveLength(2);
  });
});

describe("bizinfo map-program", () => {
  it("maps raw item to program", () => {
    const program = mapBizinfoItemToProgram(
      {
        pblancId: "PBLN_000000000080236",
        pblancNm: "2026 초기창업패키지",
        jrsdInsttNm: "중소벤처기업부",
        excInsttNm: "창업진흥원",
        lcategory: "창업",
        reqstBeginEndDe: "20260101 ~ 20261231",
        bsnsSumryCn: "초기 창업자 지원",
        trgetNm: "중소기업,스타트업",
        hashTags: "창업,서울,금융",
        pblancUrl: "https://www.bizinfo.go.kr/view/1",
      },
      new Date("2026-06-01"),
    );

    expect(program.id).toBe("bizinfo-PBLN_000000000080236");
    expect(program.category).toBe("창업");
    expect(program.region).toBe("서울");
    expect(program.target).toEqual(["중소기업", "스타트업"]);
    expect(program.source).toBe("bizinfo");
  });

  it("derives status from deadline", () => {
    expect(resolveProgramStatus(10)).toBe("모집중");
    expect(resolveProgramStatus(3)).toBe("마감임박");
    expect(resolveProgramStatus(-1)).toBe("마감");
  });

  it("parses application end date", () => {
    const parsed = parseApplicationEndDate("20260101 ~ 20260630", new Date("2026-06-01"));
    expect(parsed.deadline).toBe("2026-06-30");
    expect(parsed.daysLeft).toBeGreaterThan(0);
  });

  it("maps lcategory labels", () => {
    expect(mapLcategoryToDisplayCategory("기술")).toBe("R&D");
    expect(mapLcategoryToDisplayCategory("경영")).toBe("창업");
  });
});
