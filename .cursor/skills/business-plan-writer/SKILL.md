---
name: business-plan-writer
description: >-
  보조금·정부지원사업 사업계획서 작성 파이프라인. 공고 분석, 사업계획서 초안,
  예산 편성, 규정 준수·제출 검증까지 단계별로 수행한다. WOW Growth MVP에서는
  기업·공고·추천·진단 데이터와 Gemini API 생성 흐름을 함께 활용한다.
  '사업계획서', '사업계획서 초안', '지원사업 신청', '보조금', '창업패키지',
  '정부지원사업', '공고 분석', '예산 편성', '배점 최적화' 요청 시 사용한다.
  R&D·TIPS 등 기술성/사업성 분리형은 gov-funding-plan 스킬을 사용한다.
  WOW Growth 앱·API의 사업계획서 초안 작성 기본 스킬이다.
---

# Business Plan Writer (Cursor)

Claude 하네스 `.claude/skills/grant-writer/`를 Cursor Agent Skill로 변환한 오케스트레이터다.

## Claude → Cursor 매핑

| Claude 하네스 | Cursor |
|--------------|--------|
| SendMessage / 에이전트 팀 | `Task` 도구 + `subagent_type` |
| `_workspace/` 산출물 | `_workspace/business-plan/` |
| `.claude/agents/*.md` | Cursor 내장 서브에이전트 + [agent-mapping.md](reference/agent-mapping.md) |
| TaskCreate / TaskUpdate | 응답 내 체크리스트로 진행 상황 표시 |

## WOW Growth MVP 빠른 경로 (앱 내 생성)

코드베이스에서 **JSON 초안**이 필요하면 API/라이브러리 경로를 우선한다.

1. 입력: `companies`, `support_programs`, `matching_results`, `diagnosis_reports`
2. 컨텍스트: `src/lib/ai/business-plan-context.ts` → `buildStartupInputPayload()`
3. 프롬프트: `src/lib/ai/prompts/startup-package-plan-instructions.ts`
4. 생성: `POST /api/business-plans/generate` 또는 `generateBusinessPlanDraft()`
5. 스키마: `businessPlanDraftSchema` (`src/lib/ai/schemas.ts`)

UI: `/business-plans` → 추천 사업별 **사업계획서 초안 생성**

앱 경로로 생성할 때는 하네스 Phase 2 전체를 돌리지 않고, 부족 입력만 사용자에게 확인한다.

## 풀 파이프라인 (에이전트 협업)

### Phase 1: 준비 (오케스트레이터)

1. 입력 수집:
   - 공고문 / 공고 URL / `support_programs.content_raw`
   - 기업정보 (WOW Growth DB 또는 사용자 제공)
   - 사업 아이디어·개발 과제
   - 기존 자료 (선택)
2. `_workspace/business-plan/` 생성
3. `00_input.md`에 입력 정리
4. 요청 범위에 따라 [실행 모드](reference/pipeline-modes.md) 결정

### Phase 2: 서브에이전트 실행

| 순서 | 작업 | subagent_type | 산출물 |
|------|------|---------------|--------|
| 1 | 공고 분석 | `announcement-analyst` | `01_announcement_analysis.md` |
| 2a | 사업계획서 작성 | `plan-writer` | `02_business_plan.md` |
| 2b | 예산 편성 | `budget-designer` | `03_budget_plan.md` |
| 3 | 규정 준수 검증 | `compliance-checker` | `04_compliance_report.md` |
| 4 | 제출 검증 | `submission-verifier` | `05_submission_checklist.md` |

**R&D 분리형**(기술성/사업성 별도)은 전용 스킬 [gov-funding-plan](../gov-funding-plan/SKILL.md) 사용:
- `tech-writer` → `02_tech_proposal.md`
- `biz-writer` → `03_biz_proposal.md`
- `budget-planner` → `04_budget_plan.md`
- `submission-reviewer` → `05_review_report.md`
- 워크스페이스: `_workspace/gov-funding-plan/`

작업 2a·2b(plan-writer + budget-designer)는 작업 1 완료 후 **병렬** `Task` 호출 가능.

각 `Task` 프롬프트에 포함할 것:
- `00_input.md` / `01_announcement_analysis.md` 경로
- 저장할 산출물 경로
- `.claude/agents/{name}.md` 역할 요약 (필요 시 해당 파일 Read)

### Phase 3: 통합

1. `_workspace/business-plan/` 산출물 전체 확인
2. `04_compliance_report.md`의 🔴 항목 해결 (최대 2회 재작업)
3. WOW Growth JSON 초안이 필요하면 `02_business_plan.md`를 근거로 `startup-package` JSON 섹션 매핑 — [output-schema.md](reference/output-schema.md)
4. 사용자에게 요약 보고 (완료 단계, 🔴/🟡/🟢, 다음 액션)

## 진행 체크리스트

```
- [ ] 00_input.md 저장
- [ ] 01 공고 분석
- [ ] 02 사업계획서 (또는 02/03 tech+biz)
- [ ] 03 예산
- [ ] 04 규정 준수
- [ ] 05 제출 체크리스트
- [ ] (선택) Gemini JSON / DB 저장
```

## 에러 핸들링

| 상황 | 대응 |
|------|------|
| 공고문 없음 | WOW Growth `programs` 원문 또는 웹 검색 시도 → 실패 시 사용자에게 요청 |
| 기업정보 부족 | `[확인 필요]` / `[기입필요]` 표시, premises에 명시 |
| 자격 미충족 | compliance-checker가 대안(컨소시엄 등) 제안 |
| 🔴 규정 위반 | 해당 subagent 재호출 (최대 2회) |

## 확장 스킬 (Claude 원본)

배점·예산 세부 규정은 필요 시 Read:
- `.claude/skills/scoring-optimizer/skill.md`
- `.claude/skills/budget-rule-engine/skill.md`

## 범위 밖

- 온라인 제출 시스템 접속·제출
- 증빙 서류 발급, 회계 처리, 특허 출원
- 심사위원 대면 발표 코칭

## 추가 참고

- [pipeline-modes.md](reference/pipeline-modes.md) — 요청별 실행 모드
- [output-schema.md](reference/output-schema.md) — JSON 출력·필수 섹션
- [agent-mapping.md](reference/agent-mapping.md) — Claude agent ↔ Cursor subagent
