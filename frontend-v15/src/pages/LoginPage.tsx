import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BarChart3, Lock, ShieldCheck } from "lucide-react";
import { authApi } from "@/lib/api";
import { getAppHomePath } from "@/lib/auth-routes";
import { persistSession, useSession } from "@/lib/use-session";

export default function LoginPage() {
  const navigate = useNavigate();
  const { session, isLoggedIn } = useSession();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoggedIn && session) {
      navigate(getAppHomePath(session), { replace: true });
    }
  }, [isLoggedIn, session, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const session =
        mode === "login"
          ? await authApi.login(email, password)
          : await authApi.signup(email, password, name);
      persistSession(session);
      navigate(getAppHomePath(session));
    } catch {
      setError("로그인에 실패했습니다. 다시 시도해 주세요.");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <div className="hidden w-1/2 flex-col justify-between bg-primary p-12 text-on-primary lg:flex">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-8 w-8" />
          <span className="text-xl font-bold">WOW Growth</span>
        </div>
        <div>
          <h1 className="text-3xl font-bold leading-snug">
            기업진단 → 공고 매칭 →
            <br />
            사업계획서까지 AI가 지원합니다
          </h1>
          <p className="mt-4 opacity-80">
            정부지원사업 담당자·컨설턴트·스타트업 대표를 위한 B2B SaaS
          </p>
        </div>
        <div className="flex gap-6 text-sm opacity-70">
          <span className="inline-flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            SSL 암호화
          </span>
          <span className="inline-flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Supabase Auth 연동 예정
          </span>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-md">
          <Link to="/" className="mb-8 inline-flex items-center gap-2 text-primary lg:hidden">
            <BarChart3 className="h-6 w-6 text-secondary" />
            <span className="font-bold">WOW Growth</span>
          </Link>

          <div className="mb-6 flex rounded-lg bg-surface-container p-1">
            {(["login", "signup"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`flex-1 rounded-md py-2 text-sm font-medium transition ${
                  mode === m
                    ? "bg-white text-primary shadow-sm"
                    : "text-on-surface-variant"
                }`}
              >
                {m === "login" ? "로그인" : "회원가입"}
              </button>
            ))}
          </div>

          <h2 className="text-2xl font-bold text-primary">
            {mode === "login" ? "기업 계정 로그인" : "기업 회원가입"}
          </h2>
          <p className="mt-1 text-sm text-on-surface-variant">
            {mode === "login"
              ? "등록된 이메일과 비밀번호로 로그인하세요."
              : "가입 후 기업정보를 입력하면 AI 진단이 시작됩니다."}
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            {mode === "signup" ? (
              <label className="block text-sm">
                <span className="text-on-surface-variant">대표자명</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-outline-variant/50 px-3 py-2.5 focus:border-secondary focus:outline-none"
                  placeholder="홍길동"
                />
              </label>
            ) : null}
            <label className="block text-sm">
              <span className="text-on-surface-variant">이메일</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border border-outline-variant/50 px-3 py-2.5 focus:border-secondary focus:outline-none"
                placeholder="ceo@company.com"
              />
            </label>
            <label className="block text-sm">
              <span className="text-on-surface-variant">비밀번호</span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border border-outline-variant/50 px-3 py-2.5 focus:border-secondary focus:outline-none"
                placeholder="8자 이상"
              />
            </label>
            {error ? <p className="text-sm text-error">{error}</p> : null}
            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-lg bg-secondary py-3 font-medium text-on-secondary hover:bg-secondary-container disabled:opacity-60"
            >
              {pending ? "처리 중..." : mode === "login" ? "로그인" : "가입하기"}
            </button>
          </form>

          <p className="mt-6 text-xs text-on-surface-variant">
            관리자는 이메일에 admin을 포함해 로그인하세요. (예: admin@wowgrowth.com)
          </p>
        </div>
      </div>
    </div>
  );
}
