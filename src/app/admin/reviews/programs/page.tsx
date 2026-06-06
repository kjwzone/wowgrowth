import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { RefreshPageButton } from "@/components/admin/refresh-page-button";
import { PageCard } from "@/components/ui/page-card";import { getSessionProfile } from "@/lib/auth/get-session";
import { fetchPendingMetadataReviews } from "@/lib/data/program-metadata";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AdminReviewProgramsPage() {
  const session = await getSessionProfile();
  if (
    !session ||
    (session.profile.role !== "admin" && session.profile.role !== "reviewer")
  ) {
    redirect("/error/403");
  }

  const { data: items, error } = await fetchPendingMetadataReviews();

  const supabase = await createClient();
  const programIds = [...new Set(items.map((i) => i.program_id))];
  const programMap = new Map<string, { title: string; agency: string }>();

  if (programIds.length > 0) {
    const { data: programs } = await supabase
      .from("support_programs")
      .select("id, title, agency")
      .in("id", programIds);
    (programs ?? []).forEach((p) => {
      programMap.set(p.id, { title: p.title, agency: p.agency });
    });
  }

  const { data: approvedRecent } = await supabase
    .from("program_metadata")
    .select("id, status, created_at, extracted_fields, program_id")
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(5);

  const approvedProgramIds = [
    ...new Set((approvedRecent ?? []).map((item) => item.program_id)),
  ];

  if (approvedProgramIds.length > 0) {
    const { data: approvedPrograms } = await supabase
      .from("support_programs")
      .select("id, title, agency")
      .in("id", approvedProgramIds);

    (approvedPrograms ?? []).forEach((program) => {
      programMap.set(program.id, { title: program.title, agency: program.agency });
    });
  }

  return (
    <AppShell title="AI 검수" role={session.profile.role}>
      <div className="mb-4 flex justify-end">
        <RefreshPageButton />
      </div>
      {error ? (
        <PageCard title="조회 오류">
          <p className="text-sm text-red-600">{error}</p>
        </PageCard>
      ) : null}

      <PageCard title="검수 대기 목록">
        {items.length === 0 ? (
          <p className="text-sm text-slate-500">
            검수 대기 중인 메타데이터가 없습니다. 공고 상세에서 AI 추출을 먼저
            실행하세요.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {items.map((item) => {
              const program = programMap.get(item.program_id);
              const fields = item.extracted_fields as { title?: string };
              return (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">
                      {fields?.title ?? program?.title ?? "제목 없음"}
                    </p>
                    <p className="text-sm text-slate-500">
                      {program?.agency ?? "-"} · {item.status} ·{" "}
                      {new Date(item.created_at).toLocaleString("ko-KR")}
                    </p>
                  </div>
                  <Link
                    href={`/admin/reviews/programs/${item.id}`}
                    className="shrink-0 rounded-md bg-slate-900 px-3 py-1.5 text-sm text-white"
                  >
                    검수하기
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </PageCard>

      {(approvedRecent ?? []).length > 0 ? (
        <PageCard title="최근 승인 완료" className="mt-4">
          <ul className="text-sm text-slate-600">
            {(approvedRecent ?? []).map((a) => {
              const fields = a.extracted_fields as { title?: string };
              const program = programMap.get(a.program_id);
              return (
                <li key={a.id} className="py-1">
                  <Link
                    href={`/admin/reviews/programs/${a.id}`}
                    className="hover:underline"
                  >
                    {fields?.title ?? program?.title ?? a.id} — approved
                  </Link>
                </li>
              );
            })}
          </ul>
        </PageCard>
      ) : null}
    </AppShell>
  );
}
