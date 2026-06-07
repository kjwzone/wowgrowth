import type { AdminReviewItem } from "@/types";

export type AdminDashboardSummary = {
  totalSubmissions: number;
  pending: number;
  approved: number;
  rejected: number;
  revisionRequested: number;
  approvalRate: number;
  recentSubmissions: AdminReviewItem[];
};

export const buildAdminDashboardSummary = (
  items: readonly AdminReviewItem[],
): AdminDashboardSummary => {
  const pending = items.filter((item) => item.status === "대기").length;
  const approved = items.filter((item) => item.status === "승인").length;
  const rejected = items.filter((item) => item.status === "반려").length;
  const revisionRequested = items.filter((item) => item.status === "보완요청").length;
  const decided = approved + rejected + revisionRequested;

  return {
    totalSubmissions: items.length,
    pending,
    approved,
    rejected,
    revisionRequested,
    approvalRate: decided === 0 ? 0 : Math.round((approved / decided) * 100),
    recentSubmissions: [...items]
      .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
      .slice(0, 5),
  };
};
