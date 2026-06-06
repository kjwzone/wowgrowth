# 실행 모드 (gov-funding-plan)

| 사용자 요청 | 모드 | subagent_type |
|------------|------|---------------|
| "정부과제 사업계획서 써줘", "TIPS 지원" | **풀 파이프라인** | 5명 전원 |
| "기술성만 써줘" | **기술성** | announcement-analyst → tech-writer → submission-reviewer |
| "사업성만 써줘" | **사업성** | announcement-analyst → biz-writer → submission-reviewer |
| "예산만 편성해줘" | **예산** | announcement-analyst → budget-planner → submission-reviewer |
| "이 사업계획서 검토해줘" | **리뷰** | submission-reviewer 단독 |

## 부분 모드 주의

- **예산 모드**: `02_tech_proposal.md`, `03_biz_proposal.md`가 없으면 사용자에게 기존 문서 제공 요청 또는 Phase 2a·2b 선행
- **리뷰 모드**: `_workspace/gov-funding-plan/` 기존 파일 또는 사용자 첨부를 해당 파일명으로 배치

## grant-writer / business-plan-writer 와 구분

| 유형 | 스킬 | 작성 구조 |
|------|------|----------|
| R&D·TIPS·정부과제 | **gov-funding-plan** | 기술성 + 사업성 **분리** |
| 보조금·창업패키지·통합형 | **business-plan-writer** | plan-writer **통합** 계획서 |
