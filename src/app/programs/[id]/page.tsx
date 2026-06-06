import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { PageCard } from "@/components/ui/page-card";
import { ExtractMetadataButton } from "@/components/admin/extract-metadata-button";
import { getSessionProfile } from "@/lib/auth/get-session";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

type Props = { params: Promise<{ id: string }> };

export default async function ProgramDetailPage({ params }: Props) {
  const session = await getSessionProfile();
  if (!session) redirect("/login");
  const { id } = await params;

  const supabase = await createClient();
  const { data: program } = await supabase
    .from("support_programs")
    .select("*")
    .eq("id", id)
    .single();

  const { data: metadataList } = await supabase
    .from("program_metadata")
    .select("id, status, extracted_fields, created_at")
    .eq("program_id", id)
    .order("created_at", { ascending: false })
    .limit(3);

  if (!program) {
    return (
      <AppShell title="지원사업 상세" role={session.profile.role}>
        <PageCard title="공고를 찾을 수 없습니다." />
      </AppShell>
    );
  }

  return (
    <AppShell title="지원사업 상세" role={session.profile.role}>
      <PageCard title={program.title}>
        <p className="text-sm text-slate-600">
          {program.agency} · {program.region ?? "-"} · {program.status}
        </p>
        {session.profile.role === "admin" ? (
          <div className="mt-4">
            <ExtractMetadataButton programId={program.id} />
          </div>
        ) : null}
      </PageCard>
      <PageCard title="AI 메타데이터" className="mt-4">
        <ul className="space-y-2 text-sm">
          {(metadataList ?? []).map((m) => (
            <li key={m.id} className="space-y-1">
              <span>
                {m.status} — {JSON.stringify(m.extracted_fields)}
              </span>
              {(m.status === "reviewing" || m.status === "draft") &&
              session.profile.role === "admin" ? (
                <Link
                  href={`/admin/reviews/programs/${m.id}`}
                  className="block text-slate-900 underline"
                >
                  AI 검수 화면으로 이동
                </Link>
              ) : null}
            </li>
          ))}
          {(metadataList ?? []).length === 0 ? (
            <li className="text-slate-500">추출된 메타데이터가 없습니다.</li>
          ) : null}
        </ul>
      </PageCard>
    </AppShell>
  );
}
