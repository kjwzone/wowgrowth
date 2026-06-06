import type { MatchingResult } from "@/types";

export const matchingResults: MatchingResult[] = [
  {
    programId: "prog-001",
    programTitle: "2026 초기창업패키지",
    agency: "창업진흥원",
    score: 94,
    level: "high",
    reasons: [
      "IT·SaaS 업종이 창업패키지 우선 지원 분야와 일치",
      "창업 2년차 성장 단계 적합",
      "벤처기업·이노비즈 인증 보유",
      "매출 12억원 규모로 사업화 가능성 입증",
    ],
    gaps: ["고용 증대 계획 구체화 필요"],
    suggestions: [
      "2026년 채용 5명 계획을 사업계획서에 반영",
      "베타 고객 50社 사용 실적 강조",
    ],
  },
  {
    programId: "prog-005",
    programTitle: "청년창업사관학교",
    agency: "중소벤처기업부",
    score: 91,
    level: "high",
    reasons: [
      "대표자 연령 요건 충족",
      "혁신 아이템(AI SaaS) 보유",
      "기술 특허 1건 등록",
    ],
    gaps: ["데모데이 발표 자료 미준비"],
    suggestions: ["3분 피치덱 초안 작성", "TAM/SAM/SOM 시장 규모 제시"],
  },
  {
    programId: "prog-002",
    programTitle: "중소기업 기술개발 지원사업",
    agency: "중소벤처기업부",
    score: 88,
    level: "high",
    reasons: [
      "AI 매칭·생성 기술 R&D 과제 적합",
      "연구 인력 6명 보유",
      "자부담 재원 확보 가능",
    ],
    gaps: ["TRL 단계 정의 필요", "공동연구 파트너 미정"],
    suggestions: ["대학·연구소 MOU 추진", "기술개발 로드맵 12개월 작성"],
  },
];

export const getMatchingByProgramId = (
  programId: string,
): MatchingResult | undefined =>
  matchingResults.find((m) => m.programId === programId);
