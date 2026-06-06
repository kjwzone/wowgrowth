---
name: gov-funding-plan
description: >-
  정부 R&D·TIPS·창업성장기술개발 등 정부지원사업 사업계획서 풀 파이프라인.
  공고 요건 분석, 기술성·사업성 분리 작성, 예산 편성, 증빙 가이드, 제출 검증을
  단계별로 수행한다. '정부과제', 'R&D 사업계획서', 'TIPS', '기술성 파트',
  '사업성 파트', '정부 R&D 예산', '중기부 과제', '창업성장기술개발' 요청 시
  사용한다. 보조금·창업패키지 통합형은 business-plan-writer 스킬을 사용한다.
  WOW Growth에서 R&D·TIPS 공고는 본 스킬을 우선한다.
---

# Gov Funding Plan (Cursor)

Claude 하네스 `.claude/skills/gov-funding-plan/`를 Cursor Agent Skill로 변환한 오케스트레이터다.

**기술성·사업성을 분리** 작성하는 R&D형 파이프라인이다. 통합형 사업계획서(보조금·창업패키지)는 [business-plan-writer](../business-plan-writer/SKILL.md)를 사용한다.

## Claude → Cursor 매핑

| Claude 하네스 | Cursor |
|--------------|--------|
| SendMessage / 에이전트 팀 | `Task` + `subagent_type` |
| `_workspace/` | `_workspace/gov-funding-plan/` |
| `.claude/agents/*.md` | Cursor 서브에이전트 + [agent-mapping.md](reference/agent-mapping.md) |
| TaskCreate / TaskUpdate | 진행 체크리스트 |

## WOW Growth MVP 연동 (선택)

앱에서 **초기창업패키지 JSON 초안**만 필요하면 `business-plan-writer`의 빠른 경로를 우선한다.

- `POST /api/business-plans/generate`
- `src/lib/ai/prompts/startup-package-plan-instructions.ts`

R&D형 **마크다운 풀세트**(기술성/사업성/예산 분리)가 필요할 때 본 스킬 Phase 2를 실행한다. 완성 후 필요 시 JSON 섹션으로 수동·반자동 매핑 — [wowgrowth-bridge.md](reference/wowgrowth-bridge.md).

## Phase 1: 준비

1. 입력 수집:
   - **공고문**: URL·PDF·텍스트 또는 WOW Growth `support_programs.content_raw`
   - **기업 정보**: 업종, 업력, 매출, 인력, 보유 기술·IP
   - **개발 과제**: 기술/제품/서비스 개발 내용
   - **기존 자산** (선택): 기술계획서, 사업계획서, 재무제표
2. `_workspace/gov-funding-plan/` 생성
3. `00_input.md` 저장
4. [실행 모드](reference/pipeline-modes.md) 결정
5. 기존 산출물이 있으면 해당 Phase 건너뛰기 (예: 기술문서 → `02_tech_proposal.md` 복사)

## Phase 2: 서브에이전트 실행

| 순서 | 작업 | subagent_type | 의존 | 산출물 |
|------|------|---------------|------|--------|
| 1 | 공고 요건 분석 | `announcement-analyst` | — | `01_announcement_analysis.md` |
| 2a | 기술성 작성 | `tech-writer` | 1 | `02_tech_proposal.md` |
| 2b | 사업성 작성 | `biz-writer` | 1 | `03_biz_proposal.md` |
| 3 | 예산 편성 | `budget-planner` | 1, 2a, 2b | `04_budget_plan.md` |
| 4 | 제출 검증 | `submission-reviewer` | 1~3 | `05_review_report.md` |

**2a·2b는 병렬** `Task` 호출 (둘 다 작업 1만 의존).

**순차 의존 (원본 하네스):**
- 2a 완료 → biz-writer에 기술 차별화 포인트 전달 (2b 진행 중이면 `03` 초안에 반영 요청)
- 2a·2b 완료 → budget-planner에 인력·장비·사업화 투자 계획 전달
- submission-reviewer 🔴 발견 → 해당 agent 재호출 (최대 2회)

각 `Task` 프롬프트 필수 포함:
- 입력·선행 산출물 경로 (`00_input.md`, `01_...`)
- 저장 경로
- Read: `.claude/agents/{name}.md`

## Phase 3: 통합

1. `_workspace/gov-funding-plan/` 전 파일 확인
2. `05_review_report.md` 🔴 필수 수정 반영 (최대 2회)
3. 예상 배점·제출 체크리스트 요약 보고
4. (선택) WOW Growth JSON 변환 — [wowgrowth-bridge.md](reference/wowgrowth-bridge.md)

## 진행 체크리스트

```
- [ ] 00_input.md
- [ ] 01 공고 분석
- [ ] 02 기술성 (tech-writer)
- [ ] 03 사업성 (biz-writer)
- [ ] 04 예산 (budget-planner)
- [ ] 05 검증 (submission-reviewer)
- [ ] 🔴 수정 반영 완료
```

## 에러 핸들링

| 상황 | 대응 |
|------|------|
| 공고문 없음 | TIPS·창업성장기술개발 등 **일반 R&D 양식**으로 작성 + [기입필요] |
| 기업 정보 부족 | 역할별 필요 역량만 기술, [기입필요] |
| 과제 불명확 | 적합 정부사업 3개 추천 → 사용자 선택 후 재개 |
| 에이전트 실패 | 1회 재시도 → 실패 시 검증 보고서에 누락 명시 |
| 🔴 검증 | 해당 subagent 재호출 (최대 2회) |

## 확장 스킬 (Claude 원본 Read)

| 스킬 | 대상 | 용도 |
|------|------|------|
| `.claude/skills/budget-standard-checker/skill.md` | budget-planner, submission-reviewer | 비목·인건비·간접비 규정 |
| `.claude/skills/scoring-optimizer/skill.md` | tech-writer, biz-writer, submission-reviewer | 배점 최적화·감점 방지 |

## 범위 밖

- 온라인 제출·법인 서류 발급·회계 처리·특허 출원

## 참고

- [pipeline-modes.md](reference/pipeline-modes.md) — 풀/기술성/사업성/예산/리뷰 모드
- [agent-mapping.md](reference/agent-mapping.md) — 에이전트·Task 템플릿
- [output-artifacts.md](reference/output-artifacts.md) — 산출물 구조
- [test-scenarios.md](reference/test-scenarios.md) — 검증 시나리오
- [wowgrowth-bridge.md](reference/wowgrowth-bridge.md) — 앱 JSON 연동
