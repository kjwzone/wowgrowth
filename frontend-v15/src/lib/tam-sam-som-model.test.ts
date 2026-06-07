import { describe, expect, it } from "vitest";
import { buildTamSamSomTiers } from "@/lib/tam-sam-som-model";

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
});
