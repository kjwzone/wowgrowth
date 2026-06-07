import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { PageCard } from "@/components/ui/page-card";
import { getSessionProfile } from "@/lib/auth/get-session";
import { isBizinfoConfigured } from "@/lib/bizinfo/env";
import { fetchBizinfoPrograms } from "@/lib/bizinfo/fetch-programs";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function ProgramsPage() {
  const session = await getSessionProfile();
  if (!session) redirect("/login");

  const useBizinfo = isBizinfoConfigured();
  const bizinfo = useBizinfo
    ? await fetchBizinfoPrograms({ page: 1, pageSize: 20 }).catch(() => null)
    : null;

  const supabase = await createClient();
  const { data: programs } = await supabase
    .from("support_programs")
    .select("id, title, agency, region, status, application_end_date")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <AppShell title="지원사업 목록" role={session.profile.role}>
      <PageCard
        title={
          bizinfo
            ? "정부지원사업 공고 목록 (기업마당 API)"
            : "정부지원사업 공고 목록"
        }
      >
        {bizinfo ? (
          <ul className="divide-y divide-slate-100">
            {bizinfo.items.map((p) => (
              <li key={p.id} className="py-3">
                {p.externalUrl ? (
                  <a
                    href={p.externalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium hover:underline"
                  >
                    {p.title}
                  </a>
                ) : (
                  <span className="font-medium">{p.title}</span>
                )}
                <p className="text-sm text-slate-500">
                  {p.agency} · {p.region} · {p.category} · 마감 {p.deadline}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <>
            <p className="mb-4 text-sm text-slate-500">
              {useBizinfo
                ? "기업마당 API 호출에 실패했습니다. DB 공고를 표시합니다."
                : "BIZINFO_API_KEY를 설정하면 기업마당 실시간 공고를 표시합니다."}
            </p>
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
          </>
        )}
      </PageCard>
    </AppShell>
  );
}
