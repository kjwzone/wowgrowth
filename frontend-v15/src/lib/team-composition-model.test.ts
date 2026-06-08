import { describe, expect, it } from "vitest";
import { normalizeBusinessPlanContent } from "@/lib/business-plan-outline";
import {
  buildTeamCompositionPlan,
  hasTeamComposition,
  isPlaceholderRow,
  isPlaceholderValue,
  parseTeamCompositionPlan,
  serializeTeamCompositionPlan,
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
    expect(plan.teamMembers.length).toBeGreaterThan(0);
    expect(plan.partners.length).toBeGreaterThan(0);
  });

  it("reserves placeholder space when info is missing", () => {
    const plan = buildTeamCompositionPlan(company, undefined);
    expect(plan.representative.some((row) => row.value === TEAM_PLACEHOLDER)).toBe(
      true,
    );
    expect(
      plan.partners.some((row) => isPlaceholderRow([row.name, row.plan])),
    ).toBe(true);
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
    expect(parsed.teamMembers[0]?.role).toBe("AI 개발");
    expect(parsed.teamMembers[0]?.status).toBe("재직");
    expect(parsed.partners.length).toBeGreaterThan(0);
  });

  it("skips markdown table header rows when parsing", () => {
    const content = [
      "■ 팀 구성(안)",
      "| 직책 | 담당 업무 | 보유 역량 | 구성 상태 |",
      "| --- | --- | --- | --- |",
      "| CTO | 기술총괄 | 10년 | 재직 |",
    ].join("\n");

    const parsed = parseTeamCompositionPlan(content);
    expect(parsed.teamMembers).toHaveLength(1);
    expect(parsed.teamMembers[0]?.role).toBe("CTO");
  });

  it("detects placeholder values", () => {
    expect(isPlaceholderValue("")).toBe(true);
    expect(isPlaceholderValue(TEAM_PLACEHOLDER)).toBe(true);
    expect(isPlaceholderValue("실제 내용")).toBe(false);
  });
});
