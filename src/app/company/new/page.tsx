import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { PageCard } from "@/components/ui/page-card";
import { CompanyForm } from "@/components/company/company-form";
import { getSessionProfile } from "@/lib/auth/get-session";
import { redirect } from "next/navigation";

export default async function CompanyNewPage() {
  const session = await getSessionProfile();
  if (!session) redirect("/login");

  const isAdmin = session.profile.role === "admin";

  return (
    <AppShell title="기업정보 등록" role={session.profile.role}>
      {isAdmin ? (
        <p className="mb-4 text-sm text-slate-600">
          관리자는 여러 기업을 등록할 수 있습니다.{" "}
          <Link href="/company/detail" className="underline">
            기업정보 목록
          </Link>
        </p>
      ) : null}
      <PageCard title="기업정보 입력">
        <CompanyForm mode="create" />
      </PageCard>
    </AppShell>
  );
}
