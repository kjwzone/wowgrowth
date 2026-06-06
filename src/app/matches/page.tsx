import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { CompanyMatchList } from "@/components/matches/company-match-list";
import { PageCard } from "@/components/ui/page-card";
import { getSessionProfile } from "@/lib/auth/get-session";
import { fetchMatchesPageData } from "@/lib/data/matches-list";
import { redirect } from "next/navigation";

export default async function MatchesPage() {
  const session = await getSessionProfile();
  if (!session) redirect("/login");

  const isStaff =
    session.profile.role === "admin" || session.profile.role === "reviewer";

  const { companies, matches } = await fetchMatchesPageData({
    userId: session.userId,
    isStaff,
  });

  return (
    <AppShell title="추천사업" role={session.profile.role}>
      {isStaff ? (
        <PageCard title={`등록 기업 (${companies.length}건)`}>
          <CompanyMatchList companies={companies} matches={matches} />
          <Link href="/company/detail" className="mt-4 inline-block text-sm underline">
            기업정보 관리
          </Link>
        </PageCard>
      ) : companies.length > 0 ? (
        <PageCard title="추천 생성">
          <CompanyMatchList
            companies={companies}
            matches={matches}
            showOwnerEmail={false}
          />
        </PageCard>
      ) : (
        <PageCard title="기업정보가 필요합니다">
          <Link href="/company/new" className="text-sm underline">
            기업정보 등록
          </Link>
        </PageCard>
      )}
    </AppShell>
  );
}
