import { AppShell } from "@/components/layout/app-shell";
import { PageCard } from "@/components/ui/page-card";
import { CompanyForm } from "@/components/company/company-form";
import { getSessionProfile } from "@/lib/auth/get-session";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

type Props = { searchParams: Promise<{ id?: string }> };

export default async function CompanyEditPage({ searchParams }: Props) {
  const session = await getSessionProfile();
  if (!session) redirect("/login");
  const { id: companyId } = await searchParams;

  const supabase = await createClient();
  const isAdmin = session.profile.role === "admin";

  const query = supabase.from("companies").select("*");
  const { data: company } = isAdmin && companyId
    ? await query.eq("id", companyId).maybeSingle()
    : await query.eq("owner_id", session.userId).maybeSingle();

  if (!company) redirect("/company/new");

  if (!isAdmin && company.owner_id !== session.userId) {
    redirect("/error/403");
  }

  return (
    <AppShell title="기업정보 수정" role={session.profile.role}>
      <PageCard title="기업정보 수정">
        <CompanyForm
          mode="edit"
          companyId={company.id}
          initial={{
            companyName: company.company_name,
            businessNumber: company.business_number,
            industry: company.industry,
            region: company.region,
            addressBase: company.address_base,
            addressDetail: company.address_detail,
            foundedDate: company.founded_date,
            foundedYear: company.founded_year,
            financials: company.financials as Record<string, unknown>,
          }}
        />
      </PageCard>
    </AppShell>
  );
}
