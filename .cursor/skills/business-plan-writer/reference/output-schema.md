# 출력 스키마 (WOW Growth MVP)

앱 API가 기대하는 JSON은 `businessPlanDraftSchema`와 동일하다.

## 필수 sections (순서 유지)

`REQUIRED_BUSINESS_PLAN_SECTION_TITLES` (`startup-package-plan-instructions.ts`):

1. 일반현황
2. 창업 아이템 개요 요약
3. 1. 문제 인식 Problem_창업 아이템의 필요성
4. 2. 실현 가능성 Solution_창업 아이템의 개발 계획
5. 사업비 집행 계획
6. 3. 성장전략 Scale-up_사업화 추진 전략
7. 4. 팀 구성 Team_대표자 및 팀원 구성 계획

## JSON 골격

```json
{
  "title": "초기창업패키지 창업기업 사업계획서 — {아이템명}",
  "premises": "입력 부족·추정 요약",
  "sections": [
    { "section_title": "일반현황", "content": "마크다운 표·개조식, 마침표 없음" }
  ],
  "self_verification": [
    { "item": "양식 적합", "result": "충족|부분충족|미충족", "notes": "" }
  ],
  "key_risks": [],
  "evidence_checklist": []
}
```

## 마크다운 → JSON 변환 시

- `02_business_plan.md` 본문을 섹션 제목 기준으로 split
- 개인정보 마스킹 (OOO, ○○대 ○○전공)
- mermaid·코드펜스 금지
- 입력에 없는 실적·특허·매출 임의 생성 금지
- 추정은 "예상" / "[출처 확인 필요]" 표기

## 저장 위치 (앱)

- DB: `business_plan_drafts.plan_json`
- UI: `/business-plans/[id]`
