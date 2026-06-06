import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { PageCard } from "@/components/ui/page-card";
import { getSessionProfile } from "@/lib/auth/get-session";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function ProgramsPage() {
  const session = await getSessionProfile();
  if (!session) redirect("/login");

  const supabase = await createClient();
  const { data: programs } = await supabase
    .from("support_programs")
    .select("id, title, agency, region, status, application_end_date")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <AppShell title="지원사업 목록" role={session.profile.role}>
      <PageCard title={"공고 목록 ---> '기업마당' API 실시간 연동 예정"}>
        <ul className="divide-y divide-slate-100">
          {(programs ?? []).map((p) => (
            <li key={p.id} className="py-3">
              <Link href={`/programs/${p.id}`} className="font-medium hover:underline">
                {p.title}
              </Link>
              <p className="text-sm text-slate-500">
                {p.agency} · {p.region ?? "지역 미정"}
              </p>
            </li>
          ))}
          {(programs ?? []).length === 0 ? (
            <li className="py-4 text-sm text-slate-500">게시된 공고가 없습니다.</li>
          ) : null}
        </ul>
      </PageCard>
    </AppShell>
  );
}
