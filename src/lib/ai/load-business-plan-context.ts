import { createClient } from "@/lib/supabase/server";
import { ApiError } from "@/lib/api/errors";
import type { DiagnosisReport } from "@/lib/ai/schemas";
import type {
  BusinessPlanGenerationContext,
  BusinessPlanMatchingContext,
} from "@/lib/ai/business-plan-context";
import type { Company } from "@/lib/types/database";

const asStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string");
};

export const loadBusinessPlanGenerationContext = async (params: {
  company: Company;
  programId: string;
  matchingResultId?: string;
}): Promise<BusinessPlanGenerationContext> => {
  const supabase = await createClient();

  const { data: program, error: programError } = await supabase
    .from("support_programs")
    .select("id, title, agency, content_raw, region, category")
    .eq("id", params.programId)
    .single();

  if (programError || !program) {
    throw new ApiError("NOT_FOUND", "공고를 찾을 수 없습니다.");
  }

  const { data: meta } = await supabase
    .from("program_metadata")
    .select("metadata_json")
    .eq("program_id", params.programId)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let matching: BusinessPlanMatchingContext | null = null;
  if (params.matchingResultId) {
    const { data: matchRow } = await supabase
      .from("matching_results")
      .select(
        "score, recommendation_level, reasons, risks, improvement_tasks",
      )
      .eq("id", params.matchingResultId)
      .single();

    if (matchRow) {
      matching = {
        score: matchRow.score,
        recommendation_level: matchRow.recommendation_level,
        reasons: asStringArray(matchRow.reasons),
        risks: asStringArray(matchRow.risks),
        improvement_tasks: asStringArray(matchRow.improvement_tasks),
      };
    }
  }

  const { data: diagnosisRow } = await supabase
    .from("diagnosis_reports")
    .select("report_json")
    .eq("company_id", params.company.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const diagnosis = diagnosisRow?.report_json
    ? (diagnosisRow.report_json as DiagnosisReport)
    : null;

  const samplePdfUrl = process.env.BUSINESS_PLAN_SAMPLE_PDF_URL ?? "";
  const formPdfUrl = process.env.BUSINESS_PLAN_FORM_PDF_URL ?? "";

  const attachmentsNote = [
    samplePdfUrl ? `합격 샘플 PDF: ${samplePdfUrl}` : "합격 샘플 PDF 미설정",
    formPdfUrl ? `정부 양식 PDF: ${formPdfUrl}` : "정부 양식 PDF 미설정",
    "PDF 본문은 미첨부 — URL·공고 원문·DB 입력으로 맥락 구성",
  ].join(" · ");

  return {
    company: params.company,
    program,
    programMeta:
      (meta?.metadata_json as Record<string, unknown> | undefined) ?? null,
    matching,
    diagnosis,
    attachmentsNote,
    samplePdfUrl: samplePdfUrl || null,
    formPdfUrl: formPdfUrl || null,
  };
};
