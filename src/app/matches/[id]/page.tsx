import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { PageCard } from "@/components/ui/page-card";
import { GeneratePlanButton } from "@/components/business-plans/generate-plan-button";
import { getSessionProfile } from "@/lib/auth/get-session";
import {
  fetchMatchingResultById,
  levelLabel,
} from "@/lib/data/matching-results";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

type Props = { params: Promise<{ id: string }> };

const BulletList = ({
  title,
  items,
  emptyText,
}: {
  title: string;
  items: string[];
  emptyText: string;
}) => (
  <div>
    <h3 className="text-sm font-medium text-slate-800">{title}</h3>
    {items.length > 0 ? (
      <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-slate-700">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    ) : (
      <p className="mt-1 text-sm text-slate-500">{emptyText}</p>
    )}
  </div>
);

export default async function MatchDetailPage({ params }: Props) {
  const session = await getSessionProfile();
  if (!session) redirect("/login");

  const { id } = await params;
  const { data: match, error } = await fetchMatchingResultById(id);

  if (error) {
    return (
      <AppShell title="추천 상세" role={session.profile.role}>
        <PageCard title="조회 오류">
          <p className="text-sm text-red-600">{error}</p>
          <Link href="/matches" className="mt-4 inline-block text-sm underline">
            목록으로
          </Link>
        </PageCard>
      </AppShell>
    );
  }

  if (!match) {
    return (
      <AppShell title="추천 상세" role={session.profile.role}>
        <PageCard title="추천 결과를 찾을 수 없습니다">
          <Link href="/matches" className="text-sm underline">
            목록으로
          </Link>
        </PageCard>
      </AppShell>
    );
  }

  const supabase = await createClient();
  const [{ data: program }, { data: company }] = await Promise.all([
    supabase
      .from("support_programs")
      .select("id, title, agency, region, status")
      .eq("id", match.program_id)
      .maybeSingle(),
    supabase
      .from("companies")
      .select("id, company_name, region, industry, owner_id")
      .eq("id", match.company_id)
      .maybeSingle(),
  ]);

  const isOwner = company?.owner_id === session.userId;
  const isStaff =
    session.profile.role === "admin" || session.profile.role === "reviewer";
  if (!isOwner && !isStaff) {
    redirect("/error/403");
  }

  return (
    <AppShell title="추천 상세" role={session.profile.role}>
      <PageCard title={program?.title ?? "추천 사업"}>
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-slate-500">추천 점수</dt>
            <dd className="text-lg font-semibold">
              {match.score}점 ({levelLabel(match.recommendation_level)})
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">상태</dt>
            <dd>{match.status}</dd>
          </div>
          <div>
            <dt className="text-slate-500">기업</dt>
            <dd>{company?.company_name ?? "-"}</dd>
          </div>
          <div>
            <dt className="text-slate-500">업종 / 지역</dt>
            <dd>
              {company?.industry ?? "-"} / {company?.region ?? "-"}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">주관기관</dt>
            <dd>{program?.agency ?? "-"}</dd>
          </div>
          <div>
            <dt className="text-slate-500">공고 지역</dt>
            <dd>{program?.region ?? "-"}</dd>
          </div>
        </dl>
        {program ? (
          <Link
            href={`/programs/${program.id}`}
            className="mt-4 inline-block text-sm underline"
          >
            공고 상세 보기
          </Link>
        ) : null}
      </PageCard>

      <PageCard title="사업계획서 초안" className="mt-4">
        <GeneratePlanButton
          programId={match.program_id}
          matchingResultId={match.id}
        />
      </PageCard>

      <PageCard title="추천 분석" className="mt-4">
        <div className="space-y-6">
          <BulletList
            title="추천 사유"
            items={match.reasons}
            emptyText="등록된 추천 사유가 없습니다."
          />
          <BulletList
            title="리스크"
            items={match.risks}
            emptyText="특별한 리스크 항목이 없습니다."
          />
          <BulletList
            title="보완 사항"
            items={match.improvement_tasks}
            emptyText="보완이 필요한 항목이 없습니다."
          />
        </div>
      </PageCard>

      <p className="mt-4 text-center">
        <Link href="/matches" className="text-sm text-slate-600 underline">
          추천 목록으로
        </Link>
      </p>
    </AppShell>
  );
}
