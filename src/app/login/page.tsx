import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";
import { SupabaseConfigBanner } from "@/components/auth/supabase-config-banner";
import { PageCard } from "@/components/ui/page-card";
import { signIn } from "@/lib/auth/actions";

export default function LoginPage() {
  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <PageCard title="로그인" description="이메일과 비밀번호로 로그인합니다.">
        <SupabaseConfigBanner />
        <AuthForm
          action={signIn}
          submitLabel="로그인"
          fields={[
            { name: "email", label: "이메일", type: "email" },
            { name: "password", label: "비밀번호", type: "password" },
          ]}
        />
        <p className="mt-4 text-sm text-slate-600">
          계정이 없으신가요?{" "}
          <Link href="/signup" className="underline">
            회원가입
          </Link>
        </p>
        <p className="mt-2 text-xs text-slate-400">
          관리자 계정은 Supabase에서 profiles.role을 admin으로 설정하세요.
        </p>
      </PageCard>
    </main>
  );
}
