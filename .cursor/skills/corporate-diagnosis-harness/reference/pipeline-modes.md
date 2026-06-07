# 파이프라인 실행 모드

| 모드 | 트리거 | 실행 범위 |
|------|--------|-----------|
| **full-cursor** | xlsx 진단서 + 서류 첨부 | Phase 1~4 전체 |
| **extract-only** | JSON 추출만 요청 | Phase 2 + `cursor_validate` |
| **calculate-render** | `01_extracted.json` 이미 있음 | Phase 3c (`--cursor`, 코멘트 생략 가능) |
| **commentary-only** | 계산 결과 있음, 코멘트만 | 3a 생략 가능 → 3b + `cursor_grounding` |
| **mock-test** | 배선·회귀 검증 | `run.py --mock` + `tests/test_e2e.py` |
| **wowgrowth-json** | 앱 UI 기업진단 | wowgrowth-bridge — API 우선, xlsx 하네스 생략 |

## full-cursor 기본 순서

1. `01_extracted.json` ← 에이전트
2. `cursor_validate.py`
3. `cursor_calculate.py` → `03_result.json`
4. `02_commentary.json` ← 에이전트
5. `cursor_grounding.py`
6. `run.py --cursor` → `report.xlsx`

## 옵션

- **`--no-commentary`**: 코멘트·그라운딩 단계 생략
- **`--strict`**: CommentaryStage 그라운딩 위반 시 실패 (CLI 내장)

## Claude Code 대비

Claude Code는 `run.py --docs` 한 번에 Anthropic API를 호출한다.  
Cursor는 **LLM 2단계를 에이전트가 분리 수행**하고, 나머지는 동일 Python 엔진을 쓴다.
