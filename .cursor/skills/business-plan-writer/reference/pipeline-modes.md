# 실행 모드 (grant-writer / gov-funding-plan)

## grant-writer (보조금·지원사업 — WOW Growth 기본)

| 사용자 요청 | 모드 | subagent_type |
|------------|------|---------------|
| 지원사업 신청 풀 준비 | 풀 파이프라인 | announcement-analyst → plan-writer + budget-designer → compliance-checker → submission-verifier |
| 공고만 분석 | 공고 분석 | announcement-analyst |
| 사업계획서만 | 계획서 | announcement-analyst → plan-writer → compliance-checker |
| 예산만 | 예산 | budget-designer → compliance-checker |
| 기존 계획서 검토 | 검토 | compliance-checker → submission-verifier |

## gov-funding-plan (정부 R&D · TIPS 등)

**전용 스킬:** [gov-funding-plan/SKILL.md](../gov-funding-plan/SKILL.md)

| 사용자 요청 | 모드 | subagent_type |
|------------|------|---------------|
| R&D 사업계획서 전체 | 풀 | announcement-analyst → tech-writer ∥ biz-writer → budget-planner → submission-reviewer |
| 기술성만 | 기술성 | announcement-analyst → tech-writer → submission-reviewer |
| 사업성만 | 사업성 | announcement-analyst → biz-writer → submission-reviewer |
| 예산만 | 예산 | announcement-analyst → budget-planner → submission-reviewer |

## WOW Growth UI 연동

| 사용자 요청 | 권장 경로 |
|------------|----------|
| 추천 사업 기준 초안 생성 | `/business-plans` + API generate |
| 공고 메타 보강 후 초안 | admin extract → generate |
| 에이전트 풀 품질 검토·수정 | 본 스킬 Phase 2 (마크다운) → 필요 시 JSON 변환 |
