# WOW Growth Frontend MVP ver1.5

Stitch 디자인(와우그로스 AI 정부지원 플랫폼) 기반 React 프론트엔드 데모입니다.  
백엔드 없이 TypeScript 더미 데이터 + mock API로 동작합니다.

## 실행

```bash
cd frontend-v15
npm install
npm run dev
npm run build
npm test
```

## 라우팅

| 경로 | 페이지 |
|------|--------|
| `/` | 랜딩 |
| `/login` | 로그인·회원가입 |
| `/dashboard` | 대시보드 |
| `/programs` | 공고 목록 |
| `/programs/:id` | 공고 상세 |
| `/company-profile` | 기업정보 |
| `/matching-results` | AI 매칭 |
| `/business-plan` | 사업계획서 |
| `/admin/review` | 관리자 검수 |

관리자 데모: `admin@wowgrowth.com` 으로 로그인

## 구조

```text
src/
  components/layout/   AppLayout, Sidebar, Topbar
  components/ui/     StatCard, ProgramCard, AiAgentPanel, ...
  data/              더미 데이터
  lib/api/           mock API (추후 실 API 교체)
  pages/             9개 페이지
  types/             공통 타입
```

## Stitch 연동

디자인 토큰(남색 `#031635`, 블루 `#0040e0`, Noto Sans KR)은 Stitch 프로젝트  
`와우그로스 AI 정부지원 플랫폼` (ID: `10651547431422235105`)에서 추출했습니다.
