import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { PageCard } from "@/components/ui/page-card";
import { ReviewActions } from "@/components/admin/review-actions";
import { getSessionProfile } from "@/lib/auth/get-session";
import {
  fetchProgramById,
  fetchProgramMetadataById,
} from "@/lib/data/program-metadata";
import { redirect } from "next/navigation";

type Props = { params: Promise<{ id: string }> };

export default async function AdminReviewProgramDetailPage({ params }: Props) {
  const session = await getSessionProfile();
  if (
    !session ||
    (session.profile.role !== "admin" && session.profile.role !== "reviewer")
  ) {
    redirect("/error/403");
  }

  const { id } = await params;
  const { data: meta, error: metaError } = await fetchProgramMetadataById(id);

  if (metaError) {
    return (
      <AppShell title="AI 검수 상세" role={session.profile.role}>
        <PageCard title="데이터 조회 오류">
          <p className="text-sm text-red-600">{metaError}</p>
          <Link
            href="/admin/reviews/programs"
            className="mt-4 inline-block text-sm underline"
          >
            목록으로
          </Link>
        </PageCard>
      </AppShell>
    );
  }

  if (!meta) {
    return (
      <AppShell title="AI 검수 상세" role={session.profile.role}>
        <PageCard title="메타데이터를 찾을 수 없습니다">
          <p className="text-sm text-slate-600">ID: {id}</p>
          <Link
            href="/admin/reviews/programs"
            className="mt-4 inline-block text-sm underline"
          >
            검수 목록으로
          </Link>
        </PageCard>
      </AppShell>
    );
  }

  const { data: program } = await fetchProgramById(meta.program_id);
  const fields = meta.extracted_fields as { title?: string; agency?: string };
  const title =
    fields.title ??
    (typeof meta.metadata_json?.title === "string"
      ? meta.metadata_json.title
      : null) ??
    program?.title ??
    "공고 메타데이터 검수";

  return (
    <AppShell title="AI 검수 상세" role={session.profile.role}>
      <PageCard title={title}>
        <p className="text-sm text-slate-500">
          상태: <strong>{meta.status}</strong> · 모델: {meta.model} ·{" "}
          {new Date(meta.created_at).toLocaleString("ko-KR")}
        </p>
        <p className="mt-1 text-xs text-slate-400">메타 ID: {meta.id}</p>
        {program ? (
          <Link
            href={`/programs/${program.id}`}
            className="mt-3 inline-block text-sm underline"
          >
            공고 상세 보기 ({program.agency})
          </Link>
        ) : null}
      </PageCard>

      <PageCard title="핵심 필드" className="mt-4">
        <dl className="grid gap-2 text-sm">
          {(
            [
              ["agency", "주관기관"],
              ["target", "지원대상"],
              ["region", "지역"],
              ["application_period", "신청기간"],
            ] as const
          ).map(([key, label]) => {
            const val =
              fields[key as keyof typeof fields] ??
              meta.metadata_json[key];
            if (!val) return null;
            return (
              <div key={key}>
                <dt className="text-slate-500">{label}</dt>
                <dd>{String(val)}</dd>
              </div>
            );
          })}
        </dl>
      </PageCard>

      <PageCard title="추출된 메타데이터 (JSON)" className="mt-4">
        <pre className="max-h-96 overflow-auto rounded-md bg-slate-50 p-4 text-xs text-slate-800">
          {JSON.stringify(meta.metadata_json, null, 2)}
        </pre>
      </PageCard>

      {meta.status === "reviewing" || meta.status === "draft" ? (
        <PageCard title="검수 처리" className="mt-4">
          <ReviewActions metadataId={meta.id} />
        </PageCard>
      ) : (
        <PageCard title="검수 완료" className="mt-4">
          <p className="text-sm text-slate-600">
            이미 <strong>{meta.status}</strong> 상태입니다.{" "}
            <Link href="/admin/reviews/programs" className="underline">
              목록으로
            </Link>
          </p>
        </PageCard>
      )}
    </AppShell>
  );
}
