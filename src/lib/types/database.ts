export type AppRole = "user" | "admin" | "reviewer";

export type ReviewStatus = "draft" | "reviewing" | "approved" | "rejected";

export type ProgramStatus = "draft" | "published" | "closed";

export type JobStatus = "queued" | "running" | "succeeded" | "failed";

export type AiTaskType =
  | "announcement_summary"
  | "announcement_metadata"
  | "recommendation_reasoning"
  | "diagnosis_draft"
  | "plan_draft";

export type Profile = {
  id: string;
  email: string;
  role: AppRole;
  full_name: string | null;
  created_at: string;
  updated_at: string;
};

export type Company = {
  id: string;
  owner_id: string;
  company_name: string;
  business_number: string;
  industry: string;
  region: string;
  address_base: string | null;
  address_detail: string;
  founded_year: number | null;
  founded_date: string | null;
  certifications: string[];
  patents: string[];
  financials: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type SupportProgram = {
  id: string;
  title: string;
  agency: string;
  category: string | null;
  region: string | null;
  application_start_date: string | null;
  application_end_date: string | null;
  status: ProgramStatus;
  content_raw: string | null;
  created_by: string;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};
