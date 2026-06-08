export type ProgramStatus = "draft" | "published" | "closed";

export type JobStatus = "queued" | "running" | "succeeded" | "failed";

export type ProgramStatusCounts = Record<ProgramStatus, number> & { total: number };

export type AdminCompanyRow = {
  id: string;
  companyName: string;
  businessNumber: string;
  industry: string;
  region: string;
  createdAt: string;
  updatedAt: string;
};

export type AdminDiagnosisRow = {
  id: string;
  companyId: string;
  companyName: string;
  status: string;
  overallScore: number | null;
  model: string;
  createdAt: string;
  updatedAt: string;
};

export type AdminMatchingRow = {
  id: string;
  companyId: string;
  companyName: string;
  programId: string;
  programTitle: string;
  agency: string;
  programStatus: string | null;
  score: number;
  recommendationLevel: string;
  status: string;
  reasonCount: number;
  createdAt: string;
};

export type AdminBusinessPlanRow = {
  id: string;
  companyId: string;
  companyName: string;
  programId: string;
  programTitle: string;
  title: string;
  status: string;
  model: string;
  sectionCount: number;
  createdAt: string;
  updatedAt: string;
};

export type AdminDashboardDetails = {
  companies: AdminCompanyRow[];
  diagnosisReports: AdminDiagnosisRow[];
  matchingResults: AdminMatchingRow[];
  businessPlans: AdminBusinessPlanRow[];
};

export type AdminDashboardSummary = {
  programs: ProgramStatusCounts;
  companies: number;
  matches: number;
  diagnosisReports: number;
  businessPlans: number;
  pendingReviews: number;
  aiJobs: Record<JobStatus, number> & { total: number };
  recentFailedJobs: ReadonlyArray<{
    id: string;
    task_type: string;
    error_code: string | null;
    created_at: string;
  }>;
  pendingReviewItems: ReadonlyArray<{
    id: string;
    title: string;
    created_at: string;
  }>;
  details: AdminDashboardDetails;
};
