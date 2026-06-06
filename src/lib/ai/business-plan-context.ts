import { formatFinancialsForAi } from "@/lib/company/financials";
import { formatFoundedDateLabel } from "@/lib/company/founded-date";
import type { Company, SupportProgram } from "@/lib/types/database";
import type { DiagnosisReport } from "@/lib/ai/schemas";

export type BusinessPlanMatchingContext = {
  score: number;
  recommendation_level: string;
  reasons: string[];
  risks: string[];
  improvement_tasks: string[];
};

export type BusinessPlanGenerationContext = {
  company: Company;
  program: Pick<
    SupportProgram,
    "title" | "agency" | "content_raw" | "region" | "category"
  >;
  programMeta: Record<string, unknown> | null;
  matching: BusinessPlanMatchingContext | null;
  diagnosis: DiagnosisReport | null;
  attachmentsNote: string;
};

const PROGRAM_FORM_OUTLINE = {
  sections: [
    "일반현황: 기업명, 개업연월일, 사업자구분, 대표자유형, 등록번호, 소재지, 창업아이템명, 산출물, 지원분야, 전문기술분야, 총사업비, 지방우대, 팀구성",
    "창업 아이템 개요 요약: 명칭, 범주, 개요, Problem/Solution/Scale-up/Team 요약",
    "Problem: 핵심문제 4종, 사례, 개발필요성",
    "Solution: 선행실적, IP, 활용계획, 세부개발, 경쟁비교표, 성과지표, 협약기간 일정, 사업비",
    "Scale-up: TAM/SAM/SOM, 고객분석, 사업화목표, BM, 마케팅, 글로벌, ESG, 전체일정",
    "Team: 조직도, 대표자·팀원·협력기관",
  ],
};

export const buildStartupInputPayload = (
  ctx: BusinessPlanGenerationContext,
): Record<string, unknown> => {
  const { company, program, programMeta, matching, diagnosis } = ctx;
  const financialsText = formatFinancialsForAi(company.financials ?? {});

  return {
    기업_일반현황: {
      기업명: company.company_name,
      사업자등록번호: company.business_number,
      업종: company.industry,
      소재지: company.region,
      설립일: formatFoundedDateLabel(company.founded_date, company.founded_year),
      설립연도: company.founded_year,
      인증: company.certifications,
      특허_지식재산: company.patents,
      재무_정보_통합: financialsText,
    },
    창업아이템_추론필드: {
      창업아이템명: `[${company.company_name} 기반 — 공고·업종에서 구체화]`,
      제품서비스_개요: diagnosis?.company_summary ?? null,
      핵심기술: diagnosis?.strengths ?? [],
      고객군: `[업종 ${company.industry} 기준 추론, 부족 시 [확인 필요]]`,
      시장문제: matching?.reasons ?? diagnosis?.weaknesses ?? [],
      해결방안: diagnosis?.recommended_actions ?? [],
      경쟁사: `[입력 없음 — [확인 필요] 또는 공고 맥락 추론]`,
      차별성: diagnosis?.strengths ?? [],
      사업화전략: matching?.improvement_tasks ?? [],
      매출수출투자목표: financialsText,
      개발일정: `[협약기간 — 공고·산출물 기준 설계]`,
      사업비계획: programMeta?.support_amount ?? null,
      대표자_팀역량: {
        강점: diagnosis?.strengths ?? [],
        보완: diagnosis?.weaknesses ?? [],
      },
      협력기관: company.certifications,
      보유지식재산권: company.patents,
      선행실적: `[DB 미입력 시 [확인 필요], 임의 실적 생성 금지]`,
    },
    추천분석: matching,
    기업진단요약: diagnosis
      ? {
          summary: diagnosis.company_summary,
          financial: diagnosis.financial_diagnosis,
          non_financial: diagnosis.non_financial_diagnosis,
          readiness: diagnosis.government_support_readiness,
        }
      : null,
    지원사업_공고: {
      title: program.title,
      agency: program.agency,
      region: program.region,
      category: program.category,
      metadata: programMeta,
      content_excerpt: program.content_raw?.slice(0, 12000) ?? "",
    },
    양식_개요: PROGRAM_FORM_OUTLINE,
    attachments: {
      passed_sample_pdf: ctx.attachmentsNote,
      government_form_pdf: "공고 원문·양식 개요로 대체",
    },
  };
};
