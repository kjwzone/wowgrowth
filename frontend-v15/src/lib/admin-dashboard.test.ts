import { describe, expect, it } from "vitest";
import { adminReviewItems } from "@/data/adminReview";
import { buildAdminDashboardSummary } from "@/lib/admin-dashboard";

describe("admin-dashboard", () => {
  it("summarizes review queue counts", () => {
    const summary = buildAdminDashboardSummary(adminReviewItems);

    expect(summary.totalSubmissions).toBe(4);
    expect(summary.pending).toBe(1);
    expect(summary.approved).toBe(1);
    expect(summary.recentSubmissions).toHaveLength(4);
  });
});
