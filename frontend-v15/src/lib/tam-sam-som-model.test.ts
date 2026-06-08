import { describe, expect, it } from "vitest";
import {
  buildTamSamSomTiers,
  buildTamSamSomTiersFromTable,
} from "@/lib/tam-sam-som-model";

describe("tam-sam-som-model", () => {
  it("builds Korean TAM/SAM/SOM tiers from content line", () => {
    const tiers = buildTamSamSomTiers(
      "■ TAM/SAM/SOM: 국내 중소·벤처 약 400만社 / 정부지원 수요 50만社 / 1차 목표 5,000社",
    );

    expect(tiers).not.toBeNull();
    expect(tiers![0]?.titleKo).toBe("전체 가용 시장");
    expect(tiers![1]?.titleKo).toBe("유효 가용 시장");
    expect(tiers![2]?.titleKo).toBe("수익 가능 시장");
    expect(tiers![0]?.example).toContain("400만社");
    expect(tiers![2]?.valueLabel).toBe("5000社");
  });

  it("parses 조원 market-size value labels", () => {
    const tiers = buildTamSamSomTiers(
      "TAM/SAM/SOM: 약 6조원 / 약 8,400억원 / 약 2,400억원",
    );
    expect(tiers).not.toBeNull();
    expect(tiers![0]?.valueLabel).toBe("6조원");
    expect(tiers![1]?.valueLabel).toBe("8400억원");
  });

  it("builds tiers from a 목표 시장 table (규모/산출 근거)", () => {
    const tiers = buildTamSamSomTiersFromTable([
      ["TAM (전체시장)", "약 6조원", "전체 시장 규모"],
      ["SAM (유효시장)", "약 8,400억원", "도달 가능 세그먼트"],
      ["SOM (수익시장)", "약 2,400억원", "Bottom-up 산출"],
    ]);
    expect(tiers).not.toBeNull();
    expect(tiers![0]?.valueLabel).toBe("약 6조원");
    expect(tiers![0]?.example).toBe("전체 시장 규모");
    expect(tiers![2]?.valueLabel).toBe("약 2,400억원");
  });
});
