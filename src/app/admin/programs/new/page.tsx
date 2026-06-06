import { AppShell } from "@/components/layout/app-shell";
import { PageCard } from "@/components/ui/page-card";
import { ProgramForm } from "@/components/admin/program-form";
import { getSessionProfile } from "@/lib/auth/get-session";
import { redirect } from "next/navigation";

export default async function AdminProgramNewPage() {
  const session = await getSessionProfile();
  if (!session || session.profile.role !== "admin") redirect("/error/403");

  return (
    <AppShell title="공고 등록" role="admin">
      <PageCard title="공고 수동 등록">
        <ProgramForm />
      </PageCard>
    </AppShell>
  );
}
