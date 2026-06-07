import { beforeEach, describe, expect, it } from "vitest";
import { resetBusinessPlanCache, businessPlanApi, programApi } from "@/lib/api";
import { clearDraftProgram } from "@/lib/business-plan-generator";

describe("businessPlanApi.initForProgram", () => {
  beforeEach(() => {
    resetBusinessPlanCache();
    clearDraftProgram();
  });

  it("creates draft for bizinfo program selected from detail page", async () => {
    const list = await programApi.list();
    const bizinfoProgram = list.items.find((item) => item.source === "bizinfo");

    if (!bizinfoProgram) {
      expect(list.source).toBe("mock");
      const mockDraft = await businessPlanApi.initForProgram("prog-001");
      expect(mockDraft.programTitle).toContain("초기창업패키지");
      return;
    }

    const draft = await businessPlanApi.initForProgram(bizinfoProgram.id);
    expect(draft.programId).toBe(bizinfoProgram.id);
    expect(draft.programTitle).toBe(bizinfoProgram.title);
    expect(draft.sections.length).toBeGreaterThan(0);
    expect(draft.sections[0]?.content).toContain(bizinfoProgram.title.slice(0, 10));
  });
});
