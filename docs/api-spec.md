# 와우그로스 플랫폼 MVP API 명세 초안

## 1. 문서 개요

- 목적: MVP-1 기준 API 계약(Contract) 정의
- 기준 문서: `docs/prd.md`, `docs/screen-map.md`
- 기술 스택: Next.js(App Router), Supabase, Gemini API

---

## 2. 공통 규칙

## 2.1 인증/권한

- 인증: Supabase Auth 세션 기반
- 권한(Role): `user`, `admin`, `reviewer`
- 권한 검증: 서버(Next.js Route Handler/Server Action)에서 필수 수행

## 2.2 응답 형식

성공:

```json
{
  "success": true,
  "data": {},
  "requestId": "req_xxx"
}
```

실패:

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "접근 권한이 없습니다."
  },
  "requestId": "req_xxx"
}
```

## 2.3 공통 오류 코드

| 코드 | HTTP | 설명 |
| --- | --- | --- |
| UNAUTHORIZED | 401 | 인증 없음/만료 |
| FORBIDDEN | 403 | 권한 부족 |
| NOT_FOUND | 404 | 리소스 없음 |
| VALIDATION_ERROR | 400 | 입력값 검증 실패 |
| CONFLICT | 409 | 동시성 충돌 |
| RATE_LIMITED | 429 | 요청 제한 초과 |
| INTERNAL_ERROR | 500 | 서버 내부 오류 |
| AI_TIMEOUT | 504 | AI 응답 타임아웃 |
| AI_SCHEMA_INVALID | 422 | AI JSON 스키마 불일치 |

## 2.4 페이지네이션/정렬

- 목록 API 기본 쿼리:
  - `page` (기본 1)
  - `pageSize` (기본 20, 최대 100)
  - `sortBy`, `sortOrder` (`asc` | `desc`)

---

## 3. 인증/프로필 API

## 3.1 내 프로필 조회

- `GET /api/me`
- 권한: 로그인 사용자 전체
- 용도: 현재 사용자/권한 확인

응답 `data`:

```json
{
  "id": "uuid",
  "email": "user@example.com",
  "role": "user"
}
```

## 3.2 사용자 권한 변경 (관리자)

- `PATCH /api/admin/users/:id/role`
- 권한: `admin`

요청:

```json
{
  "role": "reviewer"
}
```

---

## 4. 기업정보 API

## 4.1 기업정보 조회

- `GET /api/company`
- 권한: `user` (본인), `admin`, `reviewer`(읽기)
- 데이터 소스: `companies`

## 4.2 기업정보 생성

- `POST /api/company`
- 권한: `user`

요청:

```json
{
  "companyName": "와우테크",
  "businessNumber": "123-45-67890",
  "industry": "AI/SaaS",
  "region": "서울",
  "foundedYear": 2021,
  "certifications": ["벤처기업"],
  "patents": ["특허A"],
  "financials": {
    "revenue": 1200000000,
    "operatingProfit": 150000000,
    "debtRatio": 42.1
  }
}
```

## 4.3 기업정보 수정

- `PATCH /api/company`
- 권한: `user` (본인 데이터만)

---

## 5. 공고 API

## 5.1 공고 목록 조회

- `GET /api/programs`
- 권한: 로그인 사용자 전체
- 쿼리:
  - `q`, `region`, `category`, `agency`, `status`, `page`, `pageSize`
- 데이터 소스: `support_programs`

## 5.2 공고 상세 조회

- `GET /api/programs/:id`
- 권한: 로그인 사용자 전체
- 데이터 소스: `support_programs`, `program_metadata`

## 5.3 공고 등록

- `POST /api/admin/programs`
- 권한: `admin`

요청(예시):

```json
{
  "title": "2026 창업도약패키지",
  "agency": "중기부",
  "applicationPeriod": "2026-06-01~2026-06-30",
  "region": "전국",
  "content": "공고 원문 또는 요약문"
}
```

## 5.4 공고 수정/삭제

- `PATCH /api/admin/programs/:id`
- `DELETE /api/admin/programs/:id`
- 권한: `admin`

---

## 6. AI 공고 요약/메타데이터 API

## 6.1 AI 추출 요청

- `POST /api/admin/programs/:id/extract`
- 권한: `admin`
- 동작: OpenAI 호출 작업 생성 후 즉시 Job ID 반환

요청:

```json
{
  "taskType": "announcement_metadata"
}
```

응답 `data`:

```json
{
  "jobId": "job_uuid",
  "status": "queued"
}
```

## 6.2 AI 추출 결과 조회

- `GET /api/programs/:id/metadata`
- 권한: 로그인 사용자 전체
- 데이터 소스: `program_metadata`

## 6.3 AI 추출 결과 검수/수정/승인

- `PATCH /api/admin/reviews/programs/:id`
- 권한: `admin`, `reviewer`
- 데이터 소스: `program_metadata`, `review_logs`

요청:

```json
{
  "status": "approved",
  "metadata": {
    "target": "창업 7년 이내",
    "region": "전국"
  },
  "reviewComment": "지원대상 문구 보정"
}
```

---

## 7. 추천 API

## 7.1 추천 생성 요청

- `POST /api/matches/generate`
- 권한: `user`
- 동작: 기업정보 + 공고 조건 기반 추천 계산 및 저장

요청:

```json
{
  "companyId": "company_uuid"
}
```

응답 `data`:

```json
{
  "jobId": "job_uuid",
  "status": "queued"
}
```

## 7.2 추천 목록 조회

- `GET /api/matches`
- 권한: `user`(본인), `admin`, `reviewer`
- 데이터 소스: `matching_results`

## 7.3 추천 상세 조회

- `GET /api/matches/:id`
- 권한: `user`(본인), `admin`, `reviewer`
- 데이터 소스: `matching_results`, `program_metadata`

---

## 8. 관리자 운영/작업 상태 API

## 8.1 작업 목록 조회

- `GET /api/admin/jobs`
- 권한: `admin`
- 데이터 소스: `review_logs` (또는 jobs 테이블 도입 시 jobs)

## 8.2 작업 상세 조회

- `GET /api/admin/jobs/:id`
- 권한: `admin`

## 8.3 작업 재시도

- `POST /api/admin/jobs/:id/retry`
- 권한: `admin`
- 동작: 실패 작업 재큐잉

---

## 9. AI 작업 상태 전이

상태 집합:

- `queued`
- `running`
- `succeeded`
- `failed`

전이 규칙:

1. 요청 수신 시 `queued`
2. 워커 실행 시작 시 `running`
3. JSON schema 검증 통과 시 `succeeded`
4. API 실패, 타임아웃, 검증 실패 시 `failed`
5. `failed` 상태는 관리자 재시도로 `queued` 전이 가능

---

## 10. task_type 및 JSON 스키마 버전

| task_type | 목적 | 기본 저장 테이블 | 스키마 버전 필드 |
| --- | --- | --- | --- |
| announcement_summary | 공고 요약 | `program_metadata` | `schemaVersion` |
| announcement_metadata | 공고 메타 추출 | `program_metadata` | `schemaVersion` |
| recommendation_reasoning | 추천사유/보완사항 생성 | `matching_results` | `schemaVersion` |

필수 저장 메타:

- `taskType`
- `model`
- `promptVersion`
- `schemaVersion`
- `createdAt`
- `updatedAt`

---

## 11. 보안/RLS 체크포인트

1. `companies`: 사용자 본인 회사만 조회/수정 허용
2. `matching_results`: 본인 결과만 조회 허용, 관리자/검수자는 읽기 허용
3. `program_metadata`: 승인 전 수정은 관리자/검수자만 허용
4. `review_logs`: 생성/수정 주체(`actor_id`) 기록 필수
5. 모든 관리자 API는 서버에서 role 재검증 필수

---

## 12. 테스트 체크리스트 (API)

- [ ] 인증 없는 요청 401 검증
- [ ] 권한 부족 요청 403 검증
- [ ] 본인 데이터 접근/RLS 검증
- [ ] 입력 검증 실패 400 검증
- [ ] AI JSON 스키마 실패 422 검증
- [ ] AI 타임아웃 504 검증
- [ ] 작업 상태 전이(queued -> running -> succeeded/failed) 검증
- [ ] 재시도 후 성공/실패 재전이 검증
