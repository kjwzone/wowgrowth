import { describe, expect, it } from "vitest";
import {
  combineAddress,
  formatBaseAddress,
  formatFullAddress,
} from "@/lib/address/format-region";
import type { DaumPostcodeData } from "@/types/daum-postcode";

const sampleData: DaumPostcodeData = {
  roadAddress: "경기도 평택시 중앙로 123",
  jibunAddress: "경기도 평택시 비전동 456",
  sido: "경기도",
  sigungu: "평택시",
  bname: "비전동",
  buildingName: "WOW빌딩",
  apartment: "N",
  zonecode: "17800",
};

describe("format-region", () => {
  it("prefers road address", () => {
    expect(formatBaseAddress(sampleData)).toBe("경기도 평택시 중앙로 123");
  });

  it("combines detail address", () => {
    expect(formatFullAddress(sampleData, "101호")).toBe(
      "경기도 평택시 중앙로 123 101호",
    );
  });

  it("combines stored base and detail", () => {
    expect(combineAddress("서울특별시 강남구 테헤란로 1", "5층")).toBe(
      "서울특별시 강남구 테헤란로 1 5층",
    );
  });
});
