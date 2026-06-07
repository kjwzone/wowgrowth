/** @see src/lib/ai/prompts/startup-package-plan-instructions.ts — sync target */
export const REQUIRED_SECTION_TITLES = [
  "일반현황",
  "창업 아이템 개요 요약",
  "1. 문제 인식 Problem_창업 아이템의 필요성",
  "2. 실현 가능성 Solution_창업 아이템의 개발 계획",
  "사업비 집행 계획",
  "3. 성장전략 Scale-up_사업화 추진 전략",
  "4. 팀 구성 Team_대표자 및 팀원 구성 계획",
];

export const STARTUP_PACKAGE_PLAN_INSTRUCTIONS = `
당신은 대한민국 정부지원사업·초기창업패키지 사업계획서 작성 전문가다.
평가위원이 3분 내 강점을 파악할 수 있게 작성한다.

절대 준수:
- 정부 양식 section_title 순서·명칭 유지
- 본문 개조식·음슴체·명사형 종결·마침표 금지
- ■ ○ 1) 표 적극 활용
- 입력에 없는 실적·특허·매출 임의 생성 금지 · 추정은 "예상"·"[확인 필요]"
- mermaid·코드펜스 금지 · 순수 JSON만 출력

사업비 집행 계획 content에는 반드시:
■ [사업비 요약] 일반지역|총액|정부|현금|현물
■ [비목] 비목명|집행계획|정부|현금|현물|합계
형식 포함

성장전략 content에는:
■ TAM/SAM/SOM: ... / ... / ...
한 줄 포함

JSON 스키마:
{"title":"","premises":"","sections":[{"section_title":"","content":""}],"self_verification":[{"item":"","result":"","notes":""}],"key_risks":[],"evidence_checklist":[]}
`.trim();

export const buildStartupInputFromRequest = (body) => {
  const { company, program, matching, diagnosis } = body;
  const samplePdf = process.env.BUSINESS_PLAN_SAMPLE_PDF_URL ?? "";
  const formPdf = process.env.BUSINESS_PLAN_FORM_PDF_URL ?? "";

  return {
    기업_일반현황: {
      기업명: company?.name,
      사업자등록번호: company?.businessNumber,
      업종: company?.industry,
      대표_제품: company?.product,
      단계: company?.stage,
      임직원: company?.employees,
      매출: company?.revenue,
      인증: company?.certifications ?? [],
      특허: company?.patents ?? [],
    },
    추천분석: matching ?? null,
    기업진단: diagnosis ?? null,
    지원사업_공고: {
      title: program?.title,
      agency: program?.agency,
      category: program?.category,
      region: program?.region,
      supportAmount: program?.supportAmount,
      summary: program?.summary,
      summaryHtml_excerpt: program?.summaryHtml?.slice?.(0, 8000) ?? "",
      target: program?.target ?? [],
      benefits: program?.benefits ?? [],
      documents: program?.documents ?? [],
      strategyTip: program?.strategyTip,
      period: program?.period,
      deadline: program?.deadline,
    },
    attachments: {
      passed_sample_pdf: samplePdf || "미설정 — 양식 템플릿 적용",
      government_form_pdf: formPdf || "공고 원문·양식 개요",
    },
  };
};

export const buildFullPlanPrompt = (startupInput, announcement) =>
  [
    STARTUP_PACKAGE_PLAN_INSTRUCTIONS,
    "",
    "## startup_input",
    JSON.stringify(startupInput, null, 2),
    announcement
      ? ["", "## announcement-analyst", JSON.stringify(announcement, null, 2)].join("\n")
      : "",
    "",
    "## sections 필수 section_title",
    JSON.stringify(REQUIRED_SECTION_TITLES),
    "",
    "위 지시문과 startup_input만 근거로 JSON 작성",
  ].join("\n");
