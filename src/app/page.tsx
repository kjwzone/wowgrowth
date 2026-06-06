import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-6 px-4 py-16">
      <p className="text-sm font-medium text-slate-500">WOW Growth Platform</p>
      <h1 className="text-4xl font-semibold tracking-tight">
        정부지원사업 맞춤 추천 MVP
      </h1>
      <p className="text-slate-600">
        기업정보를 등록하고 지원사업을 조회·추천받으며, AI 요약과 메타데이터 검수
        흐름을 검증하는 MVP-1 웹 서비스입니다.
      </p>
      <div className="flex gap-3">
        <Link
          href="/login"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white"
        >
          로그인
        </Link>
        <Link
          href="/signup"
          className="rounded-md border border-slate-300 px-4 py-2 text-sm"
        >
          회원가입
        </Link>
      </div>
    </main>
  );
}
