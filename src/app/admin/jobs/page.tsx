import { AppShell } from "@/components/layout/app-shell";
import { PageCard } from "@/components/ui/page-card";
import { getSessionProfile } from "@/lib/auth/get-session";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AdminJobsPage() {
  const session = await getSessionProfile();
  if (!session || session.profile.role !== "admin") redirect("/error/403");

  const supabase = await createClient();
  const { data: jobs } = await supabase
    .from("ai_jobs")
    .select("id, task_type, status, error_code, created_at")
    .order("created_at", { ascending: false })
    .limit(30);

  return (
    <AppShell title="작업 모니터링" role="admin">
      <PageCard title="AI 작업 목록">
        <ul className="divide-y divide-slate-100 text-sm">
          {(jobs ?? []).map((j) => (
            <li key={j.id} className="py-2">
              <span className="font-mono text-xs">{j.id.slice(0, 8)}</span> —{" "}
              {j.task_type} / {j.status}
              {j.error_code ? ` (${j.error_code})` : ""}
            </li>
          ))}
          {(jobs ?? []).length === 0 ? (
            <li className="py-4 text-slate-500">작업 이력이 없습니다.</li>
          ) : null}
        </ul>
      </PageCard>
    </AppShell>
  );
}
