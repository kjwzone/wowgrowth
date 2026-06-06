import type { AdminReviewItem, DashboardInsight, DashboardStats } from "@/types";

export const dashboardStats: DashboardStats = {
  diagnosisStatus: "완료",
  diagnosisScore: 82,
  recommendedCount: 6,
  activePlans: 2,
  readinessScore: 74,
};

export const dashboardInsights: DashboardInsight[] = [
  {
    id: "ins-1",
    title: "AI 인사이트",
    body: "청년창업사관학교 마감 D-3입니다. 사업계획서 초안을 우선 완성하세요.",
    type: "alert",
  },
  {
    id: "ins-2",
    title: "매칭 추천",
    body: "초기창업패키지 적합도 94% — 현재 가장 유리한 공고입니다.",
    type: "success",
  },
  {
    id: "ins-3",
    title: "제출 준비도",
    body: "사업계획서 5·6장(사업화·예산) 보완 시 제출 준비도 85%까지 상승 예상.",
    type: "tip",
  },
];

export const adminReviewItems: AdminReviewItem[] = [
  {
    id: "rev-001",
    companyName: "와우그로스(주)",
    applicant: "김종우",
    programTitle: "2026 초기창업패키지",
    submittedAt: "2026-06-05",
    aiDocumentTitle: "초기창업패키지 사업계획서 v1",
    status: "대기",
    adminComment: "",
  },
  {
    id: "rev-002",
    companyName: "테크스타트(주)",
    applicant: "이민지",
    programTitle: "청년창업사관학교",
    submittedAt: "2026-06-04",
    aiDocumentTitle: "청년창업사관학교 사업계획서 v2",
    status: "보완요청",
    adminComment: "시장 규模 데이터 출처를 보완해 주세요.",
  },
  {
    id: "rev-003",
    companyName: "그린팩토리(주)",
    applicant: "박준호",
    programTitle: "스마트공장 구축 지원사업",
    submittedAt: "2026-06-02",
    aiDocumentTitle: "스마트공장 구축계획서 v1",
    status: "승인",
    adminComment: "승인 완료. 제출 서류 최종 확인됨.",
  },
  {
    id: "rev-004",
    companyName: "데이터랩(주)",
    applicant: "최서연",
    programTitle: "데이터바우처 지원사업",
    submittedAt: "2026-06-01",
    aiDocumentTitle: "데이터 활용계획서 v1",
    status: "반려",
    adminComment: "자부담 재원 증빙이 누락되었습니다.",
  },
];
