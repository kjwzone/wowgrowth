import { z } from "zod";
import { normalizeAnnouncementMetadata } from "@/lib/ai/normalize-announcement-metadata";

const announcementMetadataFieldsSchema = z.object({
  title: z.string().default(""),
  agency: z.string().default(""),
  target: z.string().default(""),
  region: z.string().default(""),
  business_stage: z.string().default(""),
  industry: z.string().default(""),
  support_amount: z.string().default(""),
  application_period: z.string().default(""),
  required_documents: z.array(z.string()).default([]),
  eligibility: z.array(z.string()).default([]),
  bonus_points: z.array(z.string()).default([]),
  summary: z.string().default(""),
});

export const announcementMetadataSchema = z.preprocess(
  normalizeAnnouncementMetadata,
  announcementMetadataFieldsSchema,
);

export type AnnouncementMetadata = z.infer<typeof announcementMetadataSchema>;

export const diagnosisReportSchema = z.object({
  company_summary: z.string(),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  financial_diagnosis: z.string(),
  non_financial_diagnosis: z.string(),
  government_support_readiness: z.string(),
  recommended_actions: z.array(z.string()),
  overall_comment: z.string(),
});

export type DiagnosisReport = z.infer<typeof diagnosisReportSchema>;

export const businessPlanSectionSchema = z.object({
  section_title: z.string(),
  content: z.string(),
});

export const businessPlanVerificationRowSchema = z.object({
  item: z.string(),
  result: z.string(),
  notes: z.string().optional(),
});

export const businessPlanDraftSchema = z.object({
  title: z.string(),
  premises: z.string().optional(),
  sections: z.array(businessPlanSectionSchema).min(1),
  self_verification: z.array(businessPlanVerificationRowSchema).optional(),
  key_risks: z.array(z.string()).max(10).optional(),
  evidence_checklist: z.array(z.string()).optional(),
});

export type BusinessPlanDraft = z.infer<typeof businessPlanDraftSchema>;
export type BusinessPlanVerificationRow = z.infer<
  typeof businessPlanVerificationRowSchema
>;

export const PROMPT_VERSION = "v2-startup-package";
export const SCHEMA_VERSION = "v2";
/** @deprecated use DEFAULT_GEMINI_MODEL from gemini.ts */
export const GEMINI_MODEL = "gemini-2.5-flash";
