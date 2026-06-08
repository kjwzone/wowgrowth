import type { DashboardInsight, DashboardStats } from "@/types";

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
