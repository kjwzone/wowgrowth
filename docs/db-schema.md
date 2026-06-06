# 와우그로스 플랫폼 MVP DB 스키마 초안

## 1. 문서 개요

- 목적: MVP-1 구현을 위한 Supabase(PostgreSQL) 스키마 정의
- 기준 문서: `docs/prd.md`, `docs/screen-map.md`, `docs/api-spec.md`
- 범위: 인증 연동 프로필, 기업정보, 공고, 메타데이터, 추천결과, 검수로그, AI 작업 상태

---

## 2. 설계 원칙

1. 인증 주체는 `auth.users`를 기준으로 하고, 서비스 데이터는 별도 테이블로 분리한다.
2. 모든 주요 테이블은 `created_at`, `updated_at` 타임스탬프를 가진다.
3. AI 결과는 원문(JSON) + 핵심 필드(정규화) 혼합 저장한다.
4. 권한 제어는 Supabase RLS를 기본으로 하고 서버에서 role을 재검증한다.
5. 상태값은 enum 또는 check 제약으로 관리해 잘못된 전이를 방지한다.

---

## 3. ERD 개요

```text
auth.users (Supabase 기본)
   └─ profiles (1:1)
        └─ companies (1:N, MVP에서는 사실상 1:1 운영)

support_programs (공고)
   └─ program_metadata (1:N 버전관리 가능, MVP 기본 1:1 최신본 조회)

companies + support_programs
   └─ matching_results (N:M 매칭 결과)

review_logs
   ├─ program_metadata 검수 로그
   └─ matching_results 검수 로그

ai_jobs
   ├─ program_metadata 생성 작업
   └─ matching_results 생성 작업
```

---

## 4. 테이블 정의

## 4.1 profiles

사용자 프로필 및 권한 정보.

| 컬럼 | 타입 | 제약 | 설명 |
| --- | --- | --- | --- |
| id | uuid | PK, FK -> auth.users.id | 사용자 ID |
| email | text | not null, unique | 로그인 이메일 |
| role | text | not null, check(`role in ('user','admin','reviewer')`) | 권한 |
| full_name | text | null | 이름 |
| created_at | timestamptz | not null default now() | 생성일 |
| updated_at | timestamptz | not null default now() | 수정일 |

인덱스:

- `idx_profiles_role (role)`

## 4.2 companies

기업 기본정보/인증/재무정보.

| 컬럼 | 타입 | 제약 | 설명 |
| --- | --- | --- | --- |
| id | uuid | PK default gen_random_uuid() | 기업 ID |
| owner_id | uuid | not null, FK -> profiles.id | 소유 사용자 |
| company_name | text | not null | 기업명 |
| business_number | text | not null, unique | 사업자등록번호 |
| industry | text | not null | 업종 |
| region | text | not null | 지역 |
| founded_year | int | null | 설립연도 |
| certifications | jsonb | not null default '[]'::jsonb | 인증 목록 |
| patents | jsonb | not null default '[]'::jsonb | 특허 목록 |
| financials | jsonb | not null default '{}'::jsonb | 재무정보 |
| created_at | timestamptz | not null default now() | 생성일 |
| updated_at | timestamptz | not null default now() | 수정일 |

인덱스:

- `idx_companies_owner_id (owner_id)`
- `idx_companies_region_industry (region, industry)`

## 4.3 support_programs

정부지원사업 공고 원본.

| 컬럼 | 타입 | 제약 | 설명 |
| --- | --- | --- | --- |
| id | uuid | PK default gen_random_uuid() | 공고 ID |
| title | text | not null | 공고명 |
| agency | text | not null | 주관기관 |
| category | text | null | 분야 |
| region | text | null | 지원지역 |
| application_start_date | date | null | 신청 시작일 |
| application_end_date | date | null | 신청 종료일 |
| status | text | not null default 'draft', check(`status in ('draft','published','closed')`) | 공고 상태 |
| content_raw | text | null | 원문/요약 원본 |
| created_by | uuid | not null, FK -> profiles.id | 등록 관리자 |
| updated_by | uuid | null, FK -> profiles.id | 수정 관리자 |
| created_at | timestamptz | not null default now() | 생성일 |
| updated_at | timestamptz | not null default now() | 수정일 |

인덱스:

- `idx_support_programs_status (status)`
- `idx_support_programs_region_category (region, category)`
- `idx_support_programs_application_end_date (application_end_date)`

## 4.4 program_metadata

AI 공고 요약/메타데이터 결과.

| 컬럼 | 타입 | 제약 | 설명 |
| --- | --- | --- | --- |
| id | uuid | PK default gen_random_uuid() | 메타데이터 ID |
| program_id | uuid | not null, FK -> support_programs.id | 공고 ID |
| schema_version | text | not null default 'v1' | JSON 스키마 버전 |
| task_type | text | not null, check(`task_type in ('announcement_summary','announcement_metadata')`) | 작업 유형 |
| model | text | not null | 모델명 |
| prompt_version | text | not null | 프롬프트 버전 |
| status | text | not null default 'draft', check(`status in ('draft','reviewing','approved','rejected')`) | 검수 상태 |
| metadata_json | jsonb | not null | AI 결과 JSON |
| extracted_fields | jsonb | not null default '{}'::jsonb | 자주 쓰는 필드 캐시 |
| created_by_job_id | uuid | null | 생성 작업 ID |
| created_at | timestamptz | not null default now() | 생성일 |
| updated_at | timestamptz | not null default now() | 수정일 |

인덱스:

- `idx_program_metadata_program_id (program_id)`
- `idx_program_metadata_status (status)`
- `idx_program_metadata_task_type (task_type)`
- `gin_program_metadata_json (metadata_json)` using GIN

## 4.5 matching_results

기업-공고 추천 결과.

| 컬럼 | 타입 | 제약 | 설명 |
| --- | --- | --- | --- |
| id | uuid | PK default gen_random_uuid() | 추천 ID |
| company_id | uuid | not null, FK -> companies.id | 기업 ID |
| program_id | uuid | not null, FK -> support_programs.id | 공고 ID |
| score | int | not null, check(`score between 0 and 100`) | 추천점수 |
| recommendation_level | text | not null, check(`recommendation_level in ('high','medium','low')`) | 추천 등급 |
| reasons | jsonb | not null default '[]'::jsonb | 추천사유 |
| risks | jsonb | not null default '[]'::jsonb | 리스크 |
| improvement_tasks | jsonb | not null default '[]'::jsonb | 보완사항 |
| schema_version | text | not null default 'v1' | 스키마 버전 |
| task_type | text | not null default 'recommendation_reasoning' | 작업 유형 |
| model | text | null | 모델명(규칙 기반만 사용 시 null 가능) |
| prompt_version | text | null | 프롬프트 버전 |
| status | text | not null default 'draft', check(`status in ('draft','reviewing','approved','rejected')`) | 검수 상태 |
| created_at | timestamptz | not null default now() | 생성일 |
| updated_at | timestamptz | not null default now() | 수정일 |

제약:

- unique(`company_id`, `program_id`) - MVP 기준 최신 1건 유지

인덱스:

- `idx_matching_results_company_id (company_id)`
- `idx_matching_results_program_id (program_id)`
- `idx_matching_results_score (score desc)`

## 4.6 review_logs

검수/승인 이력 로그.

| 컬럼 | 타입 | 제약 | 설명 |
| --- | --- | --- | --- |
| id | uuid | PK default gen_random_uuid() | 로그 ID |
| review_target_type | text | not null, check(`review_target_type in ('program_metadata','matching_results')`) | 검수 대상 타입 |
| review_target_id | uuid | not null | 검수 대상 ID |
| action | text | not null, check(`action in ('created','updated','approved','rejected','retried')`) | 수행 액션 |
| before_json | jsonb | null | 변경 전 데이터 |
| after_json | jsonb | null | 변경 후 데이터 |
| review_comment | text | null | 코멘트 |
| actor_id | uuid | not null, FK -> profiles.id | 수행자 |
| created_at | timestamptz | not null default now() | 생성일 |

인덱스:

- `idx_review_logs_target (review_target_type, review_target_id)`
- `idx_review_logs_actor_id (actor_id)`
- `idx_review_logs_created_at (created_at desc)`

## 4.7 ai_jobs

AI 비동기 작업 상태 관리.

| 컬럼 | 타입 | 제약 | 설명 |
| --- | --- | --- | --- |
| id | uuid | PK default gen_random_uuid() | 작업 ID |
| task_type | text | not null, check(`task_type in ('announcement_summary','announcement_metadata','recommendation_reasoning')`) | 작업 유형 |
| target_type | text | not null, check(`target_type in ('support_programs','matching_results')`) | 대상 타입 |
| target_id | uuid | not null | 대상 ID |
| status | text | not null default 'queued', check(`status in ('queued','running','succeeded','failed')`) | 작업 상태 |
| attempt_count | int | not null default 0 | 시도 횟수 |
| error_code | text | null | 오류 코드 |
| error_message | text | null | 오류 메시지 |
| requested_by | uuid | not null, FK -> profiles.id | 요청자 |
| started_at | timestamptz | null | 시작 시각 |
| finished_at | timestamptz | null | 완료 시각 |
| created_at | timestamptz | not null default now() | 생성일 |
| updated_at | timestamptz | not null default now() | 수정일 |

인덱스:

- `idx_ai_jobs_status (status)`
- `idx_ai_jobs_target (target_type, target_id)`
- `idx_ai_jobs_created_at (created_at desc)`

---

## 5. 상태값(enum/check) 정의

권장 enum(또는 check constraint):

- `app_role`: `user | admin | reviewer`
- `review_status`: `draft | reviewing | approved | rejected`
- `program_status`: `draft | published | closed`
- `job_status`: `queued | running | succeeded | failed`

---

## 6. RLS 정책 초안

## 6.1 profiles

- SELECT: 본인 행 + admin
- UPDATE: 본인 행(단, role 변경 불가), admin은 전체 가능
- INSERT: 회원가입 트리거/서버 전용

## 6.2 companies

- SELECT: `owner_id = auth.uid()` 또는 role in (`admin`, `reviewer`)
- INSERT/UPDATE/DELETE: `owner_id = auth.uid()`인 user, admin 전체 가능

## 6.3 support_programs

- SELECT: 로그인 사용자 전체
- INSERT/UPDATE/DELETE: role = `admin`만 허용

## 6.4 program_metadata

- SELECT: 로그인 사용자 전체(승인/비승인 정책은 운영정책에 따라 분기 가능)
- INSERT/UPDATE: role in (`admin`, `reviewer`)
- DELETE: role = `admin`

## 6.5 matching_results

- SELECT: 회사 owner, admin, reviewer
- INSERT/UPDATE: 서버 함수 또는 admin
- DELETE: admin

## 6.6 review_logs / ai_jobs

- SELECT: admin, reviewer(제한적), 본인 요청건(user)
- INSERT: 서버 함수 전용
- UPDATE: admin(재시도/상태변경), 워커 서비스 롤

---

## 7. 추천 SQL DDL 작성 순서

1. enum/check 준비
2. `profiles` 생성 (auth.users FK)
3. `companies` 생성
4. `support_programs` 생성
5. `program_metadata` 생성
6. `matching_results` 생성
7. `review_logs` 생성
8. `ai_jobs` 생성
9. 인덱스 생성
10. RLS enable + 정책 적용
11. `updated_at` 자동 갱신 트리거 적용

---

## 8. API 연계 매핑

| API | 주요 테이블 | 비고 |
| --- | --- | --- |
| `GET /api/me` | `profiles` | role 확인 |
| `GET/POST/PATCH /api/company` | `companies` | owner 기반 RLS |
| `GET /api/programs` | `support_programs` | 검색/필터 인덱스 |
| `POST /api/admin/programs` | `support_programs` | admin 전용 |
| `POST /api/admin/programs/:id/extract` | `ai_jobs` | queued 생성 |
| `GET /api/programs/:id/metadata` | `program_metadata` | 최신 승인본 우선 |
| `POST /api/matches/generate` | `ai_jobs`, `matching_results` | 작업 후 결과 저장 |
| `GET /api/matches` | `matching_results` | owner/admin/reviewer |
| `PATCH /api/admin/reviews/programs/:id` | `program_metadata`, `review_logs` | 검수 이력 생성 |
| `POST /api/admin/jobs/:id/retry` | `ai_jobs`, `review_logs` | 재시도 로그 |

---

## 9. 마이그레이션 체크리스트

- [ ] 모든 FK에 on delete 정책 정의(`cascade`/`restrict`)
- [ ] `business_number` 고유성 및 형식 검증
- [ ] JSONB 컬럼 기본값 설정
- [ ] 상태값 check 제약 적용
- [ ] RLS 정책 작성 및 role별 테스트
- [ ] 인덱스 성능 점검(목록/검색/정렬)
- [ ] `updated_at` 트리거 적용
- [ ] 샘플 시드 데이터 준비(admin/user/reviewer)
