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
    "1. 문제 인식 Problem_창업 아이템의 필요성": ({ company, matching }) =>
      [
        "1) 시장 문제 — 정부지원사업 공고 연 1만 건 이상 공개 · 기업 공고 탐색·서류 작성 평균 40시간 이상 소요",
        "2) 고객 Pain — 공고 해석·배점 기준·양식 불일치로 탈락률 상승 · 컨설턴트 의존 비용 증가",
        `3) ${company.name} 관점 — ${matching?.gaps[0] ?? "공고별 맞춤 사업계획서 작성 역량 보완 필요"}`,
        "4) 개발·도입 필요성 — AI Agent Skill 파이프라인으로 공고 분석→초안→예산→검증 자동화 추진",
      ].join("\n"),
    "2. 실현 가능성 Solution_창업 아이템의 개발 계획": ({ company }) =>
      [
        `■ 핵심 기술: Gemini 기반 공고 구조화 + Cursor Agent Skill(business-plan-writer) 오케스트레이션`,
        `■ 보유 IP: ${company.patents.join(" · ")}`,
        "■ 개발 일정: 2026 Q3 기업마당 API 연동 · Q4 다단계 ai_jobs 파이프라인 · 2027 상용 SaaS 확장",
        "■ 성과지표: 매칭 정확도 90% · 초안 생성 시간 80% 단축 · 관리자 검수 SLA 48h",
        "■ 경쟁 대비: 단순 LLM 초안 대비 공고 배점·양식·규정 준수 검증까지 통합",
      ].join("\n"),
    "사업비 집행 계획": (ctx) => buildBudgetSectionContent(ctx),
    "3. 성장전략 Scale-up_사업화 추진 전략": ({ company, matching }) =>
      [
        "■ TAM/SAM/SOM: 국내 중소·벤처 약 400만社 / 정부지원 수요 50만社 / 1차 목표 5,000社",
        `■ BM: SaaS 구독 + 컨설턴트 B2B + 성공 수수료`,
        `■ 2026 목표: MAU 500社 · 매칭 적합도 ${matching?.score ?? 90}% 유지`,
        `■ GTM: ${company.name} — 창업진흥원·K-Startup 연계 · 세무·노무 파트너 채널`,
        "■ ESG: 중소기업 디지털 전환·일자리 창출 기여",
      ].join("\n"),
    "4. 팀 구성 Team_대표자 및 팀원 구성 계획": ({ company }) =>
      [
        "■ 대표: 정부지원·AI SaaS 10년+ · Series A 준비",
        `■ 핵심 인력: AI(${Math.floor(company.employees / 3)}명) · 백엔드 · PM · CS`,
        `■ 협력: ${company.certifications.includes("벤처기업") ? "벤처캠프·TIPS 멘토" : "지역 창업센터"} 연계`,
        "■ 채용 계획: 사업화 PM 1 · ML Engineer 1 (협약 3개월 내)",
      ].join("\n"),
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
