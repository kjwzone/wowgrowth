import { describe, expect, it } from "vitest";
import { normalizeBusinessPlanContent } from "@/lib/business-plan-outline";
import {
  buildTeamCompositionPlan,
  hasTeamComposition,
  isPlaceholderValue,
  parseTeamCompositionPlan,
  serializeTeamCompositionPlan,
  tableIsEmpty,
  virtualTeamCompositionSample,
  TEAM_PLACEHOLDER,
} from "@/lib/team-composition-model";
import type { CompanyProfile } from "@/types";

const company: Pick<
  CompanyProfile,
  "name" | "industry" | "product" | "employees" | "patents" | "certifications"
> = {
  name: "테스트(주)",
  industry: "소프트웨어",
  product: "AI SaaS",
  employees: 12,
  patents: ["특허 A (등록)"],
  certifications: ["벤처기업"],
};

describe("team-composition-model", () => {
  it("builds a plan containing all four required elements", () => {
    const plan = buildTeamCompositionPlan(company, undefined);
    expect(plan.orgChart.length).toBeGreaterThan(0);
    expect(plan.representative.length).toBe(4);
    expect(plan.team.rows.length).toBeGreaterThan(0);
    expect(plan.partners.rows.length).toBeGreaterThan(0);
  });

  it("round-trips through serialize/parse even after normalization", () => {
    const plan = buildTeamCompositionPlan(company, undefined);
    const serialized = normalizeBusinessPlanContent(
      serializeTeamCompositionPlan(plan),
    );

    expect(hasTeamComposition(serialized)).toBe(true);

    const parsed = parseTeamCompositionPlan(serialized);
    expect(parsed.orgChart[0]?.label).toContain("대표");
    expect(parsed.representative.map((row) => row.label)).toContain("주요 역량");
    expect(parsed.team.columns).toEqual(["직책", "담당 업무", "보유 역량", "구성 상태"]);
    expect(parsed.team.rows[0]?.[0]).toContain("대표이사");
    expect(parsed.partners.rows.length).toBeGreaterThan(0);
  });

  it("matches markdown/decorated headers, not only ■ headers", () => {
    const content = [
      "## 조직도",
      "- 대표이사 :: 경영 총괄",
      "### 대표자 역량",
      "| 학력 | OOO대 학사 |",
      "**팀 구성(안)**",
      "| 직책 | 담당 | 역량 | 상태 |",
      "| CTO | 기술 | 10년 | 재직 |",
    ].join("\n");

    expect(hasTeamComposition(content)).toBe(true);
    const parsed = parseTeamCompositionPlan(content);
    expect(parsed.orgChart[0]?.label).toContain("대표이사");
    expect(parsed.representative[0]?.label).toBe("학력");
    expect(parsed.team.rows[0]?.[0]).toBe("CTO");
  });

  it("re-routes a team table accidentally placed under 대표자 역량", () => {
    const content = [
      "■ 대표자 역량",
      "| 구분 | 성명 | 주요 경력 | 담당 업무 |",
      "| --- | --- | --- | --- |",
      "| CTO | 이기술 | 前 카카오 | AI 총괄 |",
      "| CPO | 박기획 | 前 토스 | 제품 총괄 |",
    ].join("\n");

    const parsed = parseTeamCompositionPlan(content);
    // 다열 표는 대표자 역량(2열 KV)이 아니라 팀 구성 표로 분리되어야 함
    expect(parsed.representative).toHaveLength(0);
    expect(parsed.team.columns[0]).toBe("구분");
    expect(parsed.team.rows.map((row) => row[0])).toEqual(["CTO", "CPO"]);
  });

  it("provides a virtual sample to fill empty blocks", () => {
    const sample = virtualTeamCompositionSample();
    expect(sample.orgChart.length).toBeGreaterThan(0);
    expect(tableIsEmpty(sample.team)).toBe(false);
    expect(tableIsEmpty(sample.partners)).toBe(false);
    expect(sample.representative.every((row) => row.value.length > 0)).toBe(true);
  });

  it("detects placeholder values and empty tables", () => {
    expect(isPlaceholderValue("")).toBe(true);
    expect(isPlaceholderValue(TEAM_PLACEHOLDER)).toBe(true);
    expect(isPlaceholderValue("실제 내용")).toBe(false);
    expect(tableIsEmpty({ columns: ["a"], rows: [] })).toBe(true);
    expect(
      tableIsEmpty({ columns: ["a"], rows: [[TEAM_PLACEHOLDER]] }),
    ).toBe(true);
  });
});
