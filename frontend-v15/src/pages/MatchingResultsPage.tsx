import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FileText, Trophy } from "lucide-react";
import { PageHeader, SectionCard } from "@/components/ui/PageHeader";
import { ScoreBadge } from "@/components/ui/ScoreBadge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { AiAgentPanel } from "@/components/ui/AiAgentPanel";
import { matchingApi } from "@/lib/api";
import type { MatchingResult } from "@/types";

export default function MatchingResultsPage() {
  const [results, setResults] = useState<MatchingResult[]>([]);
  const top = results[0];

  useEffect(() => {
    void matchingApi.list().then(setResults);
  }, []);

  if (!results.length) {
    return <p className="text-on-surface-variant">매칭 결과 로딩 중...</p>;
  }

  return (
    <div>
      <PageHeader
        title="AI 매칭 결과"
        description="기업 프로필 기반 추천 공고 및 개선 제안"
        action={
          <Link
            to="/business-plan"
            className="inline-flex items-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-on-secondary"
          >
            <FileText className="h-4 w-4" />
            사업계획서 작성
          </Link>
        }
      />

      <SectionCard title="종합 매칭 점수" className="mb-6">
        <div className="flex flex-wrap items-center gap-6">
          <div className="text-center">
            <p className="text-5xl font-bold text-secondary">{top?.score ?? 0}</p>
            <p className="text-sm text-on-surface-variant">최고 적합도</p>
          </div>
          <div className="flex-1 min-w-[200px]">
            <ProgressBar value={top?.score ?? 0} label="1순위 공고 매칭률" />
          </div>
        </div>
      </SectionCard>

      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-primary">
        <Trophy className="h-5 w-5 text-secondary" />
        추천 공고 Top 3
      </h2>

      <div className="space-y-4">
        {results.map((result, index) => (
          <SectionCard key={result.programId}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-secondary">#{index + 1}</span>
                <h3 className="mt-1 text-lg font-semibold text-primary">
                  {result.programTitle}
                </h3>
                <p className="text-sm text-on-surface-variant">{result.agency}</p>
              </div>
              <ScoreBadge score={result.score} size="lg" />
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase text-on-surface-variant">
                  추천 근거
                </p>
                <ul className="space-y-1 text-sm text-on-surface-variant">
                  {result.reasons.map((r) => (
                    <li key={r}>✓ {r}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase text-on-surface-variant">
                  부족한 요건
                </p>
                <ul className="space-y-1 text-sm text-amber-800">
                  {result.gaps.map((g) => (
                    <li key={g}>△ {g}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase text-on-surface-variant">
                  개선 제안
                </p>
                <ul className="space-y-1 text-sm text-on-surface-variant">
                  {result.suggestions.map((s) => (
                    <li key={s}>→ {s}</li>
                  ))}
                </ul>
              </div>
            </div>

            <Link
              to={`/programs/${result.programId}`}
              className="mt-4 inline-block text-sm font-medium text-secondary hover:underline"
            >
              공고 상세 보기 →
            </Link>
          </SectionCard>
        ))}
      </div>

      <div className="mt-6">
        <AiAgentPanel
          title="AI 매칭 요약"
          message="현재 초기창업패키지·청년창업사관학교·기술개발 지원사업 3건에 집중 신청을 권장합니다."
        />
      </div>
    </div>
  );
}
