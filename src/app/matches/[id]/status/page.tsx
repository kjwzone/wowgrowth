import { AppShell } from "@/components/layout/app-shell";
import { PageCard } from "@/components/ui/page-card";

type Props = { params: Promise<{ id: string }> };

export default async function MatchStatusPage({ params }: Props) {
  const { id } = await params;
  return (
    <AppShell title="추천 생성 상태">
      <PageCard
        title={`작업 대상: ${id}`}
        description="queued → running → succeeded / failed"
      />
    </AppShell>
  );
}
