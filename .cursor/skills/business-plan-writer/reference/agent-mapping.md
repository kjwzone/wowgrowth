# Claude Agent ↔ Cursor Subagent

Cursor `Task` 도구의 `subagent_type`은 Claude `.claude/agents/`와 1:1 대응한다.

## grant-writer 파이프라인

| Claude agent 파일 | subagent_type | 산출물 |
|------------------|---------------|--------|
| `.claude/agents/announcement-analyst.md` | `announcement-analyst` | `01_announcement_analysis.md` |
| `.claude/agents/plan-writer.md` | `plan-writer` | `02_business_plan.md` |
| `.claude/agents/budget-designer.md` | `budget-designer` | `03_budget_plan.md` |
| `.claude/agents/compliance-checker.md` | `compliance-checker` | `04_compliance_report.md` |
| `.claude/agents/submission-verifier.md` | `submission-verifier` | `05_submission_checklist.md` |

## gov-funding-plan 파이프라인

| Claude agent 파일 | subagent_type | 산출물 |
|------------------|---------------|--------|
| `.claude/agents/announcement-analyst.md` | `announcement-analyst` | `01_announcement_analysis.md` |
| `.claude/agents/tech-writer.md` | `tech-writer` | `02_tech_proposal.md` |
| `.claude/agents/biz-writer.md` | `biz-writer` | `03_biz_proposal.md` |
| `.claude/agents/budget-planner.md` | `budget-planner` | `04_budget_plan.md` |
| `.claude/agents/submission-reviewer.md` | `submission-reviewer` | `05_review_report.md` |

## Task 프롬프트 템플릿

```
역할: {subagent_type} (`.claude/agents/{name}.md` 참고)

입력:
- _workspace/business-plan/00_input.md
- (해당 시) _workspace/business-plan/01_announcement_analysis.md

작업: {구체적 지시}

산출물: _workspace/business-plan/{파일명}.md 에 저장

제약:
- 평가 기준·배점 반영
- 근거 없는 수치·실적 생성 금지
- 🔴/🟡/🟢 등급 사용 (리뷰어)
```

## 확장 스킬 (에이전트 보조)

| Claude skill | 용도 |
|-------------|------|
| `.claude/skills/scoring-optimizer/skill.md` | 배점 최적화 |
| `.claude/skills/budget-rule-engine/skill.md` | 비목·인건비 규정 |
| `.claude/skills/budget-standard-checker/skill.md` | R&D 예산 기준 |
