import { AppShell } from "@/components/layout/app-shell";
import { UserDashboardView } from "@/components/dashboard/user-dashboard-view";
import { getSessionProfile } from "@/lib/auth/get-session";
import { fetchUserDashboardSummary } from "@/lib/data/user-dashboard";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await getSessionProfile();
  if (!session) redirect("/login");

  const isStaff =
    session.profile.role === "admin" || session.profile.role === "reviewer";

  const summary = await fetchUserDashboardSummary({
    userId: session.userId,
    isStaff,
  });

  return (
    <AppShell title="대시보드" role={session.profile.role}>
      <UserDashboardView
        email={session.profile.email}
        role={session.profile.role}
        summary={summary}
        isStaff={isStaff}
      />
    </AppShell>
  );
}
