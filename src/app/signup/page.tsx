import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";
import { SupabaseConfigBanner } from "@/components/auth/supabase-config-banner";
import { PageCard } from "@/components/ui/page-card";
import { signUp } from "@/lib/auth/actions";

export default function SignupPage() {
  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <PageCard
        title="회원가입"
        description="가입 시 profiles 레코드가 자동 생성됩니다."
      >
        <SupabaseConfigBanner />
        <AuthForm
          action={signUp}
          submitLabel="가입하기"
          fields={[
            { name: "fullName", label: "이름 (선택)", type: "text", required: false },
            { name: "email", label: "이메일", type: "email" },
            { name: "password", label: "비밀번호", type: "password" },
          ]}
        />
        <p className="mt-4 text-sm text-slate-600">
          이미 계정이 있으신가요?{" "}
          <Link href="/login" className="underline">
            로그인
          </Link>
        </p>
      </PageCard>
    </main>
  );
}
