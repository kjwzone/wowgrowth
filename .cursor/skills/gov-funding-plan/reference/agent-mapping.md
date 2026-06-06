# Claude Agent ↔ Cursor Subagent (gov-funding-plan)

| Claude agent | subagent_type | 산출물 |
|-------------|---------------|--------|
| `.claude/agents/announcement-analyst.md` | `announcement-analyst` | `01_announcement_analysis.md` |
| `.claude/agents/tech-writer.md` | `tech-writer` | `02_tech_proposal.md` |
| `.claude/agents/biz-writer.md` | `biz-writer` | `03_biz_proposal.md` |
| `.claude/agents/budget-planner.md` | `budget-planner` | `04_budget_plan.md` |
| `.claude/agents/submission-reviewer.md` | `submission-reviewer` | `05_review_report.md` |

## Task 프롬프트 템플릿

```
역할: {subagent_type}
참고: Read `.claude/agents/{name}.md`

입력:
- _workspace/gov-funding-plan/00_input.md
- (해당 시) _workspace/gov-funding-plan/01_announcement_analysis.md
- (해당 시) 02/03 선행 산출물

작업: {구체 지시}

저장: _workspace/gov-funding-plan/{파일명}.md

제약:
- 공고 평가 배점·키워드 반영
- 기술 목표는 정량 지표
- 근거 없는 실적·특허·매출 생성 금지
- submission-reviewer: 🔴/🟡/🟢 분류
```

## 병렬 호출 (Phase 2a + 2b)

작업 1 완료 후 **동시에** 두 Task:

1. `tech-writer` → `02_tech_proposal.md`
2. `biz-writer` → `03_biz_proposal.md`

둘 다 `01_announcement_analysis.md`만 선행 입력으로 사용.

## 확장 스킬 Read 시점

| subagent_type | 추가 Read |
|---------------|-----------|
| tech-writer, biz-writer, submission-reviewer | `.claude/skills/scoring-optimizer/skill.md` |
| budget-planner, submission-reviewer | `.claude/skills/budget-standard-checker/skill.md` |
