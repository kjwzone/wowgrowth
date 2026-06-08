import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FileText, Radio, Trophy } from "lucide-react";
import { PageHeader, SectionCard } from "@/components/ui/PageHeader";
import { ScoreBadge } from "@/components/ui/ScoreBadge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { AiAgentPanel } from "@/components/ui/AiAgentPanel";
import { matchingApi, type MatchingListResult } from "@/lib/api";
import type { MatchingResult } from "@/types";

export default function MatchingResultsPage() {
  const [results, setResults] = useState<MatchingResult[]>([]);
  const [meta, setMeta] = useState<
    Pick<MatchingListResult, "source" | "message" | "summary" | "programsScanned">
  >({
    source: "mock",
    summary: "",
    programsScanned: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void matchingApi
      .list()
      .then((payload) => {
        setResults(payload.items);
        setMeta({
          source: payload.source,
          message: payload.message,
          summary: payload.summary,
          programsScanned: payload.programsScanned,
        });
      })
      .finally(() => setLoading(false));
  }, []);

  const top = results[0];

  if (loading) {
    return <p className="text-on-surface-variant">매칭 결과 로딩 중...</p>;
  }

  return (
    <div>
      <PageHeader
        title="AI 매칭 결과"
        description="기업 프로필 × 실시간 공고(기업마당) 기반 추천 및 개선 제안"
        action={
          <Link
            to={top ? `/business-plan?programId=${encodeURIComponent(top.programId)}` : "/business-plan"}
            className="inline-flex items-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-on-secondary"
          >
            <FileText className="h-4 w-4" />
            사업계획서 작성
          </Link>
        }
      />

      {meta.source === "bizinfo" ? (
        <p className="mb-4 inline-flex flex-wrap items-center gap-2 rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-900">
          <Radio className="h-4 w-4 shrink-0" />
          기업마당 실시간 공고 {meta.programsScanned}건 분석 · 모집 중 공고 Top 3 매칭
        </p>
      ) : meta.message ? (
        <p className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">{meta.message}</p>
      ) : null}

      {results.length === 0 ? (
        <SectionCard title="매칭 결과 없음">
          <p className="text-sm text-on-surface-variant">
            모집 중인 공고가 없습니다.{" "}
            <Link to="/programs" className="font-medium text-secondary hover:underline">
              정부지원사업
            </Link>
            에서 최신 공고를 확인하세요.
          </p>
        </SectionCard>
      ) : (
        <>
          <SectionCard title="종합 매칭 점수" className="mb-6">
            <div className="flex flex-wrap items-center gap-6">
              <div className="text-center">
                <p className="text-5xl font-bold text-secondary">{top?.score ?? 0}</p>
                <p className="text-sm text-on-surface-variant">최고 적합도</p>
              </div>
              <div className="min-w-[200px] flex-1">
                <ProgressBar value={top?.score ?? 0} label="1순위 공고 매칭률" />
              </div>
            </div>
          </SectionCard>

          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-primary">
            <Trophy className="h-5 w-5 text-secondary" />
            추천 공고 Top {results.length}
          </h2>

          <div className="space-y-4">
            {results.map((result, index) => (
              <SectionCard key={result.programId}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-secondary">#{index + 1}</span>
                      {result.source === "bizinfo" ? (
                        <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-800">
                          LIVE
                        </span>
                      ) : null}
                      {result.programStatus ? (
                        <span className="text-[10px] text-on-surface-variant">
                          {result.programStatus}
                          {result.deadline ? ` · 마감 ${result.deadline}` : ""}
                        </span>
                      ) : null}
                    </div>
                    <h3 className="mt-1 text-lg font-semibold text-primary">{result.programTitle}</h3>
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
                      {result.gaps.length > 0 ? (
                        result.gaps.map((g) => (
                          <li key={g}>△ {g}</li>
                        ))
                      ) : (
                        <li className="text-on-surface-variant">특이 갭 없음</li>
                      )}
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
            <AiAgentPanel title="AI 매칭 요약" message={meta.summary} />
          </div>
        </>
      )}
    </div>
  );
}
