---
name: corporate-diagnosis-harness
description: >-
  IU.Partners 양식 기업경영진단서(재무진단·세무진단·주식가치) 생성 하네스.
  사업자등록증·주주명부·재무제표에서 추출 → 스키마 검증 → 결정적 계산엔진 →
  진단 코멘트 → xlsx 6시트 렌더. Cursor Agent는 LLM 단계(추출·코멘트)만 수행하고
  계산·검증·렌더는 tools/corporate-diagnosis-harness Python CLI가 실행한다.
  '기업진단', '기업경영진단', '재무진단', '진단서', 'IU.Partners', '주식가치',
  '상증법', '진단보고서 xlsx' 요청 시 사용한다.
---

# Corporate Diagnosis Harness (Cursor)

Claude Code용 Python 하네스를 Cursor Agent Skill로 변환한 오케스트레이터다.

## Claude Code → Cursor 매핑

| Claude Code 하네스 | Cursor |
|-------------------|--------|
| `AnthropicClient` + `run.py --docs` | **에이전트**가 `prompts/extract.md` + 첨부 서류로 `01_extracted.json` 작성 |
| `CommentaryStage` LLM | **에이전트**가 `prompts/commentary.md` + `03_result.json`으로 `02_commentary.json` 작성 |
| `validate_extracted` / `calculate` / `render` / `qa` | **Python CLI** (`run.py --cursor` 또는 `scripts/cursor_*.py`) |
| `trace.json` | `_workspace/corporate-diagnosis/trace.json` |
| `ANTHROPIC_API_KEY` | **불필요** (`--cursor` 모드). Claude API 대신 Cursor 에이전트가 LLM 역할 |

## 핵심 원칙 (하네스 엔지니어링)

1. **모델**: 비정형 서류 읽기·자연어 코멘트만
2. **코드**: 비율·세금·주식가치 계산, 스키마 검증, xlsx 렌더
3. **경계 게이트**: 각 단계 산출물을 JSON 파일로 저장 후 CLI 검증 — 실패 시 **날조 금지·중단**
4. **그라운딩**: 코멘트는 `03_result.json`에 있는 숫자만 인용

파이프라인:

```
ingest(에이전트) → extract(에이전트) → validate(D) → calculate(D)
                → commentary(에이전트) → render(D) → qa(D)
```

## 워크스페이스

모든 산출물은 프로젝트 루트 기준:

```
_workspace/corporate-diagnosis/
├── 00_input.md              # 입력·서류 목록·주의사항
├── 01_extracted.json        # LLM 추출 (엔진 입력 스키마)
├── 02_commentary.json       # LLM 코멘트 (선택)
├── 03_result.json           # calculate 중간 산출 (코멘트용)
├── report.xlsx              # 최종 진단서
└── trace.json               # 단계별 트레이스
```

템플릿·프롬프트·엔진 경로: `tools/corporate-diagnosis-harness/`

## Phase 1: 준비 (오케스트레이터)

1. `_workspace/corporate-diagnosis/` 생성
2. 사용자로부터 수집:
   - 사업자등록증·주주명부·재무제표 (PDF/PNG/JPG)
   - (선택) WOW Growth `companies` / `diagnosis_reports` DB 데이터
3. `00_input.md`에 서류 경로·기업명·요청 범위 기록
4. [실행 모드](reference/pipeline-modes.md) 결정

## Phase 2: 추출 (에이전트 = ExtractStage)

1. **Read** `tools/corporate-diagnosis-harness/prompts/extract.md`
2. **Read** `tools/corporate-diagnosis-harness/examples/input_template.json` (스키마)
3. 첨부 서류에서 필드 추출 → **`01_extracted.json`만** 저장 (순수 JSON, 코드펜스·설명 금지)
4. 규칙:
   - 금액 단위 **천원**
   - 확인 불가 값 → `null` (추정·날조 금지)
   - 외부 데이터(동종평균·신용등급) → 비우거나 null

5. **검증 (필수)**:

```bash
cd tools/corporate-diagnosis-harness
pip install -r requirements.txt
python scripts/cursor_validate.py ../../_workspace/corporate-diagnosis/01_extracted.json
```

실패 시 스키마에 맞게 수정 후 재검증 (최대 3회). 통과 못하면 중단.

## Phase 3: 계산·코멘트·렌더 (혼합)

### 3a. 계산 결과 확보 (코멘트 작성용)

```bash
python scripts/cursor_calculate.py \
  ../../_workspace/corporate-diagnosis/01_extracted.json \
  ../../_workspace/corporate-diagnosis/03_result.json
```

### 3b. 진단 코멘트 (에이전트 = CommentaryStage)

1. **Read** `tools/corporate-diagnosis-harness/prompts/commentary.md`
2. **Read** `03_result.json`
3. `02_commentary.json` 작성 — 키: `overview`, `stability`, `profitability`, `funding`, `tax`, `summary`

4. **그라운딩 검증 (필수)**:

```bash
python scripts/cursor_grounding.py \
  ../../_workspace/corporate-diagnosis/03_result.json \
  ../../_workspace/corporate-diagnosis/02_commentary.json
```

위반 숫자 제거 후 재작성 (최대 3회).

### 3c. 최종 xlsx + QA (결정적 CLI)

```bash
python run.py --cursor \
  --input ../../_workspace/corporate-diagnosis/01_extracted.json \
  --commentary-file ../../_workspace/corporate-diagnosis/02_commentary.json \
  --out ../../_workspace/corporate-diagnosis/report.xlsx \
  --trace ../../_workspace/corporate-diagnosis/trace.json
```

코멘트 생략 시: `--no-commentary` 추가.

`--strict` : 그라운딩 위반 시 파이프라인 실패.

## Phase 4: 보고

1. `trace.json` · QA 리포트 요약
2. `report.xlsx` 경로 안내
3. 입력 경고(`cursor_validate` 경고) · 그라운딩 플래그 공유
4. (선택) WOW Growth `diagnosis_reports` 저장 — [wowgrowth-bridge.md](reference/wowgrowth-bridge.md)

## 진행 체크리스트

```
- [ ] 00_input.md
- [ ] 01_extracted.json + cursor_validate 통과
- [ ] 03_result.json (calculate)
- [ ] 02_commentary.json + cursor_grounding 통과 (또는 --no-commentary)
- [ ] report.xlsx + trace.json
- [ ] 사용자 요약 보고
```

## Mock / 테스트 (키 없이 배선 검증)

```bash
cd tools/corporate-diagnosis-harness
python run.py --mock --input examples/sample_input.json --out /tmp/report.xlsx
python tests/test_e2e.py
```

## 에러 핸들링

| 상황 | 대응 |
|------|------|
| 스키마 검증 실패 | `input_template.json` 대조, null 처리, 연도 키 `YYYY` 확인 |
| 재무 정합성 경고 | 사용자에게 확인 요청; 치명적 불일치면 추출 재작업 |
| 그라운딩 위반 | result에 없는 숫자 삭제; 동종평균·시장규모 날조 금지 |
| calculate 실패 | `01_extracted.json` 필수 필드·천원 단위 재확인 |

## WOW Growth 빠른 경로

앱 UI JSON 진단이면 API 경로 우선 — [wowgrowth-bridge.md](reference/wowgrowth-bridge.md).

**IU.Partners xlsx 진단서**가 목표일 때만 본 하네스 전체 파이프라인을 실행한다.

## 추가 참고

- [pipeline-modes.md](reference/pipeline-modes.md) — 요청별 실행 범위
- [agent-mapping.md](reference/agent-mapping.md) — 단계별 역할
- `tools/corporate-diagnosis-harness/README.md` — 엔진·가드 상세

## 범위 밖

- 정식 신용평가·감정평가·세무신고 대체
- KoDATA·NICE 등 외부 DB 실시간 연동 (구조적으로 N/A)
- 온라인 제출·전자서명
