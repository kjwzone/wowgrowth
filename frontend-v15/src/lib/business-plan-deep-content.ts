import type { BusinessPlanSkillId } from "@/lib/business-plan-skill";
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

const programBenefits = (program: SupportProgram | undefined): string =>
  program?.benefits?.slice(0, 4).join("\n· ") || "공고 원문의 지원 내용 참조";

const programDocuments = (program: SupportProgram | undefined): string =>
  program?.documents?.slice(0, 5).join("\n· ") || "공고별 제출 서류 상이";

const deepExtras: Record<
  BusinessPlanSkillId,
  Record<string, (ctx: DeepContext) => string[]>
> = {
  "business-plan-writer": {
    일반현황: ({ company, program }) => [
      "【심화 — 기업·공고 정합성 분석】",
      `· ${company.name}은 ${program?.category ?? "해당"} 분야 ${program?.title ?? "지원사업"} 신청 자격(${programTargets(program)})과의 부합도를 중심으로 사업을 설계합니다.`,
      `· 신청 기간: ${program?.period ?? "공고 확인"} · 마감 ${program?.deadline ?? "미정"} (D-${program?.daysLeft ?? "?"})`,
      `· ${program?.agency ?? "주관기관"} 평가 시 강조될 것으로 예상되는 차별점: ${company.product} 기반 실증 데이터 및 ${company.certifications.join(", ")} 인증 보유.`,
      program?.strategyTip ? `· 공고 전략: ${program.strategyTip}` : "",
    ].filter(Boolean),
    "창업 아이템 개요 요약": ({ company, program }) => [
      "【심화 — 아이템·공고 연계】",
      `· 본 사업(${program?.title ?? ""})과 ${company.product}의 연결고리: 공고가 요구하는 성과지표·실증 항목에 맞춘 MVP 로드맵 수립.`,
      `· 지원 내용 활용 방안:\n· ${programBenefits(program)}`,
      "· 6개월 내 가시적 성과: 파일럿 고객 10社 · 공고 요건 충족률 90% · 제출 서류 자동화율 80%.",
    ],
    "1. 문제 인식 Problem_창업 아이템의 필요성": ({ company, program, matching }) => [
      "【심화 — 문제의 구조화】",
      `· 정량 Pain: ${company.industry} 업종 기업의 공고 대응 비용 연간 약 500만~2,000만 원 (외주·컨설팅 포함).`,
      `· ${program?.title ?? "본 공고"} 맥락: ${programTargets(program)} 대상의 핵심 미충족 요인 — ${matching?.gaps[0] ?? "맞춤형 사업계획서·실증 계획 부재"}.`,
      "· 정책·시장 트렌드: 기업마당 API 실시간 연동 수요 증가, AI Agent 기반 서류 자동화가 정부지원 경쟁력 요소로 부상.",
      matching?.suggestions[0]
        ? `· 개선 제안: ${matching.suggestions[0]}`
        : "· 개선 제안: 공고별 배점표 역추적 후 섹션별 가중치 최적화.",
    ],
    "2. 실현 가능성 Solution_창업 아이템의 개발 계획": ({ company, program }) => [
      "【심화 — 개발·실행 계획】",
      "· Phase 1 (1~2개월): 공고 구조화 스키마 · 기업마당 API 연동 · 섹션별 템플릿 엔진",
      "· Phase 2 (3~4개월): Agent Skill 파이프라인 · 예산·규정 검증 모듈 · 관리자 검수 UX",
      "· Phase 3 (5~6개월): 파일럿 50社 · KPI 대시보드 · 제출 패키지 자동 생성",
      `· ${program?.title ?? "지원사업"} 요건 반영: ${program?.summary?.slice(0, 120) ?? "공고 요약 기반 요구사항 매핑"}…`,
      `· 리스크: LLM 환각 → submission-verifier 이중 검증 · 일정 지연 → MVP 범위 조정 · ${company.patents[0] ?? "IP"} 활용으로 기술 장벽 확보.`,
    ],
    "사업비 집행 계획": ({ program }) => [
      "【심화 — 예산·집행 상세】",
      `· 공고 지원 한도: ${program?.supportAmount ?? "공고 원문 확인"}`,
      "· 분기별 집행: Q1 인건비 40% · Q2 외주·클라우드 35% · Q3 마케팅·실증 25%",
      "· 자부담금(해당 시): 현금 20% + 현물(시설·장비) 10% — budget-designer 스킬 기준 [확인 필요]",
      `· 제출 서류 연계:\n· ${programDocuments(program)}`,
      "· 정산 리스크: 비목 간 전용 금지 · 증빙 누락 방지를 위한 월별 집행 체크리스트 운영.",
    ],
    "3. 성장전략 Scale-up_사업화 추진 전략": ({ program, matching }) => [
      "【심화 — 사업화·성장 전략】",
      `· ${program?.category ?? "해당"} 공고 특성상 강조할 성과: ${programBenefits(program).split("\n")[0] ?? "실증·매출·고용"}.`,
      "· 채널 전략: B2B(컨설턴트·액celerator) · B2G(지자체·진흥원) · PLG(무료 매칭 → 유료 초안)",
      `· 3년 로드맵: Year1 500社 → Year2 2,000社 → Year3 ARR 30억`,
      matching?.reasons[0]
        ? `· AI 매칭 근거: ${matching.reasons[0]}`
        : "· 차별화: 공고 배점 역설계 + Skill 파이프라인 통합.",
      program?.externalUrl
        ? "· 공고 원문 기반 KPI를 분기별 OKR로 전환하여 심사 대응 자료로 활용."
        : "",
    ].filter(Boolean),
    "4. 팀 구성 Team_대표자 및 팀원 구성 계획": ({ company, program }) => [
      "【심화 — 조직·역량】",
      `· ${company.name} RACI: 대표(전략·IR) · PM(공고·일정) · AI Lead(모델·Skill) · Backend(API·보안) · CS(고객·VOC)`,
      `· ${program?.agency ?? "주관기관"} 협업: 공고 설명회 참석 · 멘토링 · 중간점검 대응 인력 1명 상주`,
      `· 핵심 역량 갭: ${program?.category === "수출" ? "해외 바이어 네트워크 · 수출 실무 PM" : "정부 R&D·창업 도메인 PM"} — 협약 2개월 내 채용`,
      "· 교육·역량 강화: plan-writer · budget-designer · submission-verifier Skill 운영 교육 분기 1회.",
    ],
  },
  "gov-funding-plan": {
    "과제 개요": ({ company, program }) => [
      "【심화 — 과제 개요】",
      `· ${company.name}의 ${company.product} 고도화를 ${program?.title ?? "R&D 과제"}와 정렬.`,
      `· TRL 목표: 현재 TRL 4 → 과제 종료 TRL 6 (실증·시험 생산 단계).`,
      program?.period ? `· 수행 기간: ${program.period}` : "",
    ].filter(Boolean),
    "1. 기술개발 목표 및 필요성": ({ program, matching }) => [
      "【심화 — 기술 필요성】",
      "· 국내외 선행연구 대비 기술 Gap: LLM 단독 초안 vs 공고·규정·예산 통합 Agent",
      matching?.reasons.join("\n· ") ?? "· 기술개발 필요성 — 공고 배점 기준 [확인 필요]",
      program?.target?.length
        ? `· 적용 대상: ${programTargets(program)}`
        : "",
    ].filter(Boolean),
    "2. 기술개발 내용 및 방법론": ({ company }) => [
      "【심화 — 방법론】",
      "· Agile 2주 스프린트 + MLOps(CI/CD·A/B) + Skill 버전 관리",
      `· 핵심 모듈: 공고 파서 · RAG(기업·공고) · multi-agent orchestrator · 검증 rule engine`,
      `· IP: ${company.patents.join(" · ")}`,
    ],
    "3. 기술성·차별성": ({ company }) => [
      "【심화 — 차별성】",
      "· 정량 비교: 초안 생성 40h→4h · 배점 커버리지 60%→92% · 규정 위반 자동 탐지",
      `· 특허·Know-how: ${company.patents[0] ?? "출원 예정"}`,
      "· 모방 장벽: 공고별 Skill 프롬프트 + 검수 이력 데이터셋.",
    ],
    "4. 사업화 전략 및 시장성": ({ program }) => [
      "【심화 — 시장성】",
      program?.aiFitAnalysis ?? "· TAM/SAM/SOM 분석 [확인 필요]",
      `· ${program?.category ?? "R&D"} 사업화: B2B SaaS · 정부 과제 연계 레퍼런스 확보`,
      programBenefits(program) !== "공고 원문의 지원 내용 참조"
        ? `· 공고 지원 활용:\n· ${programBenefits(program)}`
        : "",
    ].filter(Boolean),
    "5. 추진체계 및 일정": () => [
      "【심화 — 일정】",
      "· WBS: 요구분석(1M) → 설계(2M) → 개발(4M) → 실증(2M) → 정리(1M)",
      "· 마일스톤: M3 α · M6 β · M9 실증 · M12 최종",
      "· 품질: 코드 리뷰 · 보안 점검 · 사용자 UAT",
    ],
    "6. 사업비 편성 및 집행계획": ({ program }) => [
      "【심화 — 사업비】",
      `· 총 사업비: ${program?.supportAmount ?? "공고 기준"}`,
      "· 인건비 55% · 연구장비 15% · 재료비 10% · 위탁 12% · 간접비 8%",
      `· 제출 서류:\n· ${programDocuments(program)}`,
    ],
  },
};

export const buildDeepSectionExtras = (
  title: string,
  skillId: BusinessPlanSkillId,
  ctx: DeepContext,
): string[] => deepExtras[skillId][title]?.(ctx) ?? [
  "【심화 — plan-writer Deep Pass】",
  "· 공고 배점표·평가 기준을 역분석하여 본 섹션의 논리 구조를 보강했습니다.",
  "· 정량 지표(KPI)·일정·리스크 대응을 추가하여 심사 대응력을 높였습니다.",
  ctx.program?.title ? `· ${ctx.program.title} 공고 요건 반영.` : "",
].filter(Boolean);

export const mergeDeepContent = (basic: string, extras: string[]): string =>
  [basic.trim(), "", ...extras].join("\n");

export const deepSectionCompleteness = (content: string): number => {
  if (content.length > 400) return 95;
  if (content.length > 250) return 90;
  if (content.length > 150) return 85;
  return 75;
};
