import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { CompanyPlanList } from "@/components/business-plans/company-plan-list";
import { PageCard } from "@/components/ui/page-card";
import { getSessionProfile } from "@/lib/auth/get-session";
import { fetchBusinessPlansPageData } from "@/lib/data/business-plans-list";
import { redirect } from "next/navigation";

export default async function BusinessPlansPage() {
  const session = await getSessionProfile();
  if (!session) redirect("/login");

  const isStaff =
    session.profile.role === "admin" || session.profile.role === "reviewer";

  const { companies, matches, plans } = await fetchBusinessPlansPageData({
    userId: session.userId,
    isStaff,
  });

  return (
    <AppShell title="사업계획서 초안" role={session.profile.role}>
      {isStaff ? (
        <PageCard title={`등록 기업 (${companies.length}건)`}>
          <CompanyPlanList
            companies={companies}
            matches={matches}
            plans={plans}
          />
          <Link href="/company/detail" className="mt-4 inline-block text-sm underline">
            기업정보 관리
          </Link>
        </PageCard>
      ) : companies.length > 0 ? (
        <PageCard title="사업계획서 초안">
          <CompanyPlanList
            companies={companies}
            matches={matches}
            plans={plans}
            showOwnerEmail={false}
          />
        </PageCard>
      ) : (
        <PageCard title="기업정보가 필요합니다">
          <p className="text-sm text-slate-600">
            기업정보를 먼저 등록해야 사업계획서를 생성할 수 있습니다.
          </p>
          <Link href="/company/new" className="mt-3 inline-block text-sm underline">
            기업정보 등록
          </Link>
        </PageCard>
      )}
    </AppShell>
  );
}
