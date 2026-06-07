# Agent / Stage 매핑

| 하네스 Stage | kind | Cursor 담당 | 산출물 |
|--------------|------|-------------|--------|
| `ingest` | D | 오케스트레이터 (서류 경로 정리) | `00_input.md` |
| `extract` | LLM | **Cursor Agent** | `01_extracted.json` |
| `validate_input` | D | `scripts/cursor_validate.py` | (stdout 경고) |
| `calculate` | D | `scripts/cursor_calculate.py` 또는 `run.py` | `03_result.json` |
| `commentary` | LLM | **Cursor Agent** | `02_commentary.json` |
| (grounding) | D | `scripts/cursor_grounding.py` | pass/fail |
| `render` | D | `run.py --cursor` | `report.xlsx` |
| `qa` | D | `run.py --cursor` | `trace.json` 내 `qa_report` |

## 에이전트 프롬프트 소스

| Stage | Read 파일 |
|-------|-----------|
| extract | `tools/corporate-diagnosis-harness/prompts/extract.md` |
| extract (스키마) | `tools/corporate-diagnosis-harness/examples/input_template.json` |
| commentary | `tools/corporate-diagnosis-harness/prompts/commentary.md` |
| commentary (입력) | `_workspace/corporate-diagnosis/03_result.json` |

## 서브에이전트 (선택)

복잡한 다기업·다년도 건은 `Task`로 분리 가능:

| 작업 | subagent_type | 비고 |
|------|---------------|------|
| 서류 OCR·표 추출 | `generalPurpose` | extract 전처리 |
| 재무 코멘트 초안 | `financial-analyst` | commentary 보조 |
| 최종 QA 리뷰 | `ir-reviewer` | xlsx·JSON 교차 확인 |

기본은 오케스트레이터 단일 실행으로 충분하다.

## 금지

- 에이전트가 `financial_diagnosis.py` 비율·세금을 **직접 계산**하지 않는다
- 검증 실패 시 값을 **추정해 채우지** 않는다
- 그라운딩 실패 시 `--strict` 없이 넘어가지 않는다 (사용자 명시 시만 예외)
