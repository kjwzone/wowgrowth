import { describe, expect, it } from "vitest";
import {
  isHtmlContent,
  parseBizinfoFields,
  sanitizeBizinfoHtml,
  splitBizinfoDocuments,
  stripHtmlToPlain,
} from "@/lib/bizinfo-content";

const SAMPLE_HTML = `<p>한국콘텐츠진흥원은 북미 최대 규모 엔터테인먼트 페스티벌을 시행합니다.&nbsp;</p>
<p style="line-height: 1.8;">☞ 마켓플레이스 및 WelCon 등록 완료 기업</p>
<p style="line-height: 1.8;">- 국산 게임 IP 사업권을 보유한 기업</p>
<p style="line-height: 1.8;">☞ 한국 공동관 운영, 비즈니스 지원, 체재지원</p>
<p style="line-height: 1.8;">※ 자세한 지원내용 공고문 참조</p>`;

describe("bizinfo-content", () => {
  it("strips HTML to readable plain text", () => {
    const plain = stripHtmlToPlain(SAMPLE_HTML);
    expect(plain).toContain("한국콘텐츠진흥원은");
    expect(plain).not.toContain("<p>");
    expect(plain).toContain("☞ 마켓플레이스");
  });

  it("sanitizes unsafe HTML", () => {
    const safe = sanitizeBizinfoHtml(
      '<p onclick="alert(1)">text</p><script>alert(1)</script>',
    );
    expect(safe).not.toContain("script");
    expect(safe).not.toContain("onclick");
    expect(safe).toContain("text");
  });

  it("parses targets, benefits, and documents from bizinfo fields", () => {
    const parsed = parseBizinfoFields({
      summaryHtml: SAMPLE_HTML,
      trgetNm: "중소기업",
      fileNm: "신청서.hwp@동의서.hwp",
      reqstMthPapersCn: "온라인 접수",
    });

    expect(parsed.summaryPlain).toContain("한국콘텐츠진흥원");
    expect(parsed.targets).toContain("중소기업");
    expect(parsed.targets.some((t) => t.includes("WelCon"))).toBe(true);
    expect(parsed.targets.some((t) => t.includes("게임 IP"))).toBe(true);
    expect(parsed.benefits.some((b) => b.includes("공동관"))).toBe(true);
    expect(parsed.documents).toEqual(["신청서.hwp", "동의서.hwp"]);
  });

  it("detects HTML content", () => {
    expect(isHtmlContent("<p>hello</p>")).toBe(true);
    expect(isHtmlContent("plain text")).toBe(false);
  });

  it("splits document filenames", () => {
    expect(splitBizinfoDocuments("a.pdf@b.hwp")).toEqual(["a.pdf", "b.hwp"]);
  });
});
