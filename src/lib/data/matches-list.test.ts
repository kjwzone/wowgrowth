import { describe, expect, it } from "vitest";
import { levelLabel } from "@/lib/data/matching-results";

describe("matches list helpers", () => {
  it("maps recommendation level labels", () => {
    expect(levelLabel("high")).toBe("높음");
    expect(levelLabel("medium")).toBe("중간");
  });
});
