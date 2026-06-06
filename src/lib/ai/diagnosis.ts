import {
  diagnosisReportSchema,
  PROMPT_VERSION,
  type DiagnosisReport,
} from "@/lib/ai/schemas";
import { formatFoundedDateLabel } from "@/lib/company/founded-date";
import { formatFinancialsForAi } from "@/lib/company/financials";
import { generateJsonWithGemini } from "@/lib/ai/generate-json";
import type { Company } from "@/lib/types/database";

export const buildDiagnosisPrompt = (company: Company): string => {
  const context = {
    company_name: company.company_name,
    industry: company.industry,
    region: company.region,
    founded_date: formatFoundedDateLabel(company.founded_date, company.founded_year),
    founded_year: company.founded_year,
    certifications: company.certifications,
    patents: company.patents,
    financials: formatFinancialsForAi(company.financials ?? {}),
  };

  return [
    "당신은 중소기업 성장 컨설턴트입니다.",
    "아래 기업정보를 바탕으로 기업진단 보고서 JSON을 작성하세요.",
    "순수 JSON만 출력합니다.",
    `스키마: ${JSON.stringify({
      company_summary: "string",
      strengths: ["string"],
      weaknesses: ["string"],
      financial_diagnosis: "string",
      non_financial_diagnosis: "string",
      government_support_readiness: "string",
      recommended_actions: ["string"],
      overall_comment: "string",
    })}`,
    `기업정보: ${JSON.stringify(context, null, 2)}`,
  ].join("\n\n");
};

export const generateDiagnosisReport = async (
  company: Company,
): Promise<{ report: DiagnosisReport; model: string }> => {
  const { data, model } = await generateJsonWithGemini({
    prompt: buildDiagnosisPrompt(company),
    schema: diagnosisReportSchema,
    invalidMessage: "기업진단 보고서 JSON 형식이 올바르지 않습니다.",
  });
  void PROMPT_VERSION;
  return { report: data, model };
};
