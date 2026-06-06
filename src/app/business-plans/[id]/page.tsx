import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { PageCard } from "@/components/ui/page-card";
import { getSessionProfile } from "@/lib/auth/get-session";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { BusinessPlanDraft } from "@/lib/ai/schemas";

type Props = { params: Promise<{ id: string }> };

export default async function BusinessPlanDetailPage({ params }: Props) {
  const session = await getSessionProfile();
  if (!session) redirect("/login");
  const { id } = await params;
  const supabase = await createClient();

  const { data: row } = await supabase
    .from("business_plan_drafts")
    .select("id, title, status, plan_json, program_id, company_id, created_at, prompt_version")
    .eq("id", id)
    .maybeSingle();

  if (!row) {
    return (
      <AppShell title="사업계획서" role={session.profile.role}>
        <PageCard title="초안을 찾을 수 없습니다">
          <Link href="/business-plans" className="text-sm underline">
            목록으로
          </Link>
        </PageCard>
      </AppShell>
    );
  }

  const { data: company } = await supabase
    .from("companies")
    .select("owner_id, company_name")
    .eq("id", row.company_id)
    .single();

  const isStaff =
    session.profile.role === "admin" || session.profile.role === "reviewer";
  if (company?.owner_id !== session.userId && !isStaff) {
    redirect("/error/403");
  }

  const { data: program } = await supabase
    .from("support_programs")
    .select("title, agency")
    .eq("id", row.program_id)
    .maybeSingle();

  const plan = row.plan_json as BusinessPlanDraft;

  return (
    <AppShell title="사업계획서 초안" role={session.profile.role}>
      <PageCard title={row.title || plan.title}>
        <p className="text-sm text-slate-500">
          {company?.company_name} · {program?.title} · {row.status}
        </p>
        <p className="text-xs text-slate-400">
          {new Date(row.created_at).toLocaleString("ko-KR")}
          {row.prompt_version ? ` · prompt ${row.prompt_version}` : ""}
        </p>
      </PageCard>

      {plan.premises ? (
        <PageCard title="작성 전제" className="mt-4">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
            {plan.premises}
          </p>
        </PageCard>
      ) : null}

      <div className="mt-4 space-y-4">
        {plan.sections.map((section) => (
          <PageCard key={section.section_title} title={section.section_title}>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
              {section.content}
            </p>
          </PageCard>
        ))}
      </div>

      {plan.self_verification && plan.self_verification.length > 0 ? (
        <PageCard title="자기검증표" className="mt-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2 pr-4">검증 항목</th>
                  <th className="py-2 pr-4">결과</th>
                  <th className="py-2">보완</th>
                </tr>
              </thead>
              <tbody>
                {plan.self_verification.map((row) => (
                  <tr key={row.item} className="border-b border-slate-100">
                    <td className="py-2 pr-4">{row.item}</td>
                    <td className="py-2 pr-4">{row.result}</td>
                    <td className="py-2 text-slate-600">{row.notes ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </PageCard>
      ) : null}

      {plan.key_risks && plan.key_risks.length > 0 ? (
        <PageCard title="주요 보완 리스크" className="mt-4">
          <ul className="list-inside list-disc text-sm text-slate-700">
            {plan.key_risks.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </PageCard>
      ) : null}

      {plan.evidence_checklist && plan.evidence_checklist.length > 0 ? (
        <PageCard title="추가 증빙자료" className="mt-4">
          <ul className="list-inside list-disc text-sm text-slate-700">
            {plan.evidence_checklist.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </PageCard>
      ) : null}

      <p className="mt-4 text-center">
        <Link href="/business-plans" className="text-sm underline">
          목록으로
        </Link>
      </p>
    </AppShell>
  );
}
