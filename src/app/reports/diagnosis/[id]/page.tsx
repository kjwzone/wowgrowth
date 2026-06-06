import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { PageCard } from "@/components/ui/page-card";
import { getSessionProfile } from "@/lib/auth/get-session";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { DiagnosisReport } from "@/lib/ai/schemas";

type Props = { params: Promise<{ id: string }> };

export default async function DiagnosisReportDetailPage({ params }: Props) {
  const session = await getSessionProfile();
  if (!session) redirect("/login");
  const { id } = await params;
  const supabase = await createClient();

  const { data: row } = await supabase
    .from("diagnosis_reports")
    .select("*, companies(company_name, owner_id)")
    .eq("id", id)
    .maybeSingle();

  if (!row) {
    return (
      <AppShell title="기업진단 보고서" role={session.profile.role}>
        <PageCard title="보고서를 찾을 수 없습니다">
          <Link href="/reports/diagnosis" className="text-sm underline">
            목록으로
          </Link>
        </PageCard>
      </AppShell>
    );
  }

  const company = row.companies as { company_name: string; owner_id: string } | null;
  const isStaff =
    session.profile.role === "admin" || session.profile.role === "reviewer";
  if (company?.owner_id !== session.userId && !isStaff) {
    redirect("/error/403");
  }

  const report = row.report_json as DiagnosisReport;

  return (
    <AppShell title="기업진단 보고서 상세" role={session.profile.role}>
      <PageCard title={company?.company_name ?? "기업진단"}>
        <p className="text-sm text-slate-500">
          상태: {row.status} · {new Date(row.created_at).toLocaleString("ko-KR")}
        </p>
      </PageCard>

      <PageCard title="요약" className="mt-4">
        <p className="text-sm leading-relaxed">{report.company_summary}</p>
        <p className="mt-4 text-sm text-slate-600">{report.overall_comment}</p>
      </PageCard>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <PageCard title="강점">
          <ul className="list-inside list-disc text-sm">
            {report.strengths.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </PageCard>
        <PageCard title="약점">
          <ul className="list-inside list-disc text-sm">
            {report.weaknesses.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </PageCard>
      </div>

      <PageCard title="진단" className="mt-4">
        <p className="text-sm font-medium">재무 진단</p>
        <p className="mt-1 text-sm text-slate-700">{report.financial_diagnosis}</p>
        <p className="mt-4 text-sm font-medium">비재무 진단</p>
        <p className="mt-1 text-sm text-slate-700">{report.non_financial_diagnosis}</p>
        <p className="mt-4 text-sm font-medium">정부지원 준비도</p>
        <p className="mt-1 text-sm text-slate-700">{report.government_support_readiness}</p>
      </PageCard>

      <PageCard title="권장 조치" className="mt-4">
        <ul className="list-inside list-disc text-sm">
          {report.recommended_actions.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
      </PageCard>

      <p className="mt-4 text-center">
        <Link href="/reports/diagnosis" className="text-sm underline">
          목록으로
        </Link>
      </p>
    </AppShell>
  );
}
