import { describe, expect, it } from "vitest";
import {
  parseInitialAddress,
  toStoredAddressFields,
  trySplitLegacyAddress,
} from "@/lib/company/address-fields";

describe("address-fields", () => {
  it("splits legacy combined address with room suffix", () => {
    expect(
      trySplitLegacyAddress(
        "고운첨단과학기술연구소 창업보육센터 906호",
      ),
    ).toEqual({
      base: "고운첨단과학기술연구소 창업보육센터",
      detail: "906호",
    });
  });

  it("keeps address without detail suffix intact", () => {
    expect(trySplitLegacyAddress("경기도 평택시 중앙로 123")).toEqual({
      base: "경기도 평택시 중앙로 123",
      detail: "",
    });
  });

  it("prefers stored base and detail over legacy region", () => {
    expect(
      parseInitialAddress(
        "경기도 성남시 분당구 판교역로 123",
        "5층 501호",
        "경기도 성남시 분당구 판교역로 123 5층 501호",
      ),
    ).toEqual({
      base: "경기도 성남시 분당구 판교역로 123",
      detail: "5층 501호",
    });
  });

  it("falls back to legacy region split when base is missing", () => {
    expect(
      parseInitialAddress(null, null, "서울특별시 강남구 테헤란로 1 10층"),
    ).toEqual({
      base: "서울특별시 강남구 테헤란로 1",
      detail: "10층",
    });
  });

  it("stores split fields and combined region", () => {
    expect(
      toStoredAddressFields("경기도 평택시 중앙로 123", "101호"),
    ).toEqual({
      address_base: "경기도 평택시 중앙로 123",
      address_detail: "101호",
      region: "경기도 평택시 중앙로 123 101호",
    });
  });
});
