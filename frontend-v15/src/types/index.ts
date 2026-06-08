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

export type PatentKind = "특허" | "실용신안" | "디자인";
export type PatentStatus = "등록완료" | "출원중";

export type PatentEntry = {
  id: string;
  kind: PatentKind;
  applicationNumber: string;
  country: string;
  title: string;
  filingDate: string;
  holder: string;
  status: PatentStatus;
};

export type ResearchOrgType = "기업부설연구소" | "연구전담부서" | "없음";

/** 단일 회계연도 재무제표 핵심 항목 (입력 단위는 CompanyFinancials.unitMultiplier 기준) */
export type FinancialYear = {
  year: string;
  revenue: number;
  operatingProfit: number;
  netIncome: number;
  totalAssets: number;
  currentAssets: number;
  currentLiabilities: number;
  totalLiabilities: number;
  totalEquity: number;
};

export type CompanyFinancials = {
  /** 입력 금액을 원으로 환산하는 배수 (기본 1,000,000 = 백만원 단위) */
  unitMultiplier?: number;
  /** 발행주식수 (주) */
  shareCount?: number;
  /** 이자비용 (EBITDA/이자 계산용) */
  interestExpense?: number;
  /** 감가상각비 (EBITDA 계산용) */
  depreciation?: number;
  /** 담보 장부가 (담보대출한도 추정용) */
  collateralBookValue?: number;
  /** 기존 차입금 (추가대출여력 계산용) */
  existingDebt?: number;
  /** 최근 연도가 마지막에 오도록 오름차순 권장, 최대 3개년 */
  years: FinancialYear[];
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
  /** AI·매칭에서 사용하는 특허 라벨 목록 (patentEntries에서 파생) */
  patents: string[];
  patentEntries?: PatentEntry[];
  researchOrg?: ResearchOrgType;
  financials?: CompanyFinancials;
  diagnosisStatus: "완료" | "진행중" | "미시작";
  diagnosisScore: number;
  region?: string;
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
  deadline?: string;
  daysLeft?: number;
  programStatus?: SupportProgram["status"];
  source?: ProgramDataSource;
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
  /** Gemini 생성 메타 */
  aiModel?: string;
  planTitle?: string;
  premises?: string;
  verification?: { item: string; result: string; notes?: string }[];
  keyRisks?: string[];
  evidenceChecklist?: string[];
  submissionChecklist?: { item: string; passed: boolean; message: string }[];
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
