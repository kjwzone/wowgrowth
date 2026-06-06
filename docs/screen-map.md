# 와우그로스 플랫폼 MVP 화면맵 초안

## 1. 문서 개요

- 목적: MVP-1 기준 화면 구조, 권한, 데이터 흐름을 정의한다.
- 범위: `user`, `admin`, `reviewer` 권한 기준 웹 화면
- 기준 문서: `docs/prd.md`의 실행 확정안 및 화면맵 체크리스트

---

## 2. 화면 설계 원칙

1. 도메인별로 목록/상세/입력(생성·수정)/상태·에러 화면을 분리한다.
2. 각 화면마다 접근 권한, 진입 조건, 이탈 경로를 명시한다.
3. 상세 화면에는 데이터 소스 테이블을 명시한다.
4. AI 생성 기능은 요청 시점과 결과 확인 시점을 분리한다.

---

## 3. 라우팅 트리 (MVP-1)

```text
/
├─ /login
├─ /signup
├─ /dashboard
├─ /company
│  ├─ /company/new
│  ├─ /company/edit
│  └─ /company/detail
├─ /programs
│  └─ /programs/[id]
├─ /matches
│  ├─ /matches/[id]
│  └─ /matches/[id]/status
├─ /ai-results
│  ├─ /ai-results/programs
│  └─ /ai-results/programs/[id]
├─ /error
│  ├─ /error/403
│  ├─ /error/404
│  └─ /error/500
└─ /admin
   ├─ /admin
   ├─ /admin/programs
   ├─ /admin/programs/new
   ├─ /admin/programs/[id]/edit
   ├─ /admin/reviews/programs
   ├─ /admin/reviews/programs/[id]
   ├─ /admin/users
   ├─ /admin/users/[id]
   ├─ /admin/jobs
   └─ /admin/jobs/[id]
```

---

## 4. 사용자 화면 맵

## 4.1 인증 도메인

| 화면명 | 경로 | 권한 | 진입 조건 | 이탈 경로 | 데이터 소스 |
| --- | --- | --- | --- | --- | --- |
| 로그인 | `/login` | 비회원 | 비인증 상태 | 성공 시 `/dashboard` | `supabase.auth` |
| 회원가입 | `/signup` | 비회원 | 비인증 상태 | 완료 시 `/login` | `supabase.auth`, `profiles` |
| 권한없음 | `/error/403` | 전체 | 권한 부족 접근 | 이전 화면 또는 홈 | - |

## 4.2 기업정보 도메인

| 화면명 | 경로 | 권한 | 진입 조건 | 이탈 경로 | 데이터 소스 |
| --- | --- | --- | --- | --- | --- |
| 내 기업정보 상세 | `/company/detail` | user | 로그인 완료 | 수정 시 `/company/edit` | `companies` |
| 기업정보 등록 | `/company/new` | user | 기업정보 미등록 | 저장 후 `/company/detail` | `companies` |
| 기업정보 수정 | `/company/edit` | user | 기업정보 등록 완료 | 저장 후 `/company/detail` | `companies` |
| 기업정보 저장 실패 | `/error/500` | user | 저장 API 오류 | 재시도 또는 상세 화면 | - |

## 4.3 공고 도메인

| 화면명 | 경로 | 권한 | 진입 조건 | 이탈 경로 | 데이터 소스 |
| --- | --- | --- | --- | --- | --- |
| 공고 목록 | `/programs` | user | 로그인 완료 | 상세 진입 `/programs/[id]` | `support_programs` |
| 공고 상세 | `/programs/[id]` | user | 목록에서 공고 선택 | 추천 화면 `/matches` | `support_programs`, `program_metadata` |
| 검색 결과 없음 상태 | `/programs` | user | 검색/필터 결과 0건 | 필터 초기화 | `support_programs` |

## 4.4 추천 도메인

| 화면명 | 경로 | 권한 | 진입 조건 | 이탈 경로 | 데이터 소스 |
| --- | --- | --- | --- | --- | --- |
| 추천 목록 | `/matches` | user | 기업정보 등록 완료 | 추천 상세 `/matches/[id]` | `matching_results` |
| 추천 상세(사유/보완) | `/matches/[id]` | user | 추천 결과 존재 | 상태 화면 `/matches/[id]/status` | `matching_results`, `program_metadata`, `companies` |
| 추천 생성 상태 | `/matches/[id]/status` | user | 추천 생성 요청 완료 | 성공 시 상세, 실패 시 재요청 | `matching_results` |

## 4.5 AI 결과 도메인 (공고 요약/메타데이터)

| 화면명 | 경로 | 권한 | 진입 조건 | 이탈 경로 | 데이터 소스 |
| --- | --- | --- | --- | --- | --- |
| AI 결과 목록 | `/ai-results/programs` | user, admin, reviewer | AI 결과 존재 | 상세 진입 | `program_metadata` |
| AI 결과 상세 | `/ai-results/programs/[id]` | user, admin, reviewer | 목록에서 항목 선택 | 목록 복귀 | `program_metadata`, `support_programs` |
| AI 작업 상태(queued/running/failed) | `/matches/[id]/status` 또는 `/admin/jobs/[id]` | user, admin | AI 생성 요청 이후 | 성공 상세 또는 재시도 | `program_metadata`, `review_logs` |

---

## 5. 관리자/검수자 화면 맵

## 5.1 관리자 공고 관리 도메인

| 화면명 | 경로 | 권한 | 진입 조건 | 이탈 경로 | 데이터 소스 |
| --- | --- | --- | --- | --- | --- |
| 관리자 대시보드 | `/admin` | admin | 관리자 로그인 | 각 관리 화면 이동 | `support_programs`, `matching_results`, `review_logs` |
| 공고 관리 목록 | `/admin/programs` | admin | 관리자 로그인 | 등록/수정 화면 이동 | `support_programs` |
| 공고 등록 | `/admin/programs/new` | admin | 목록 화면 진입 | 저장 후 목록 | `support_programs` |
| 공고 수정 | `/admin/programs/[id]/edit` | admin | 공고 선택 | 저장 후 상세/목록 | `support_programs` |

## 5.2 AI 검수 도메인

| 화면명 | 경로 | 권한 | 진입 조건 | 이탈 경로 | 데이터 소스 |
| --- | --- | --- | --- | --- | --- |
| AI 검수 대기 목록 | `/admin/reviews/programs` | admin, reviewer | 검수 대기 항목 존재 | 검수 상세 | `program_metadata`, `review_logs` |
| AI 검수 상세 | `/admin/reviews/programs/[id]` | admin, reviewer | 검수 항목 선택 | 승인/반려 후 목록 | `program_metadata`, `support_programs`, `review_logs` |
| 검수 충돌/권한 오류 | `/error/403` | admin, reviewer | 동시 수정 또는 권한 부족 | 목록 복귀 | - |

## 5.3 사용자 관리 도메인

| 화면명 | 경로 | 권한 | 진입 조건 | 이탈 경로 | 데이터 소스 |
| --- | --- | --- | --- | --- | --- |
| 사용자 목록 | `/admin/users` | admin | 관리자 로그인 | 사용자 상세 | `profiles` |
| 사용자 상세/권한 변경 | `/admin/users/[id]` | admin | 사용자 선택 | 저장 후 목록/상세 | `profiles` |
| 변경 실패 상태 | `/error/500` | admin | 변경 API 실패 | 재시도 | - |

## 5.4 운영 모니터링 도메인

| 화면명 | 경로 | 권한 | 진입 조건 | 이탈 경로 | 데이터 소스 |
| --- | --- | --- | --- | --- | --- |
| 작업 상태 목록 | `/admin/jobs` | admin | 관리자 로그인 | 상세 진입 | `review_logs`, `program_metadata`, `matching_results` |
| 작업 로그 상세 | `/admin/jobs/[id]` | admin | 작업 선택 | 재시도/목록 복귀 | `review_logs` |
| API 실패/타임아웃 상태 | `/error/500` | admin | 외부 API 실패 | 재시도 또는 목록 복귀 | - |

---

## 6. 상태/에러 화면 정책

| 상태 유형 | 노출 조건 | 기본 액션 |
| --- | --- | --- |
| Empty | 목록 0건 | 필터 초기화, 등록 유도 |
| Loading | 최초 조회/재조회 | 스켈레톤 또는 로더 표시 |
| Queued | AI 작업 대기 | 자동 새로고침 또는 수동 새로고침 |
| Running | AI 작업 실행 중 | 진행 상태 안내 |
| Failed | AI/API 실패 | 재시도 버튼, 관리자 문의 안내 |
| Forbidden | 권한 부족 | `/error/403` 이동 |
| NotFound | 없는 리소스 | `/error/404` 이동 |

---

## 7. 화면별 데이터 소스 매핑

| 도메인 | 주요 테이블 | 보조 테이블 |
| --- | --- | --- |
| 인증/권한 | `profiles` | `supabase.auth` |
| 기업정보 | `companies` | `profiles` |
| 공고 | `support_programs` | `program_metadata` |
| 추천 | `matching_results` | `companies`, `program_metadata` |
| AI 결과/검수 | `program_metadata` | `review_logs`, `support_programs` |
| 운영 모니터링 | `review_logs` | `matching_results`, `program_metadata` |

---

## 8. 2단계 산출물 체크 결과

- [x] 사용자/관리자/검수자 화면 분리
- [x] 도메인별 목록/상세/입력/상태·에러 정의
- [x] 화면별 권한/진입/이탈 경로 정의
- [x] 상세 화면 데이터 소스 테이블 명시
- [x] AI 요청 시점과 결과 확인 시점 분리

---

## 9. 다음 작업

1. 본 문서 기준으로 와이어프레임(저충실도) 작성
2. 각 화면별 API 명세(입력/출력/오류코드) 작성
3. Supabase RLS 정책 표(권한별 CRUD) 작성
4. AI 작업 상태 전이도(queued -> running -> succeeded/failed) 작성
