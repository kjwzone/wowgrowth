import { describe, expect, it } from "vitest";
import { extractJsonFromText } from "@/lib/ai/extract-json";

describe("extractJsonFromText", () => {
  it("parses pure JSON", () => {
    const result = extractJsonFromText('{"title":"t","sections":[]}');
    expect(result).toEqual({ title: "t", sections: [] });
  });

  it("extracts JSON from markdown fence", () => {
    const result = extractJsonFromText(
      '설명\n```json\n{"title":"t","sections":[]}\n```',
    );
    expect(result).toEqual({ title: "t", sections: [] });
  });

  it("extracts JSON when mermaid prefix is present", () => {
    const result = extractJsonFromText(
      'mermaid\ngraph TD\nA-->B\n\n{"title":"계획서","sections":[{"section_title":"일반현황","content":"본문"}]}',
    );
    expect(result).toEqual({
      title: "계획서",
      sections: [{ section_title: "일반현황", content: "본문" }],
    });
  });
});
