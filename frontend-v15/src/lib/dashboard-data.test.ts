import { describe, expect, it } from "vitest";
import { businessPlanDraft } from "@/data/businessPlan";
import { companyProfile } from "@/data/company";
import { matchingResults } from "@/data/matching";
import { programs } from "@/data/programs";
import {
  buildDashboardChecklist,
  buildDashboardSnapshot,
  buildDashboardStats,
  buildScoreTrend,
} from "@/lib/dashboard-data";

describe("dashboard-data", () => {
  it("builds stats from company, matching, and plan", () => {
    const stats = buildDashboardStats(companyProfile, matchingResults, businessPlanDraft);
    expect(stats.diagnosisScore).toBe(82);
    expect(stats.recommendedCount).toBe(matchingResults.length);
    expect(stats.readinessScore).toBe(businessPlanDraft.overallCompleteness);
  });

  it("marks checklist items from real completion state", () => {
    const checklist = buildDashboardChecklist(companyProfile, matchingResults, businessPlanDraft);
    expect(checklist.find((item) => item.id === "company")?.done).toBe(true);
    expect(checklist.find((item) => item.id === "matching")?.done).toBe(true);
    expect(checklist.find((item) => item.id === "plan-sections")?.done).toBe(false);
  });

  it("builds score trend ending at current diagnosis score", () => {
    const trend = buildScoreTrend(82);
    expect(trend.at(-1)?.score).toBe(82);
    expect(trend).toHaveLength(5);
  });

  it("links closing programs with matching scores", () => {
    const snapshot = buildDashboardSnapshot({
      company: companyProfile,
      matching: matchingResults,
      plan: businessPlanDraft,
      programs,
      sources: { matching: "bizinfo", programs: "bizinfo" },
    });

    expect(snapshot.closingPrograms.length).toBeGreaterThan(0);
    expect(snapshot.insights.length).toBeGreaterThanOrEqual(2);
    expect(snapshot.dataSources.matching).toBe("bizinfo");
  });
});
