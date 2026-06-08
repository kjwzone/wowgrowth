import { describe, expect, it } from "vitest";
import { getAdminTabCount } from "@/lib/admin-dashboard-tabs";
import type { AdminDashboardSummary } from "@/lib/admin-dashboard-types";

describe("getAdminTabCount", () => {
  const details = {
    companies: [{ id: "1" }],
    diagnosisReports: [{ id: "1" }, { id: "2" }],
    matchingResults: [],
    businessPlans: [{ id: "1" }, { id: "2" }, { id: "3" }],
  } as unknown as NonNullable<AdminDashboardSummary["details"]>;

  it("returns counts for data tabs", () => {
    expect(getAdminTabCount("companies", details)).toBe(1);
    expect(getAdminTabCount("diagnosis", details)).toBe(2);
    expect(getAdminTabCount("matching", details)).toBe(0);
    expect(getAdminTabCount("plans", details)).toBe(3);
  });

  it("returns undefined for overview tab", () => {
    expect(getAdminTabCount("overview", details)).toBeUndefined();
  });
});
