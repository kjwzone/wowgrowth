# 기업경영진단 하네스 (Corporate Diagnosis Harness)

IU.Partners 양식 **기업경영진단서**를 자동 생성하는 *에이전트 하네스*.
기존 "스킬"을 **하네스 엔지니어링** 관점으로 재구성한 버전이다.

---

## 스킬 → 하네스, 무엇이 달라졌나

| | 스킬(skill) | 하네스(harness) |
|---|---|---|
| 오케스트레이션 위치 | 모델의 머릿속(SKILL.md 지침을 읽고 따라감) | **코드**(Pipeline 이 단계를 강제 실행) |
| 단계 경계 | 암묵적 | **명시적 계약**(requires/produces + 검증) |
| 모델 역할 | 추출·계산·서술 전부 모델이 판단 | 모델은 **추출·서술만**, 계산·검증·렌더는 결정적 코드 |
| 실패 처리 | 모델이 알아서(날조 위험) | **재시도 → 그래도 실패면 중단**(날조 금지) |
| 재현성 | 매번 다를 수 있음 | 결정적 단계는 입력 같으면 출력 같음 |
| 감사 | 어려움 | **trace.json** 으로 단계별 기록 |

핵심 발상: *모델이 잘하는 일(비정형 문서 읽기, 자연어 서술)과 코드가 잘하는 일(정확한 산술, 스키마 검증)을 분리하고, 그 사이마다 검증 게이트를 둔다.*

---

## 파이프라인

```
ingest(D) → extract(LLM) → validate_input(D) → calculate(D)
          → commentary(LLM) → render(D) → qa(D)
```
`(D)` = Deterministic(결정적). 7단계 중 LLM 은 **2개뿐**이다.

| 단계 | 종류 | 하는 일 | 경계 계약 |
|---|---|---|---|
| `ingest` | D | 서류 파일 → base64 첨부 | → `docs` |
| `extract` | **LLM** | 서류 → 구조화 JSON | 출력이 엔진 입력 스키마 만족(`validate_extracted`). 위반 시 최대 3회 재시도 |
| `validate_input` | D | 정합성 검증(자산=부채+자본 등) + 경고 | → `warnings` |
| `calculate` | D | **검증엔진 실행**(비율·세금·주식가치) | → `result` |
| `commentary` | **LLM** | 진단 코멘트 작성 | **그라운딩 가드**: 계산결과에 없는 숫자 인용 탐지 |
| `render` | D | 결과 → xlsx(6시트) | → `output_path` |
| `qa` | D | 산출물·경고·플래그 최종 점검 | → `qa_report` |

### 하네스 엔지니어링 가드 3종
1. **출력 계약 강제** — 각 단계는 `produces` 키를 보장해야 통과. 누락 시 `StageContractError` 로 즉시 중단(조용한 실패 없음).
2. **그라운딩 가드** (`schema.grounding_violations`) — 코멘트가 계산결과에 없는 숫자(시장규모·동종평균 등)를 만들어내면 플래그. `--strict` 모드에선 실패 처리. → *외부 데이터 날조 금지 정책의 코드화*.
3. **재시도 후 정직한 중단** — LLM 단계는 재시도하되, 끝내 유효 출력이 안 나오면 그럴듯한 값을 지어내지 않고 `LLMStageError` 로 멈춘다.

---

## 디렉터리

```
corporate-diagnosis-harness/
├─ run.py                 # CLI 진입점
├─ harness/
│  ├─ core.py             # Context / Stage / Pipeline (도메인 비의존 프레임워크)
│  ├─ llm.py              # LLMClient: AnthropicClient(실제) + MockClient(테스트)
│  ├─ schema.py           # 스키마 검증 · 재무 정합성 · 그라운딩 가드
│  ├─ stages.py           # 7개 구체 단계
│  └─ pipeline.py         # 파이프라인 조립
├─ engine/                # 검증 완료된 계산엔진(재사용)
│  ├─ financial_diagnosis.py
│  └─ build_xlsx.py
├─ prompts/               # extract.md / commentary.md
├─ examples/              # sample_input.json(검증본) / input_template.json
└─ tests/test_e2e.py      # Mock 기반 엔드투엔드 테스트
```

---

## 사용법

```bash
pip install -r requirements.txt   # openpyxl 만 필요(나머지 표준 라이브러리)

# 1) 실서류 + 실모델  (export ANTHROPIC_API_KEY=... 필요)
python run.py --docs 사업자등록증.pdf 주주명부.pdf 재무제표.pdf --out 진단서.xlsx --trace trace.json

# 2) 추출 JSON 으로 계산/렌더만 검증 (모델 추출 생략)
python run.py --input examples/sample_input.json --out 진단서.xlsx --no-commentary

# 3) 키 없이 배선 검증 (Mock)
python run.py --mock --input examples/sample_input.json --out 진단서.xlsx

# 4) Cursor Agent 모드 (LLM은 에이전트, 계산/렌더만 CLI — ANTHROPIC_API_KEY 불필요)
python run.py --cursor \
  --input ../../_workspace/corporate-diagnosis/01_extracted.json \
  --commentary-file ../../_workspace/corporate-diagnosis/02_commentary.json \
  --out ../../_workspace/corporate-diagnosis/report.xlsx

# 테스트
python tests/test_e2e.py
```

옵션: `--no-commentary`(코멘트 생략) · `--strict`(그라운딩 위반 시 실패) · `--model`(기본 claude-opus-4-8) · `--trace`(트레이스 저장) · `--cursor`(Cursor Agent 모드).

> **Cursor IDE**에서 사용: `.cursor/skills/corporate-diagnosis-harness/SKILL.md` 참고.  
> Claude Code(Anthropic API) 대신 Cursor 에이전트가 extract/commentary를 수행한다.

> API 키는 환경변수 `ANTHROPIC_API_KEY` 에서만 읽는다. 코드·인자에 키를 넣지 않는다.

---

## 검증 상태
- Mock 엔드투엔드 통과: 주당평가액 24,194.8원(검증본 24,195원과 일치), 재무비율 3개년 산출, 그라운딩 플래그 0.
- 계약 위반 입력 → 의도대로 중단. 그라운딩 가드 → 근거 없는 숫자 탐지 확인.
- 외부 데이터 결측 시 신용등급·동종평균 자동 N/A 처리 확인.

## 한계
- `extract` 의 추출 정확도는 모델·서류 품질에 의존한다(가드는 스키마 적합성만 보장, 값의 정확성은 별도 검토 권장).
- 동종평균·KoDATA 등급 등 외부 데이터는 서류로 산출 불가 → 구조적으로 N/A(별도 연동 필요).
- 본 산출물은 참고용 추정치이며 정식 신용평가·세무신고·감정평가와 차이가 날 수 있다.
