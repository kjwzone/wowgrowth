import { describe, expect, it } from "vitest";
import { levelLabel } from "@/lib/data/matching-results";

describe("levelLabel", () => {
  it("maps recommendation levels to Korean", () => {
    expect(levelLabel("high")).toBe("높음");
    expect(levelLabel("medium")).toBe("중간");
    expect(levelLabel("low")).toBe("낮음");
  });
});
