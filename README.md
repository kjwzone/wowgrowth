# WOW Growth Platform MVP

정부지원사업 맞춤 추천 SaaS MVP-1 (Next.js + Supabase + Gemini)

## 문서

- [PRD](docs/prd.md)
- [화면맵](docs/screen-map.md)
- [API 명세](docs/api-spec.md)
- [DB 스키마](docs/db-schema.md)

## 시작하기

```bash
cp .env.example .env.local
# Supabase URL/키 입력

npm install
npm run dev
```

연결 확인 및 DB 마이그레이션:

```bash
npm run setup:check
# 테이블 MISSING 시 → docs/SETUP.md 참고
npm run db:migrate   # .env.local에 SUPABASE_DB_PASSWORD 필요
```

자세한 절차: [docs/SETUP.md](docs/SETUP.md)

## 스크립트

| 명령 | 설명 |
|------|------|
| `npm run dev` | 개발 서버 |
| `npm run build` | 프로덕션 빌드 |
| `npm test` | Vitest 단위 테스트 |

## MVP-1 구현 상태

- [x] Supabase Auth (로그인/회원가입/로그아웃)
- [x] 미들웨어 경로 보호 + admin/reviewer 권한
- [x] 기업정보·공고·추천 API
- [x] 관리자 공고 CRUD + Gemini 메타데이터 추출
- [x] AI 작업(ai_jobs) 및 검수 로그
- [ ] 프로덕션 배포 (Vercel) — 아래 가이드 참고

## Frontend MVP ver1.5 (Stitch UI 데모)

`frontend-v15/` — Vite + React, 더미 데이터 기반 UI 데모.

```bash
cd frontend-v15 && npm install && npm run dev
```

Vercel 별도 프로젝트 배포 시 **Root Directory**: `frontend-v15`

## Vercel 배포

### 1. 사전 확인

```bash
npm run build
npm test
```

### 2. GitHub 연동 (권장)

1. [vercel.com/new](https://vercel.com/new) → **Import** `kjwzone/wowgrowth`
2. Framework: **Next.js** (자동 감지)
3. **Environment Variables** (Production·Preview·Development **모두** 체크):

| 변수 | 필수 | 설명 |
|------|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✓ | Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✓ | anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✓ | 서버 API (service role) |
| `GEMINI_API_KEY` | ✓ | Google AI Studio API 키 |
| `GEMINI_MODEL` | | 기본 `gemini-2.5-flash` |

> 빌드 실패 시 로그에 `Supabase 환경 변수가 없습니다`가 보이면 위 두 `NEXT_PUBLIC_*` 값이 Vercel에 등록되지 않은 것입니다. `.env.local`과 **동일한 키 이름**으로 입력하세요.

> `SUPABASE_DB_PASSWORD`는 Vercel에 넣지 않습니다. DB 마이그레이션은 로컬 `npm run db:migrate` 또는 Supabase SQL Editor에서 실행.

4. **Deploy** 클릭

### 3. Supabase Auth 설정

배포 URL 확정 후 Supabase Dashboard → **Authentication → URL Configuration**:

- **Site URL**: `https://<your-app>.vercel.app`
- **Redirect URLs**에 동일 도메인 추가 (`https://<your-app>.vercel.app/**`)

### 4. CLI 배포 (선택)

Vercel 계정명에 한글이 있으면 CLI User-Agent 오류가 날 수 있습니다.  
[Account Tokens](https://vercel.com/account/tokens)에서 토큰 발급 후:

```powershell
$env:VERCEL_TOKEN = "your-token"
npx vercel deploy --prod --yes
```

## 프로젝트 구조

```text
src/
  app/          # App Router 페이지·API
  components/   # UI·레이아웃
  lib/          # Supabase, API, 매칭, 검증
supabase/
  migrations/   # DB 마이그레이션
docs/           # 기획·설계 문서
```
