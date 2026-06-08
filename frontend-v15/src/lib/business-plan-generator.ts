import { companyProfile } from "@/data/company";
import {
  buildBudgetSectionContentFromProgram,
  parseBudgetConstraintsFromProgram,
  serializeBudgetExecutionPlan,
  buildBudgetExecutionPlanFromProgram,
} from "@/lib/budget-execution-plan-model";
import { toMatchingResult } from "@/lib/matching-score";
import { getProgramById } from "@/data/programs";
import {
  getSectionTitlesForSkill,
  sectionIdFromTitle,
} from "@/lib/business-plan-sections";
import {
  getPipelineForSkill,
  PROMPT_VERSION,
  selectBusinessPlanSkill,
  type BusinessPlanSkillId,
  type PipelineAgentStep,
} from "@/lib/business-plan-skill";
import {
  buildDeepSectionExtras,
  deepSectionCompleteness,
  mergeDeepContent,
} from "@/lib/business-plan-deep-content";
import { normalizeBusinessPlanContent } from "@/lib/business-plan-outline";
import {
  buildTeamCompositionPlan,
  serializeTeamCompositionPlan,
} from "@/lib/team-composition-model";
import type { BusinessPlanDraft, BusinessPlanSection, SupportProgram } from "@/types";

let draftProgramOverride: SupportProgram | undefined;

export const setDraftProgram = (program: SupportProgram | undefined): void => {
  draftProgramOverride = program;
};

export const clearDraftProgram = (): void => {
  draftProgramOverride = undefined;
};

const resolveProgram = (programId: string): SupportProgram | undefined => {
  if (draftProgramOverride?.id === programId) return draftProgramOverride;
  return getProgramById(programId);
};

const buildMatchingContext = (programId: string) => {
  const program = resolveProgram(programId);
  if (!program) return undefined;
  return toMatchingResult(companyProfile, program);
};

const buildBudgetSectionContent = (ctx: GenerationContext): string => {
  if (!ctx.program) {
    const constraints = parseBudgetConstraintsFromProgram({});
    return serializeBudgetExecutionPlan(
      buildBudgetExecutionPlanFromProgram({
        constraints,
        companyName: ctx.company.name,
        product: ctx.company.product,
      }),
    );
  }
  return buildBudgetSectionContentFromProgram(ctx.program, ctx.company);
};

const FORM_TODO = "[작성 필요]";

const buildProblemSectionContent = (ctx: GenerationContext): string => {
  const { company, matching } = ctx;
  const gaps = matching?.gaps ?? [];
  return [
    "■ (문제점) 고객·시장이 겪는 핵심 문제",
    `1) ${gaps[0] ?? `${FORM_TODO} — 시장·고객의 첫 번째 문제점(정량 지표 포함)`}`,
    `2) ${gaps[1] ?? `${FORM_TODO} — 두 번째 문제점(비용·시간·품질 손실 등)`}`,
    `3) ${FORM_TODO} — 세 번째 문제점(구조적·기술적 한계)`,
    `4) ${FORM_TODO} — 네 번째 문제점(현장 도입·확산 장벽)`,
    "■ (필요성) 본 아이템이 기존 문제를 해결할 수 있는 이유",
    `1) ${company.product} — 위 문제를 해결하는 핵심 접근 및 기술적 근거`,
    `2) 시장·정책 필요성 — ${matching?.suggestions?.[0] ?? FORM_TODO}`,
    `3) 차별적 해결 근거 — ${company.patents[0] ? `${company.patents[0]} 기반 차별성` : FORM_TODO}`,
  ].join("\n");
};

const buildSolutionSectionContent = (ctx: GenerationContext): string => {
  const { company, program } = ctx;
  const period = program?.period ? ` (${program.period})` : "";
  return [
    "■ 선행 개발 실적",
    "| 연도 | 거래처 | 항목 | 내역 | 매출액(원) |",
    `| ${FORM_TODO} | ${FORM_TODO} | ${FORM_TODO} | ${FORM_TODO} | ${FORM_TODO} |`,
    "○ 보유 실적이 없을 경우 위 양식에 추후 기재(공란 유지)",
    "■ 지식재산권 확보 현황",
    "| 구분 | 출원·등록번호 | 국가명 | 권리명 | 출원·등록일 | 권리자 |",
    company.patents[0]
      ? `| 특허 | ${FORM_TODO} | 대한민국 | ${company.patents[0]} | ${FORM_TODO} | ${FORM_TODO} |`
      : `| ${FORM_TODO} | ${FORM_TODO} | ${FORM_TODO} | ${FORM_TODO} | ${FORM_TODO} | ${FORM_TODO} |`,
    company.patents[1]
      ? `| 특허 | ${FORM_TODO} | 대한민국 | ${company.patents[1]} | ${FORM_TODO} | ${FORM_TODO} |`
      : "",
    "■ 본 과제 수행 시 선행개발 결과 활용 계획",
    `1) 기술적 측면 — 검증된 요소 기술의 파이프라인 통합·고도화 (${company.product} 핵심 모듈에 이식) ${FORM_TODO}`,
    "2) 사업적 측면 — 기 확보 네트워크·레퍼런스를 테스트베드·세일즈로 활용 " + FORM_TODO,
    "3) 데이터 및 운영 측면 — 실전 데이터·운영 노하우를 학습·검증·운영에 활용 " + FORM_TODO,
    "■ 세부 개발 내용 및 방법",
    `1) [핵심 모듈 1] ${FORM_TODO} — 설계·구현 방법`,
    `2) [핵심 모듈 2] ${FORM_TODO} — 검증·품질 확보 방법`,
    `3) [핵심 모듈 3] ${FORM_TODO} — 통합·자동화 방법`,
    `4) [UX/UI] ${FORM_TODO} — 사용자 인터페이스·사용성`,
    `○ MVP 예상도 — 협약기간${period} 내 시제품(베타) 범위·핵심 기능·산출물 ${FORM_TODO}`,
    "■ 경쟁기술 대비 차별성 및 우월성",
    "| 기능·기술 항목 | 자사 | 경쟁사 A | 경쟁사 B | 비고(기술적 차별성) |",
    `| ${FORM_TODO} | O | ${FORM_TODO} | ${FORM_TODO} | ${FORM_TODO} |`,
    `| ${FORM_TODO} | O | ${FORM_TODO} | ${FORM_TODO} | ${FORM_TODO} |`,
    "■ 사업 추진 일정 (협약기간 내)",
    "| 구분 | 추진 내용 | 추진 기간 | 세부 내용 |",
    `| 1 | 핵심 인력 채용·개발 환경 구축 | 1~2개월 | ${FORM_TODO} |`,
    `| 2 | 핵심 모듈 설계·아키텍처 | 1~3개월 | ${FORM_TODO} |`,
    `| 3 | 핵심 기능 개발 | 3~6개월 | ${FORM_TODO} |`,
    `| 4 | 통합·검증·고도화 | 6~8개월 | ${FORM_TODO} |`,
    `| 5 | 시제품(MVP) 완성·실증 | 9~10개월 | ${FORM_TODO} |`,
  ]
    .filter(Boolean)
    .join("\n");
};

const buildGrowthSectionContent = (ctx: GenerationContext): string => {
  const { program } = ctx;
  const period = program?.period ?? "지원사업 협약기간";
  return [
    "■ 목표 시장 및 고객 분석",
    "| 시장 구분 | 규모(시장 금액) | 산출 근거 (Estimation Logic) |",
    `| TAM (전체시장) | ${FORM_TODO} | 본 아이템이 속한 전체 시장 규모 — 공신력 있는 시장 보고서의 총량 기준 |`,
    `| SAM (유효시장) | ${FORM_TODO} | 전체 시장 중 자사 솔루션이 도달 가능한 세그먼트 × 전환율 적용 |`,
    `| SOM (수익시장, 초기 3년) | ${FORM_TODO} | 핵심 타겟 고객군 Bottom-up(고객 수 × 객단가) 산출 |`,
    "○ TAM/SAM/SOM 수치는 고객사 수가 아닌 시장 규모 금액으로 기재",
    "■ 고객 요구사항 분석",
    "| 고객군 | 타겟 대상 | 핵심 니즈(Pain Point) | 개선점(Solution) |",
    `| 1차 타겟(Core) | ${FORM_TODO} | ${FORM_TODO} | ${FORM_TODO} |`,
    `| 2차 타겟(Expansion) | ${FORM_TODO} | ${FORM_TODO} | ${FORM_TODO} |`,
    `| 3차 타겟(Potential) | ${FORM_TODO} | ${FORM_TODO} | ${FORM_TODO} |`,
    "■ 사업화 목표",
    "○ 매출·수출·투자 목표 (단위: 백만원)",
    "| 구분 | 1년차 | 2년차 | 3년차 | 4년차 | 5년차 |",
    `| 매출 계획 | ${FORM_TODO} | ${FORM_TODO} | ${FORM_TODO} | ${FORM_TODO} | ${FORM_TODO} |`,
    `| 수출 계획 | ${FORM_TODO} | ${FORM_TODO} | ${FORM_TODO} | ${FORM_TODO} | ${FORM_TODO} |`,
    `| 투자 계획 | ${FORM_TODO} | ${FORM_TODO} | ${FORM_TODO} | ${FORM_TODO} | ${FORM_TODO} |`,
    "○ 고용 창출 목표 (단위: 명)",
    "| 구분 | 당해 | 종료후 1년 | 종료후 2년 | 종료후 3년 |",
    `| 신규 고용 | ${FORM_TODO} | ${FORM_TODO} | ${FORM_TODO} | ${FORM_TODO} |`,
    `| 상시 고용 | ${FORM_TODO} | ${FORM_TODO} | ${FORM_TODO} | ${FORM_TODO} |`,
    "■ 사업화 전략",
    "○ 수익 모델 (BM)",
    "| 구분 | 타겟 고객 | 수익 구조(Pricing) | 예상 단가·매출 |",
    `| B2B SaaS(구독형) | ${FORM_TODO} | ${FORM_TODO} | ${FORM_TODO} |`,
    `| API 공급(종량제) | ${FORM_TODO} | ${FORM_TODO} | ${FORM_TODO} |`,
    "○ 경쟁사 비교 및 차별화 전략",
    "| 구분 | 빅테크 범용 AI | 기존 업계 | 자사(동 과제 산출물) |",
    `| 핵심 기술 | ${FORM_TODO} | ${FORM_TODO} | ${FORM_TODO} |`,
    `| 차별화 포인트 | ${FORM_TODO} | ${FORM_TODO} | ${FORM_TODO} |`,
    `○ 시장 진입·마케팅 전략(GTM) — 1년차 레퍼런스 마케팅 / 2년차 파트너십 확산 / 3년차 글로벌 확장 ${FORM_TODO}`,
    `○ [이미지] 비즈니스 모델(BM) 구조도 — ${FORM_TODO} (구조도 이미지 첨부)`,
    "■ 글로벌 진출 로드맵",
    `1) Phase 1 — 기술 검증·해외 베타 테스트 [수정 필요]`,
    `2) Phase 2 — 본격 진출(마켓플레이스 입점·현지 인증) [수정 필요]`,
    `3) Phase 3 — 현지화·파트너십 확대 [수정 필요]`,
    "■ 목표시장의 성장성, 진출 가능성",
    "| 구분 | 핵심 주제 | 세부 내용 및 근거 |",
    `| 시장 성장성 | ${FORM_TODO} | ${FORM_TODO} |`,
    `| 진출 가능성 | ${FORM_TODO} | ${FORM_TODO} |`,
    `| 파급 효과 | ${FORM_TODO} | ${FORM_TODO} |`,
    "■ 사업 추진 일정 (전체 사업단계)",
    "| 구분 | 추진 내용 | 추진 기간 | 세부 내용 |",
    `| 1 | 핵심 인력 채용·개발 환경 구축 | ${period} 초기 | ${FORM_TODO} |`,
    `| 2 | 핵심 기능 개발·고도화 | ${period} 중 | ${FORM_TODO} |`,
    `| 3 | 시제품(MVP) 완성·실증 | ${period} 말 | ${FORM_TODO} |`,
    `| 4 | 정식 서비스·초기 사업화 | 종료 후 1년 | ${FORM_TODO} |`,
    `| 5 | 매출 확대·투자 유치 | 종료 후 2년 | ${FORM_TODO} |`,
    `| 6 | 글로벌 진출·시장 확장 | 종료 후 3년 | ${FORM_TODO} |`,
    "■ 기대효과",
    "| 구분 | 내용 | 금전적 가치(정량) |",
    `| 기술적 파급효과 | ${FORM_TODO} | ${FORM_TODO} |`,
    `| 경제적 파급효과 | ${FORM_TODO} | ${FORM_TODO} |`,
    `| 사회적 파급효과 | ${FORM_TODO} | ${FORM_TODO} |`,
  ].join("\n");
};

const sectionContentBuilders: Record<
  BusinessPlanSkillId,
  Record<string, (ctx: GenerationContext) => string>
> = {
  "business-plan-writer": {
    일반현황: ({ company, program, matching }) =>
      [
        `■ 기업명: ${company.name}`,
        `■ 사업자등록번호: ${company.businessNumber}`,
        `■ 업종: ${company.industry}`,
        `■ 대표 제품·서비스: ${company.product}`,
        `■ 기업 단계: ${company.stage} · 임직원 ${company.employees}명 · 매출 ${company.revenue}`,
        `■ 인증: ${company.certifications.join(", ")}`,
        `■ 지원사업: ${program?.title ?? ""} (${program?.agency ?? ""})`,
        matching
          ? `■ AI 매칭 적합도: ${matching.score}점 — ${matching.reasons[0] ?? ""}`
          : "",
      ]
        .filter(Boolean)
        .join("\n"),
    "창업 아이템 개요 요약": ({ company, program }) =>
      [
        `【아이템명】 ${company.product}`,
        `【Problem】 중소·스타트업의 정부지원사업 탐색·서류 작성 부담`,
        `【Solution】 ${company.name}의 AI 매칭·사업계획서 자동작성 SaaS`,
        `【Scale-up】 B2B 컨설턴트·액celerator 채널 + 기업마당 API 실시간 연동`,
        `【Team】 AI·정부지원 도메인 전문 인력 ${company.employees}명`,
        program?.strategyTip ? `【공고 전략】 ${program.strategyTip}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
    "1. 문제 인식 Problem_창업 아이템의 필요성": (ctx) =>
      buildProblemSectionContent(ctx),
    "2. 실현 가능성 Solution_창업 아이템의 개발 계획": (ctx) =>
      buildSolutionSectionContent(ctx),
    "사업비 집행 계획": (ctx) => buildBudgetSectionContent(ctx),
    "3. 성장전략 Scale-up_사업화 추진 전략": (ctx) =>
      buildGrowthSectionContent(ctx),
    "4. 팀 구성 Team_대표자 및 팀원 구성 계획": ({ company, program }) =>
      serializeTeamCompositionPlan(buildTeamCompositionPlan(company, program)),
  },
  "gov-funding-plan": {
    "과제 개요": ({ company, program }) =>
      `${company.name} — ${program?.title ?? "R&D 과제"}: ${company.product} 고도화`,
    "1. 기술개발 목표 및 필요성": ({ matching }) =>
      matching?.reasons.join("\n") ?? "기술개발 필요성 [확인 필요]",
    "2. 기술개발 내용 및 방법론": ({ company }) =>
      `개발 방법론: Agile + MLOps · ${company.patents[0] ?? "핵심 IP"} 기반`,
    "3. 기술성·차별성": ({ company }) =>
      company.patents.map((p) => `· ${p}`).join("\n"),
    "4. 사업화 전략 및 시장성": ({ program }) =>
      program?.aiFitAnalysis ?? "시장성 분석 [확인 필요]",
    "5. 추진체계 및 일정": () =>
      "1차년도: TRL 5→6 · 2차년도: TRL 6→7 · 분기별 마일스톤",
    "6. 사업비 편성 및 집행계획": (ctx) => buildBudgetSectionContent(ctx),
  },
};

type BuildDepth = "basic" | "deep";

type GenerationContext = {
  company: typeof companyProfile;
  program: SupportProgram | undefined;
  matching: ReturnType<typeof buildMatchingContext>;
};

const buildContext = (programId: string): GenerationContext => ({
  company: companyProfile,
  program: resolveProgram(programId),
  matching: buildMatchingContext(programId),
});

const sectionCompleteness = (content: string, depth: BuildDepth): number => {
  if (depth === "deep") return deepSectionCompleteness(content);
  if (content.length > 80) return 85;
  if (content.length > 20) return 55;
  return 20;
};

const buildSection = (
  title: string,
  skillId: BusinessPlanSkillId,
  ctx: GenerationContext,
  existing?: BusinessPlanSection,
  depth: BuildDepth = "basic",
): BusinessPlanSection => {
  const builder = sectionContentBuilders[skillId][title];
  const basicContent =
    depth === "deep" || !existing?.content?.trim()
      ? builder?.(ctx) ?? `[${title}] — plan-writer 초안 [확인 필요]`
      : existing.content;

  const rawContent =
    depth === "deep"
      ? mergeDeepContent(builder?.(ctx) ?? basicContent, buildDeepSectionExtras(title, skillId, ctx))
      : existing?.content?.trim()
        ? existing.content
        : basicContent;

  const content = normalizeBusinessPlanContent(rawContent);

  return {
    id: existing?.id ?? sectionIdFromTitle(title),
    title,
    content,
    completeness: sectionCompleteness(content, depth),
  };
};

export const createEmptyDraft = (programId: string): BusinessPlanDraft => {
  const program = resolveProgram(programId);
  const skillId = selectBusinessPlanSkill({
    title: program?.title,
    category: program?.category,
    agency: program?.agency,
  });
  const titles = getSectionTitlesForSkill(skillId);
  const ctx = buildContext(programId);

  const sections = titles.map((title) =>
    buildSection(title, skillId, ctx, undefined),
  );

  const filled = sections.filter((s) => s.content.length > 50).length;
  const overallCompleteness = Math.round((filled / sections.length) * 100);

  return {
    id: `plan-${programId}`,
    programId,
    programTitle: program?.title ?? "지원사업",
    skillId,
    promptVersion: PROMPT_VERSION,
    pipelineSteps: getPipelineForSkill(skillId).map((step) => ({
      ...step,
      status: "pending" as const,
    })),
    sections,
    overallCompleteness,
    status: "draft",
  };
};

export const generateSectionContent = (
  draft: BusinessPlanDraft,
  sectionId: string,
): BusinessPlanDraft => {
  const ctx = buildContext(draft.programId);
  const sections = draft.sections.map((section) =>
    section.id === sectionId
      ? buildSection(section.title, draft.skillId, ctx, section, "deep")
      : section,
  );
  return recalcDraft({ ...draft, sections });
};

export const runPipelineStep = (
  draft: BusinessPlanDraft,
  stepIndex: number,
): BusinessPlanDraft => {
  const pipeline = draft.pipelineSteps ?? [];
  const steps = pipeline.map((step, i) => ({
    ...step,
    status:
      i < stepIndex
        ? ("done" as const)
        : i === stepIndex
          ? ("running" as const)
          : ("pending" as const),
  }));
  return { ...draft, pipelineSteps: steps, activeAgent: steps[stepIndex]?.agent };
};

export const completePipeline = (draft: BusinessPlanDraft): BusinessPlanDraft => {
  const ctx = buildContext(draft.programId);
  const sections = getSectionTitlesForSkill(draft.skillId).map((title) => {
    const existing = draft.sections.find((s) => s.title === title);
    return buildSection(title, draft.skillId, ctx, existing);
  });

  const pipeline = (draft.pipelineSteps ?? getPipelineForSkill(draft.skillId)).map(
    (step) => ({ ...step, status: "done" as const }),
  );

  return recalcDraft({
    ...draft,
    sections,
    pipelineSteps: pipeline,
    activeAgent: undefined,
    status: "review",
  });
};

const recalcDraft = (draft: BusinessPlanDraft): BusinessPlanDraft => {
  const avg = draft.sections.reduce((sum, s) => sum + s.completeness, 0);
  return {
    ...draft,
    overallCompleteness: Math.round(avg / Math.max(draft.sections.length, 1)),
  };
};

export const getPipelineDelayMs = (_step: PipelineAgentStep): number => 400;
