import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, FileText, Sparkles } from "lucide-react";
import { PageHeader, SectionCard } from "@/components/ui/PageHeader";
import { ScoreBadge } from "@/components/ui/ScoreBadge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { AiAgentPanel } from "@/components/ui/AiAgentPanel";
import { programApi } from "@/lib/api";
import type { SupportProgram } from "@/types";

export default function ProgramDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [program, setProgram] = useState<SupportProgram | null>(null);

  useEffect(() => {
    if (id) void programApi.getById(id).then((p) => setProgram(p ?? null));
  }, [id]);

  if (!program) {
    return <p className="text-on-surface-variant">공고를 불러오는 중...</p>;
  }

  return (
    <div>
      <Link
        to="/programs"
        className="mb-4 inline-flex items-center gap-1 text-sm text-on-surface-variant hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        목록으로
      </Link>

      <PageHeader
        title={program.title}
        description={`${program.agency} · ${program.region} · ${program.supportAmount}`}
        action={
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={program.status} />
            <ScoreBadge score={program.matchScore} />
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <SectionCard title="공고 요약">
            <p className="text-sm leading-relaxed text-on-surface-variant">{program.summary}</p>
          </SectionCard>

          <SectionCard title="지원 대상">
            <ul className="list-inside list-disc space-y-1 text-sm text-on-surface-variant">
              {program.target.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard title="지원 내용">
            <ul className="list-inside list-disc space-y-1 text-sm text-on-surface-variant">
              {program.benefits.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard title="제출 서류">
            <ul className="flex flex-wrap gap-2">
              {program.documents.map((d) => (
                <li
                  key={d}
                  className="rounded-lg bg-surface-container px-3 py-1.5 text-sm text-on-surface-variant"
                >
                  {d}
                </li>
              ))}
            </ul>
          </SectionCard>
        </div>

        <div className="space-y-6">
          <SectionCard title="신청 기간">
            <p className="text-sm font-medium text-primary">{program.period}</p>
            <p className="mt-2 text-sm text-on-surface-variant">
              마감: {program.deadline} (D-{program.daysLeft})
            </p>
          </SectionCard>

          <AiAgentPanel
            title="AI 적합도 분석"
            message={program.aiFitAnalysis}
          />

          <SectionCard title="신청 전략 제안">
            <p className="text-sm text-on-surface-variant">{program.strategyTip}</p>
          </SectionCard>

          <Link
            to="/business-plan"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-secondary py-3 font-medium text-on-secondary hover:bg-secondary-container"
          >
            <FileText className="h-4 w-4" />
            사업계획서 작성
          </Link>
          {program.source === "bizinfo" && program.externalUrl ? (
            <a
              href={program.externalUrl}
              target="_blank"
              rel="noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-secondary py-3 text-sm font-medium text-secondary hover:bg-secondary-fixed/20"
            >
              <Sparkles className="h-4 w-4" />
              기업마당 원문 보기
            </a>
          ) : (
            <Link
              to="/matching-results"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-secondary py-3 text-sm font-medium text-secondary hover:bg-secondary-fixed/20"
            >
              <Sparkles className="h-4 w-4" />
              매칭 결과 보기
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
