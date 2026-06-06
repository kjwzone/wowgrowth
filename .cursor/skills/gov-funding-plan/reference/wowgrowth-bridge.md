# WOW Growth MVP 연동

## 언제 앱 API vs 본 스킬?

| 목적 | 경로 |
|------|------|
| UI에서 추천 사업별 JSON 초안 | `business-plan-writer` 빠른 경로 → `/api/business-plans/generate` |
| R&D 제출용 기술/사업/예산 **분리 문서** | **gov-funding-plan** Phase 2 |

## 앱 데이터 활용 (Phase 1)

| DB / API | `00_input.md` 매핑 |
|----------|-------------------|
| `companies` | 기업명, 업종, region, financials, patents |
| `support_programs.content_raw` | 공고문 |
| `program_metadata` | 지원금액, 자격, 배점 힌트 |
| `matching_results` | 추천 근거·리스크 |
| `diagnosis_reports` | 강점·약점·권고 |

## 마크다운 → JSON (선택)

`02`+`03`+`04` 완성 후 startup-package JSON으로 병합 시:

- Problem ← `03` 시장·문제
- Solution ← `02` 기술
- Scale-up ← `03` 사업화
- Team ← `02` 추진체계 + 기업정보
- 사업비 ← `04`

상세 스키마: [business-plan-writer/output-schema.md](../business-plan-writer/reference/output-schema.md)

앱 저장: `business_plan_drafts.plan_json`
