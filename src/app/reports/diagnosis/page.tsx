import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { PageCard } from "@/components/ui/page-card";
import { GenerateDiagnosisButton } from "@/components/reports/generate-diagnosis-button";
import { getSessionProfile } from "@/lib/auth/get-session";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DiagnosisReportsPage() {
  const session = await getSessionProfile();
  if (!session) redirect("/login");

  const supabase = await createClient();
  const isStaff =
    session.profile.role === "admin" || session.profile.role === "reviewer";

  const companiesQuery = isStaff
    ? supabase
        .from("companies")
        .select("id, company_name")
        .order("created_at", { ascending: false })
    : supabase
        .from("companies")
        .select("id, company_name")
        .eq("owner_id", session.userId)
        .order("updated_at", { ascending: false });

  const { data: companyRows } = await companiesQuery;
  const companies = (companyRows ?? []).map((company) => ({
    id: company.id,
    companyName: company.company_name,
  }));

  const companyIds = companies.map((company) => company.id);
  const companyNameMap = new Map(
    companies.map((company) => [company.id, company.companyName]),
  );

  const { data: reports } =
    companyIds.length > 0 || isStaff
      ? await supabase
          .from("diagnosis_reports")
          .select("id, status, created_at, report_json, company_id")
          .order("created_at", { ascending: false })
          .limit(isStaff ? 50 : 20)
      : { data: [] };

  const visibleReports = isStaff
    ? reports ?? []
    : (reports ?? []).filter((report) => companyIds.includes(report.company_id));

  return (
    <AppShell title="기업진단 보고서" role={session.profile.role}>
      <PageCard title="보고서 생성">
        <GenerateDiagnosisButton companies={companies} />
      </PageCard>
      <PageCard title="보고서 목록" className="mt-4">
        {visibleReports.length === 0 ? (
          <p className="text-sm text-slate-500">생성된 보고서가 없습니다.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {visibleReports.map((report) => {
              const summary =
                (report.report_json as { company_summary?: string })?.company_summary ??
                "기업진단 보고서";
              const companyName = companyNameMap.get(report.company_id);
              return (
                <li key={report.id} className="py-3">
                  <Link
                    href={`/reports/diagnosis/${report.id}`}
                    className="font-medium hover:underline"
                  >
                    {summary.slice(0, 60)}
                    {summary.length > 60 ? "…" : ""}
                  </Link>
                  <p className="text-sm text-slate-500">
                    {companyName ? `${companyName} · ` : ""}
                    {report.status} · {new Date(report.created_at).toLocaleString("ko-KR")}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </PageCard>
    </AppShell>
  );
}
