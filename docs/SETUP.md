# 로컬 설정 (API 키 입력 후)

## 1. 연결 확인

```bash
npm run setup:check
```

`auth health: 200` 이고 테이블이 `OK`면 준비 완료입니다.

## 2. DB 마이그레이션 (필수)

Supabase **Database password**가 필요합니다.

1. [Supabase Dashboard](https://supabase.com/dashboard/project/yhpvaehpzajgaaytwkye/settings/database) → Database password 확인/재설정
2. `.env.local`에 추가:

```env
SUPABASE_DB_PASSWORD=여기에_비밀번호
```

3. 적용:

```bash
npm run db:migrate
```

**또는** SQL Editor에서 `supabase/migrations/20250602140000_initial_schema.sql` 전체를 붙여넣고 Run.

## 3. 개발 서버

```bash
npm run dev
```

## 4. 회원가입 오류: `email rate limit exceeded`

Supabase가 **인증 메일 발송 횟수**를 제한해서 발생합니다. (같은 이메일로 회원가입을 여러 번 누를 때 흔함)

**MVP 개발용 해결 (권장):**

1. [Authentication → Providers → Email](https://supabase.com/dashboard/project/yhpvaehpzajgaaytwkye/auth/providers)
2. **Confirm email** 끄기 (OFF)
3. 30분 정도 기다린 뒤 `/signup` 다시 시도  
   또는 **이미 가입됐다면** `/login`에서 로그인

**이미 한 번 가입에 성공했다면** SQL로 admin만 올리면 됩니다:

```sql
update public.profiles set role = 'admin' where email = 'petezone@naver.com';
```

## 5. 첫 관리자 계정

1. `/signup`으로 회원가입 (또는 `/login` 로그인)
2. SQL Editor에서:

```sql
update public.profiles set role = 'admin' where email = 'your@email.com';
```

## 6. MVP-1.5 마이그레이션

초기 스키마가 이미 적용된 경우에도, 아래만 추가 적용됩니다.

```bash
npm run db:migrate
```

`diagnosis_reports`, `business_plan_drafts` 테이블이 `setup:check`에서 OK여야 합니다.

## 7. E2E 흐름 (MVP-1)

1. `/admin/programs/new` — 공고 등록
2. 공고 상세 — AI 메타데이터 추출
3. `/company/new` — 기업정보
4. `/matches` — 추천 생성

## 8. E2E 흐름 (MVP-1.5)

1. `/reports/diagnosis` — **기업진단 보고서 생성** (Gemini)
2. `/matches/[id]` — **사업계획서 초안 생성** (해당 공고 기준)
3. `/business-plans` — 초안 목록·상세 확인
