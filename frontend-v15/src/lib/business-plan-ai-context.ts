import { companyProfile } from "@/data/company";
import { toMatchingResult } from "@/lib/matching-score";
import type { CompanyProfile, MatchingResult, SupportProgram } from "@/types";

export type AiGenerationContext = {
  company: CompanyProfile;
  program: SupportProgram;
  matching?: MatchingResult;
  diagnosis?: {
    company_summary?: string;
    strengths?: string[];
    weaknesses?: string[];
    recommended_actions?: string[];
  };
};

export const buildAiContext = (
  program: SupportProgram,
  company: CompanyProfile = companyProfile,
): AiGenerationContext => {
  const matching = toMatchingResult(company, program);
  return {
    company,
    program,
    matching,
    diagnosis: {
      company_summary: `${company.name} — ${company.product}`,
      strengths: company.certifications,
      weaknesses: matching?.gaps ?? [],
      recommended_actions: matching?.suggestions ?? [],
    },
  };
};

export const apiPlanToGenerationContext = (ctx: AiGenerationContext) => ctx;
