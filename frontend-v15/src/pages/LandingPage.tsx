import { Link } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Target,
  FileText,
  Shield,
  BarChart3,
  Zap,
} from "lucide-react";

const features = [
  { icon: Target, title: "AI 기업진단", desc: "기업 프로필 기반 성장·지원 준비도 분석" },
  { icon: Sparkles, title: "맞춤 공고 매칭", desc: "수천 건 공고 중 적합도 Top 추천" },
  { icon: FileText, title: "사업계획서 자동작성", desc: "공고별 AI 초안 생성·항목별 편집" },
  { icon: Shield, title: "운영 대시보드", desc: "등록 기업·AI 문서·매칭 결과 통합 모니터링" },
];

const steps = [
  "기업정보 입력",
  "AI 기업진단",
  "공고 매칭",
  "사업계획서 생성",
  "제출 준비",
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface-bright">
      <header className="fixed top-0 z-50 w-full border-b border-outline-variant/30 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-secondary" />
            <span className="text-lg font-bold text-primary">WOW Growth</span>
          </div>
          <nav className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm text-on-surface-variant hover:text-primary">
              기능 안내
            </a>
            <a href="#process" className="text-sm text-on-surface-variant hover:text-primary">
              AI 프로세스
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/login" className="hidden text-sm font-medium text-primary md:block">
              로그인
            </Link>
            <Link
              to="/login"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-on-primary hover:bg-primary-container"
            >
              시작하기
            </Link>
          </div>
        </div>
      </header>

      <main className="pt-16">
        <section className="relative overflow-hidden px-6 pb-24 pt-20 md:pt-28">
          <div className="pointer-events-none absolute right-0 top-0 h-full w-1/2 rounded-bl-full bg-gradient-to-bl from-primary-fixed/30 to-transparent opacity-50" />
          <div className="relative mx-auto grid max-w-[1200px] items-center gap-12 lg:grid-cols-2">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-secondary-fixed/40 bg-secondary-fixed/20 px-3 py-1 text-xs font-medium text-secondary">
                <Sparkles className="h-3.5 w-3.5" />
                AI 기반 기업 맞춤형 솔루션
              </span>
              <h1 className="mt-6 text-4xl font-bold leading-tight text-primary md:text-5xl">
                우리 기업에 맞는 정부지원사업,
                <br />
                <span className="ai-gradient-text">AI가 찾아드립니다</span>
              </h1>
              <p className="mt-6 text-lg text-on-surface-variant">
                기업진단부터 사업계획서 초안 작성까지 한 번에
              </p>
              <Link
                to="/login"
                className="mt-8 inline-flex items-center gap-2 rounded-xl bg-secondary px-8 py-4 text-lg font-semibold text-on-secondary shadow-md transition hover:bg-secondary-container hover:shadow-lg"
              >
                무료로 기업진단 시작하기
                <ArrowRight className="h-5 w-5" />
              </Link>
              <div className="mt-8 flex flex-wrap gap-6 text-sm text-on-surface-variant">
                <span className="inline-flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-secondary" />1분 만에 진단 완료
                </span>
                <span className="inline-flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-secondary" />
                  데이터 기반 매칭
                </span>
              </div>
            </div>
            <div className="ai-glass-card relative rounded-2xl p-6 shadow-xl">
              <div className="mb-4 flex items-center justify-between border-b border-outline-variant/20 pb-4">
                <div>
                  <p className="font-semibold text-primary">AI 분석 리포트</p>
                  <p className="text-xs text-on-surface-variant">실시간 데이터 연동 중</p>
                </div>
                <Zap className="h-5 w-5 animate-pulse text-secondary" />
              </div>
              <div className="space-y-4">
                <div className="rounded-xl bg-surface-container-low p-4">
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="text-on-surface-variant">추천 공고 매칭률</span>
                    <span className="font-bold text-secondary">94%</span>
                  </div>
                  <div className="h-2 rounded-full bg-surface-container">
                    <div className="h-2 w-[94%] rounded-full bg-secondary" />
                  </div>
                </div>
                <div className="rounded-xl bg-surface-container-low p-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-on-surface-variant">예상 지원 가능 금액</span>
                    <span className="font-bold text-primary">최대 1.5억</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-outline-variant/20 bg-white py-12">
          <div className="mx-auto max-w-[1200px] px-6 text-center">
            <p className="mb-6 text-xs font-medium uppercase tracking-wider text-on-surface-variant">
              신뢰할 수 있는 데이터로 성장을 돕습니다
            </p>
            <div className="flex flex-wrap justify-center gap-8 opacity-70 md:gap-16">
              {["K-Startup", "데이터바우처", "기업마당", "창업진흥원"].map((name) => (
                <span key={name} className="text-lg font-bold text-primary">
                  {name}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section id="process" className="px-6 py-20">
          <div className="mx-auto max-w-[1200px]">
            <h2 className="text-center text-3xl font-bold text-primary">AI 매칭 프로세스</h2>
            <p className="mt-3 text-center text-on-surface-variant">
              복잡한 정부지원사업, 5단계로 간단하게
            </p>
            <div className="mt-12 flex flex-wrap justify-center gap-4">
              {steps.map((step, i) => (
                <div key={step} className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-sm font-bold text-on-secondary">
                    {i + 1}
                  </div>
                  <span className="font-medium text-primary">{step}</span>
                  {i < steps.length - 1 ? (
                    <ArrowRight className="hidden h-4 w-4 text-on-surface-variant md:block" />
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="features" className="bg-surface-container-low px-6 py-20">
          <div className="mx-auto max-w-[1200px]">
            <h2 className="text-center text-3xl font-bold text-primary">주요 기능</h2>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {features.map(({ icon: Icon, title, desc }) => (
                <div
                  key={title}
                  className="rounded-xl border border-outline-variant/30 bg-white p-6 shadow-sm"
                >
                  <div className="mb-4 inline-flex rounded-lg bg-primary-fixed/50 p-3 text-secondary">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold text-primary">{title}</h3>
                  <p className="mt-2 text-sm text-on-surface-variant">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-20">
          <div className="mx-auto max-w-[800px] rounded-2xl bg-primary px-8 py-12 text-center text-on-primary">
            <h2 className="text-2xl font-bold md:text-3xl">
              지금 바로 AI 기업진단을 시작하세요
            </h2>
            <p className="mt-4 opacity-90">
              스타트업·중소기업·컨설턴트 모두 무료로 체험할 수 있습니다.
            </p>
            <Link
              to="/login"
              className="mt-8 inline-flex rounded-xl bg-secondary px-8 py-3 font-semibold text-on-secondary hover:bg-secondary-container"
            >
              무료 시작하기
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
