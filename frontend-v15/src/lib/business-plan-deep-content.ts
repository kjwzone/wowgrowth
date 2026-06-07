import type { BusinessPlanSkillId } from "@/lib/business-plan-skill";
import {
  formatDeepBlockHeader,
  formatOutlineItem,
  normalizeBusinessPlanContent,
} from "@/lib/business-plan-outline";
import type { SupportProgram } from "@/types";

type DeepContext = {
  company: {
    name: string;
    industry: string;
    product: string;
    stage: string;
    employees: number;
    revenue: string;
    certifications: string[];
    patents: string[];
  };
  program: SupportProgram | undefined;
  matching?: {
    score: number;
    reasons: string[];
    gaps: string[];
    suggestions: string[];
  };
};

const programTargets = (program: SupportProgram | undefined): string =>
  program?.target?.slice(0, 5).join(" · ") || "공고 원문 기준";

const programBenefits = (program: SupportProgram | undefined): string[] =>
  program?.benefits?.slice(0, 4).map((b) => formatOutlineItem(b)) ?? [
    "공고 원문 지원 내용 참조 필요",
  ];

const programDocuments = (program: SupportProgram | undefined): string[] =>
  program?.documents?.slice(0, 5).map((d) => formatOutlineItem(d)) ?? [
    "공고별 제출 서류 상이 — 원문 확인 필요",
  ];

const deepExtras: Record<
  BusinessPlanSkillId,
  Record<string, (ctx: DeepContext) => string[]>
> = {
  "business-plan-writer": {
    일반현황: ({ company, program }) => [
      formatDeepBlockHeader("기업·공고 정합성 분석"),
      formatOutlineItem(
        `${company.name} — ${program?.category ?? "해당"} 분야 ${program?.title ?? "지원사업"} 신청 자격(${programTargets(program)}) 부합도 중심 사업 설계 추진`,
      ),
      formatOutlineItem(
        `신청 기간 ${program?.period ?? "공고 확인"} · 마감 ${program?.deadline ?? "미정"} (D-${program?.daysLeft ?? "?"}) 대응 일정 수립`,
      ),
      formatOutlineItem(
        `${program?.agency ?? "주관기관"} 평가 강조 예상 차별점 — ${company.product} 실증 데이터 · ${company.certifications.join(", ")} 인증 보유`,
      ),
      program?.strategyTip
        ? formatOutlineItem(`공고 전략 — ${program.strategyTip}`)
        : "",
    ].filter(Boolean),
    "창업 아이템 개요 요약": ({ company, program }) => [
      formatDeepBlockHeader("아이템·공고 연계"),
      formatOutlineItem(
        `본 사업(${program?.title ?? ""})과 ${company.product} 연결 — 공고 성과지표·실증 항목 기준 MVP 로드맵 수립`,
      ),
      formatDeepBlockHeader("지원 내용 활용 방안"),
      ...programBenefits(program),
      formatOutlineItem(
        "6개월 내 가시적 성과 — 파일럿 고객 10社 · 공고 요건 충족률 90% · 제출 서류 자동화율 80% 목표",
      ),
    ],
    "1. 문제 인식 Problem_창업 아이템의 필요성": ({ company, program, matching }) => [
      formatDeepBlockHeader("문제의 구조화"),
      formatOutlineItem(
        `정량 Pain — ${company.industry} 업종 공고 대응 비용 연 500만~2,000만 원(외주·컨설팅 포함)`,
      ),
      formatOutlineItem(
        `${program?.title ?? "본 공고"} 맥락 — ${programTargets(program)} 대상 핵심 미충족 요인: ${matching?.gaps[0] ?? "맞춤형 사업계획서·실증 계획 부재"}`,
      ),
      formatOutlineItem(
        "정책·시장 트렌드 — 기업마당 API 실시간 연동 수요 증가 · AI Agent 기반 서류 자동화 경쟁력 요소 부상",
      ),
      matching?.suggestions[0]
        ? formatOutlineItem(`개선 제안 — ${matching.suggestions[0]}`)
        : formatOutlineItem("개선 제안 — 공고별 배점표 역추적 후 섹션별 가중치 최적화"),
    ],
    "2. 실현 가능성 Solution_창업 아이템의 개발 계획": ({ company, program }) => [
      formatDeepBlockHeader("개발·실행 계획"),
      formatOutlineItem("Phase 1 (1~2개월) — 공고 구조화 스키마 · 기업마당 API 연동 · 섹션별 템플릿 엔진"),
      formatOutlineItem("Phase 2 (3~4개월) — Agent Skill 파이프라인 · 예산·규정 검증 모듈 · 관리자 검수 UX"),
      formatOutlineItem("Phase 3 (5~6개월) — 파일럿 50社 · KPI 대시보드 · 제출 패키지 자동 생성"),
      formatOutlineItem(
        `${program?.title ?? "지원사업"} 요건 반영 — ${program?.summary?.slice(0, 120) ?? "공고 요약 기반 요구사항 매핑"}`,
      ),
      formatOutlineItem(
        `리스크 대응 — LLM 환각 → submission-verifier 이중 검증 · 일정 지연 → MVP 범위 조정 · ${company.patents[0] ?? "IP"} 기반 기술 장벽 확보`,
      ),
    ],
    "사업비 집행 계획": ({ program }) => [
      formatDeepBlockHeader("예산·집행 상세"),
      formatOutlineItem(`공고 지원 한도 — ${program?.supportAmount ?? "공고 원문 확인"}`),
      formatOutlineItem("분기별 집행 — Q1 인건비 40% · Q2 외주·클라우드 35% · Q3 마케팅·실증 25%"),
      formatOutlineItem("자부담금(해당 시) — 현금 20% + 현물(시설·장비) 10% [확인 필요]"),
      formatDeepBlockHeader("제출 서류 연계"),
      ...programDocuments(program),
      formatOutlineItem("정산 리스크 — 비목 간 전용 금지 · 월별 집행 체크리스트 운영"),
    ],
    "3. 성장전략 Scale-up_사업화 추진 전략": ({ program, matching }) => [
      formatDeepBlockHeader("사업화·성장 전략"),
      formatOutlineItem(
        `${program?.category ?? "해당"} 공고 강조 성과 — ${program?.benefits?.[0] ?? "실증·매출·고용"}`,
      ),
      formatOutlineItem("채널 전략 — B2B(컨설턴트·액celerator) · B2G(지자체·진흥원) · PLG(무료 매칭 → 유료 초안)"),
      formatOutlineItem("3년 로드맵 — Year1 500社 → Year2 2,000社 → Year3 ARR 30억 목표"),
      matching?.reasons[0]
        ? formatOutlineItem(`AI 매칭 근거 — ${matching.reasons[0]}`)
        : formatOutlineItem("차별화 — 공고 배점 역설계 + Skill 파이프라인 통합"),
      program?.externalUrl
        ? formatOutlineItem("공고 원문 KPI → 분기별 OKR 전환 · 심사 대응 자료 활용")
        : "",
    ].filter(Boolean),
    "4. 팀 구성 Team_대표자 및 팀원 구성 계획": ({ company, program }) => [
      formatDeepBlockHeader("조직·역량"),
      formatOutlineItem(
        `${company.name} RACI — 대표(전략·IR) · PM(공고·일정) · AI Lead(모델·Skill) · Backend(API·보안) · CS(고객·VOC)`,
      ),
      formatOutlineItem(
        `${program?.agency ?? "주관기관"} 협업 — 공고 설명회 · 멘토링 · 중간점검 대응 인력 1명 상주`,
      ),
      formatOutlineItem(
        `핵심 역량 갭 — ${program?.category === "수출" ? "해외 바이어 네트워크 · 수출 실무 PM" : "정부 R&D·창업 도메인 PM"} · 협약 2개월 내 채용`,
      ),
      formatOutlineItem(
        "역량 강화 — plan-writer · budget-designer · submission-verifier Skill 운영 교육 분기 1회",
      ),
    ],
  },
  "gov-funding-plan": {
    "과제 개요": ({ company, program }) => [
      formatDeepBlockHeader("과제 개요"),
      formatOutlineItem(
        `${company.name} ${company.product} 고도화 — ${program?.title ?? "R&D 과제"} 정렬`,
      ),
      formatOutlineItem("TRL 목표 — 현재 TRL 4 → 과제 종료 TRL 6(실증·시험 생산)"),
      program?.period ? formatOutlineItem(`수행 기간 — ${program.period}`) : "",
    ].filter(Boolean),
    "1. 기술개발 목표 및 필요성": ({ program, matching }) => [
      formatDeepBlockHeader("기술 필요성"),
      formatOutlineItem("국내외 선행연구 Gap — LLM 단독 초안 vs 공고·규정·예산 통합 Agent"),
      ...(matching?.reasons.map((r) => formatOutlineItem(r)) ?? [
        formatOutlineItem("기술개발 필요성 — 공고 배점 기준 [확인 필요]"),
      ]),
      program?.target?.length
        ? formatOutlineItem(`적용 대상 — ${programTargets(program)}`)
        : "",
    ].filter(Boolean),
    "2. 기술개발 내용 및 방법론": ({ company }) => [
      formatDeepBlockHeader("방법론"),
      formatOutlineItem("Agile 2주 스프린트 + MLOps(CI/CD·A/B) + Skill 버전 관리"),
      formatOutlineItem("핵심 모듈 — 공고 파서 · RAG(기업·공고) · multi-agent orchestrator · 검증 rule engine"),
      formatOutlineItem(`IP — ${company.patents.join(" · ")}`),
    ],
    "3. 기술성·차별성": ({ company }) => [
      formatDeepBlockHeader("차별성"),
      formatOutlineItem("정량 비교 — 초안 생성 40h→4h · 배점 커버리지 60%→92% · 규정 위반 자동 탐지"),
      formatOutlineItem(`특허·Know-how — ${company.patents[0] ?? "출원 예정"}`),
      formatOutlineItem("모방 장벽 — 공고별 Skill 프롬프트 + 검수 이력 데이터셋"),
    ],
    "4. 사업화 전략 및 시장성": ({ program }) => [
      formatDeepBlockHeader("시장성"),
      formatOutlineItem(program?.aiFitAnalysis ?? "TAM/SAM/SOM 분석 [확인 필요]"),
      formatOutlineItem(`${program?.category ?? "R&D"} 사업화 — B2B SaaS · 정부 과제 연계 레퍼런스 확보`),
      ...(program?.benefits?.length
        ? [formatDeepBlockHeader("공고 지원 활용"), ...programBenefits(program)]
        : []),
    ],
    "5. 추진체계 및 일정": () => [
      formatDeepBlockHeader("일정"),
      formatOutlineItem("WBS — 요구분석(1M) → 설계(2M) → 개발(4M) → 실증(2M) → 정리(1M)"),
      formatOutlineItem("마일스톤 — M3 α · M6 β · M9 실증 · M12 최종"),
      formatOutlineItem("품질 — 코드 리뷰 · 보안 점검 · 사용자 UAT"),
    ],
    "6. 사업비 편성 및 집행계획": ({ program }) => [
      formatDeepBlockHeader("사업비"),
      formatOutlineItem(`총 사업비 — ${program?.supportAmount ?? "공고 기준"}`),
      formatOutlineItem("비목 비율 — 인건비 55% · 연구장비 15% · 재료비 10% · 위탁 12% · 간접비 8%"),
      formatDeepBlockHeader("제출 서류"),
      ...programDocuments(program),
    ],
  },
};

export const buildDeepSectionExtras = (
  title: string,
  skillId: BusinessPlanSkillId,
  ctx: DeepContext,
): string[] =>
  deepExtras[skillId][title]?.(ctx) ?? [
    formatDeepBlockHeader("plan-writer Deep Pass"),
    formatOutlineItem("공고 배점표·평가 기준 역분석 — 본 섹션 논리 구조 보강"),
    formatOutlineItem("정량 KPI·일정·리스크 대응 추가 — 심사 대응력 강화"),
    ctx.program?.title
      ? formatOutlineItem(`${ctx.program.title} 공고 요건 반영`)
      : "",
  ].filter(Boolean);

export const mergeDeepContent = (basic: string, extras: string[]): string =>
  normalizeBusinessPlanContent([basic.trim(), "", ...extras].join("\n"));

export const deepSectionCompleteness = (content: string): number => {
  if (content.length > 400) return 95;
  if (content.length > 250) return 90;
  if (content.length > 150) return 85;
  return 75;
};
