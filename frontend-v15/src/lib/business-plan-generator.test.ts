import { describe, expect, it, afterEach } from "vitest";
import {
  clearDraftProgram,
  completePipeline,
  createEmptyDraft,
  generateSectionContent,
  setDraftProgram,
} from "@/lib/business-plan-generator";
import { STARTUP_PACKAGE_SECTION_TITLES } from "@/lib/business-plan-sections";
import type { SupportProgram } from "@/types";

describe("business-plan-generator", () => {
  afterEach(() => {
    clearDraftProgram();
  });
  it("uses startup-package section titles for 창업패키지", () => {
    const draft = createEmptyDraft("prog-001");
    expect(draft.skillId).toBe("business-plan-writer");
    expect(draft.sections.map((s) => s.title)).toEqual([
      ...STARTUP_PACKAGE_SECTION_TITLES,
    ]);
  });

  it("uses gov-funding skill for R&D program", () => {
    const draft = createEmptyDraft("prog-002");
    expect(draft.skillId).toBe("gov-funding-plan");
    expect(draft.sections.length).toBeGreaterThan(0);
  });

  it("generates deep section content via plan-writer on section AI generate", () => {
    const draft = createEmptyDraft("prog-001");
    const emptySection = draft.sections.find(
      (s) => s.title === "4. 팀 구성 Team_대표자 및 팀원 구성 계획",
    );
    expect(emptySection).toBeDefined();

    const beforeLen = emptySection!.content.length;
    const updated = generateSectionContent(draft, emptySection!.id);
    const section = updated.sections.find((s) => s.id === emptySection!.id);

    expect(section?.content).toContain("대표");
    expect(section?.content).toContain("【심화");
    expect(section!.content.length).toBeGreaterThan(beforeLen);
    expect(section?.completeness).toBeGreaterThanOrEqual(85);
  });

  it("generates budget execution plan table markers in 사업비 section", () => {
    const draft = completePipeline(createEmptyDraft("prog-001"));
    const budget = draft.sections.find((s) => s.title === "사업비 집행 계획");
    expect(budget?.content).toContain("■ [사업비 요약]");
    expect(budget?.content).toContain("■ [비목]");
    expect(budget?.content).toContain("인건비");
  });

  it("completes full pipeline with all sections filled", () => {
    const draft = completePipeline(createEmptyDraft("prog-001"));
    expect(draft.pipelineSteps?.every((s) => s.status === "done")).toBe(true);
    expect(draft.sections.every((s) => s.content.length > 20)).toBe(true);
    expect(draft.status).toBe("review");
  });

  it("uses bizinfo program override for draft title and content", () => {
    const bizinfoProgram: SupportProgram = {
      id: "bizinfo-PBLN_TEST",
      title: "2026년 뉴욕 코믹콘 참가기업 모집",
      agency: "한국콘텐츠진흥원",
      category: "수출",
      region: "전국",
      supportAmount: "공고 확인",
      deadline: "2026-06-17",
      daysLeft: 11,
      matchScore: null,
      status: "모집중",
      summary: "요약",
      target: ["중소기업"],
      benefits: ["공동관 운영"],
      period: "2026-06-04 ~ 2026-06-17",
      documents: ["신청서.hwp"],
      aiFitAnalysis: "기업마당 실시간 공고",
      strategyTip: "온라인 접수",
      source: "bizinfo",
    };

    setDraftProgram(bizinfoProgram);
    const draft = createEmptyDraft(bizinfoProgram.id);

    expect(draft.programTitle).toBe(bizinfoProgram.title);
    expect(draft.sections[0]?.content).toContain("뉴욕 코믹콘");
  });
});
