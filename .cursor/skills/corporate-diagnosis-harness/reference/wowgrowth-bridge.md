# WOW Growth MVP 연동

## 언제 앱 API vs 본 하네스?

| 목적 | 경로 |
|------|------|
| UI **JSON** 기업진단 보고서 | `POST /api/reports/diagnosis/generate` · `src/lib/ai/diagnosis.ts` |
| **IU.Partners xlsx** 경영진단서 | **corporate-diagnosis-harness** (본 스킬) |

## 앱 데이터 → `01_extracted.json` 매핑

| DB / 소스 | 하네스 필드 |
|-----------|-------------|
| `companies.name` | `company.name` |
| `companies.financials` | `financials.{YYYY}` |
| `companies.shareholders` | `shareholders` |
| `companies.biz_no`, `ceo`, `industry_code` | `company.*` |
| `diagnosis_reports.report_json` | 코멘트 참고용 (숫자는 calculate 결과 우선) |

DB에 재무가 이미 있으면 서류 추출 대신 **calculate-render** 모드 가능.

## xlsx → 앱 저장 (선택)

1. `report.xlsx`를 사용자에게 전달 (주 산출물)
2. JSON 요약이 필요하면 `03_result.json` + `02_commentary.json`을 `diagnosis_reports.report_json` 형태로 매핑
3. UI: `/reports/diagnosis` · frontend-v15 `/company-diagnosis`

앱 스키마: `diagnosisReportSchema` (`src/lib/ai/schemas.ts`)

## 환경

- xlsx 하네스: `pip install openpyxl` (로컬 CLI)
- 앱 AI: `GEMINI_API_KEY` (WOW Growth Vercel) — **본 하네스 `--cursor` 모드와 무관**

## frontend-v15

`CompanyDiagnosisReportPage`는 현재 mock/API 혼합. xlsx 산출물은 `_workspace/corporate-diagnosis/report.xlsx`를 사용자에게 직접 제공한다.
