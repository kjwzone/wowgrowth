import type { AdminDashboardSummary } from "@/lib/admin-dashboard-types";

export type AdminTab = "overview" | "companies" | "diagnosis" | "matching" | "plans";

export const getAdminTabCount = (
  tabId: AdminTab,
  details: NonNullable<AdminDashboardSummary["details"]>,
): number | undefined => {
  switch (tabId) {
    case "companies":
      return details.companies.length;
    case "diagnosis":
      return details.diagnosisReports.length;
    case "matching":
      return details.matchingResults.length;
    case "plans":
      return details.businessPlans.length;
    default:
      return undefined;
  }
};
