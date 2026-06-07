export type ProgramCategory =
  | "창업"
  | "R&D"
  | "수출"
  | "스마트공장"
  | "인력"
  | "금융"
  | "기타";

export type ProgramDataSource = "bizinfo" | "mock";

export type ProgramStatus = "모집중" | "마감임박" | "마감";

export type SupportProgram = {
  id: string;
  title: string;
  agency: string;
  category: ProgramCategory;
  region: string;
  supportAmount: string;
  deadline: string;
  daysLeft: number;
  matchScore: number | null;
  status: ProgramStatus;
  summary: string;
  summaryHtml?: string;
  target: string[];
  benefits: string[];
  period: string;
  documents: string[];
  aiFitAnalysis: string;
  strategyTip: string;
  source?: ProgramDataSource;
  externalUrl?: string;
};

export type CompanyProfile = {
  id: string;
  name: string;
  businessNumber: string;
  industry: string;
  revenue: string;
  employees: number;
  product: string;
  stage: string;
  certifications: string[];
  patents: string[];
  diagnosisStatus: "완료" | "진행중" | "미시작";
  diagnosisScore: number;
};

export type MatchingResult = {
  programId: string;
  programTitle: string;
  agency: string;
  score: number;
  level: "high" | "medium" | "low";
  reasons: string[];
  gaps: string[];
  suggestions: string[];
};

export type BusinessPlanSection = {
  id: string;
  title: string;
  content: string;
  completeness: number;
};

export type BusinessPlanSkillId = "business-plan-writer" | "gov-funding-plan";

export type PipelineStepStatus = "pending" | "running" | "done";

export type PipelineStep = {
  id: string;
  agent: string;
  label: string;
  status: PipelineStepStatus;
};

export type BusinessPlanDraft = {
  id: string;
  programId: string;
  programTitle: string;
  skillId: BusinessPlanSkillId;
  promptVersion: string;
  pipelineSteps?: PipelineStep[];
  activeAgent?: string;
  sections: BusinessPlanSection[];
  overallCompleteness: number;
  status: "draft" | "review" | "ready";
};

export type ReviewStatus = "대기" | "승인" | "반려" | "보완요청";

export type AdminReviewItem = {
  id: string;
  companyName: string;
  applicant: string;
  programTitle: string;
  submittedAt: string;
  aiDocumentTitle: string;
  status: ReviewStatus;
  adminComment: string;
};

export type DashboardStats = {
  diagnosisStatus: string;
  diagnosisScore: number;
  recommendedCount: number;
  activePlans: number;
  readinessScore: number;
};

export type DashboardInsight = {
  id: string;
  title: string;
  body: string;
  type: "tip" | "alert" | "success";
};

export type UserSession = {
  email: string;
  name: string;
  role: "user" | "admin";
};
