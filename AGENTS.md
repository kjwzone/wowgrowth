# WOW Growth — Agent 가이드

## 사업계획서 초안 작성 (필수)

사업계획서 초안 관련 작업(생성·개선·프롬프트·API·UI)은 **Cursor Agent Skill**을 기준 워크플로로 사용한다.

| 공고 유형 | 스킬 | 워크스페이스 |
|----------|------|-------------|
| 보조금·창업패키지·통합형 | [business-plan-writer](.cursor/skills/business-plan-writer/SKILL.md) | `_workspace/business-plan/` |
| R&D·TIPS·기술성/사업성 분리형 | [gov-funding-plan](.cursor/skills/gov-funding-plan/SKILL.md) | `_workspace/gov-funding-plan/` |

스킬 선택 로직: `src/lib/ai/business-plan-skill.ts` → `selectBusinessPlanSkill()`

### Cursor에서 작업할 때

1. 해당 스킬 `SKILL.md`를 **먼저 Read**
2. Phase 1~3 워크플로 준수 (입력 → 서브에이전트 → 통합)
3. 서브에이전트는 `Task` + `subagent_type` (`plan-writer`, `tech-writer` 등)
4. 상세 에이전트 프롬프트: `.claude/agents/*.md`

### 앱 API (`POST /api/business-plans/generate`)

- **현재**: `business-plan-writer` **빠른 경로** — Gemini 단일 호출 → JSON (`businessPlanDraftSchema`)
- **입력**: `loadBusinessPlanGenerationContext()` + `startup-package-plan-instructions.ts`
- **R&D형 풀 파이프라인**(tech/biz/budget 분리)은 Cursor 스킬 또는 향후 `ai_jobs` 다단계 확장 대상

프롬프트·스키마를 수정할 때는 스킬의 output-schema·작성 원칙과 **정합성**을 유지한다.

## 기타

- DB 마이그레이션: `supabase/migrations/`
- 테스트: `npm run test`
