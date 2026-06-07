import { describe, expect, it } from "vitest";
import {
  parseKeyValueItems,
  parsePercentages,
  parseTagBlocks,
} from "@/lib/business-plan-content-parser";

describe("business-plan-content-parser", () => {
  it("parses key-value lines", () => {
    const items = parseKeyValueItems(["■ 기업명: 와우그로스(주)", "■ 업종: SW"]);
    expect(items).toEqual([
      { key: "기업명", value: "와우그로스(주)" },
      { key: "업종", value: "SW" },
    ]);
  });

  it("parses tag blocks", () => {
    const tags = parseTagBlocks("【Problem】 pain\n【Solution】 fix");
    expect(tags).toHaveLength(2);
    expect(tags[0]?.tag).toBe("Problem");
  });

  it("parses budget percentages", () => {
    const data = parsePercentages("■ 인건비(60%): AI\n■ 외주(25%): UI");
    expect(data).toEqual([
      { name: "인건비", value: 60 },
      { name: "외주", value: 25 },
    ]);
  });
});
