import type { BusinessPlanDraft } from "@/types";

export const businessPlanDraft: BusinessPlanDraft = {
  id: "plan-001",
  programId: "prog-001",
  programTitle: "2026 초기창업패키지",
  overallCompleteness: 68,
  status: "draft",
  sections: [
    {
      id: "sec-1",
      title: "1. 사업 개요",
      completeness: 85,
      content:
        "와우그로스(주)는 AI 기반 정부지원사업 매칭·사업계획서 자동작성 SaaS를 제공합니다. 중소기업·스타트업이 복잡한 공고를 빠르게 이해하고, 맞춤형 사업계획서 초안을 생성할 수 있도록 지원합니다.",
    },
    {
      id: "sec-2",
      title: "2. 문제 인식 및 필요성",
      completeness: 72,
      content:
        "정부지원사업 공고는 연간 1만 건 이상 공개되나, 기업은 적합 공고 탐색과 서류 작성에 평균 40시간 이상 소요합니다. AI 기반 자동화로 탐색·작성 시간을 80% 단축할 수 있습니다.",
    },
    {
      id: "sec-3",
      title: "3. 목표 및 추진 전략",
      completeness: 60,
      content:
        "2026년 하반기 MAU 500社, 매칭 정확도 90% 달성을 목표로 합니다. 기업마당 API 연동, AI 에이전트 고도화, 컨설턴트 B2B 채널 확대를 추진합니다.",
    },
    {
      id: "sec-4",
      title: "4. 기술 개발 및 차별성",
      completeness: 55,
      content:
        "Gemini 기반 공고 구조화·매칭 엔진과 Cursor Agent Skill 파이프라인을 결합한 하이브리드 AI 아키텍처를 보유합니다.",
    },
    {
      id: "sec-5",
      title: "5. 사업화 및 기대효과",
      completeness: 45,
      content: "",
    },
    {
      id: "sec-6",
      title: "6. 예산 및 자금 집행 계획",
      completeness: 30,
      content: "",
    },
  ],
};
