import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { ProgramList } from "@/components/admin/program-list";
import { PageCard } from "@/components/ui/page-card";
import { getSessionProfile } from "@/lib/auth/get-session";
import { createClient } from "@/lib/supabase/server";
import type { ProgramStatus } from "@/lib/validation/program";
import { redirect } from "next/navigation";

export default async function AdminProgramsPage() {
  const session = await getSessionProfile();
  if (!session || session.profile.role !== "admin") redirect("/error/403");

  const supabase = await createClient();
  const { data: programs } = await supabase
    .from("support_programs")
    .select("id, title, status, agency")
    .order("created_at", { ascending: false })
    .limit(30);

  const items = (programs ?? []).map((program) => ({
    id: program.id,
    title: program.title,
    agency: program.agency,
    status: program.status as ProgramStatus,
  }));

  return (
    <AppShell title="공고 관리" role="admin">
      <PageCard title="공고 목록">
        <Link href="/admin/programs/new" className="text-sm underline">
          공고 등록
        </Link>
        <ProgramList programs={items} />
      </PageCard>
    </AppShell>
  );
}
