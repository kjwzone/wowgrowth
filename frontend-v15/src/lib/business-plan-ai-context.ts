import { companyProfile } from "@/data/company";
import { matchingResults } from "@/data/matching";
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
  const matching = matchingResults.find((item) => item.programId === program.id);
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
