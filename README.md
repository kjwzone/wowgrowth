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
- [ ] 프로덕션 배포 (Vercel)

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
