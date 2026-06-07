import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Download, Sparkles } from "lucide-react";
import { PageHeader, SectionCard } from "@/components/ui/PageHeader";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ScoreBadge } from "@/components/ui/ScoreBadge";
import { diagnosisReportApi } from "@/lib/api";
import type { CompanyDiagnosisReport } from "@/lib/company-diagnosis";

export default function CompanyDiagnosisReportPage() {
  const [report, setReport] = useState<CompanyDiagnosisReport | null>(null);

  useEffect(() => {
    void diagnosisReportApi.get().then(setReport);
  }, []);

  const downloadReport = () => {
    if (!report) return;
    const lines = [
      `# ${report.companyName} 기업진단보고서`,
      `작성일: ${report.generatedAt}`,
      `종합 점수: ${report.overallScore}점`,
      "",
      "## 요약",
      report.summary,
      "",
      "## 강점",
      ...report.strengths.map((item) => `- ${item}`),
      "",
      "## 보완 필요",
      ...report.weaknesses.map((item) => `- ${item}`),
      "",
      "## 권고",
      ...report.recommendations.map((item) => `- ${item}`),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `기업진단보고서-${report.companyName.replace(/\s+/g, "-")}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  if (!report) {
    return <p className="text-on-surface-variant">기업진단보고서 로딩 중...</p>;
  }

  return (
    <div>
      <PageHeader
        title="기업진단보고서"
        description="기업정보·AI 매칭 결과를 종합한 진단 리포트입니다."
        action={
          <div className="flex flex-wrap gap-2">
            <Link
              to="/matching-results"
              className="inline-flex items-center gap-2 rounded-lg border border-secondary bg-white px-4 py-2 text-sm font-medium text-secondary hover:bg-secondary/5"
            >
              <Sparkles className="h-4 w-4" />
              AI 매칭 보기
            </Link>
            <button
              type="button"
              onClick={downloadReport}
              className="inline-flex items-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-on-secondary"
            >
              <Download className="h-4 w-4" />
              리포트 다운로드
            </button>
          </div>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <SectionCard title="종합 진단">
          <p className="text-3xl font-bold text-primary">{report.overallScore}점</p>
          <p className="mt-1 text-sm text-on-surface-variant">상태: {report.status}</p>
        </SectionCard>
        <SectionCard title="작성 기준" className="sm:col-span-2">
          <p className="text-sm leading-relaxed text-on-surface-variant">{report.summary}</p>
        </SectionCard>
      </div>

      <SectionCard title="영역별 진단" className="mb-6">
        <div className="grid gap-4 md:grid-cols-2">
          {report.dimensions.map((dimension) => (
            <div key={dimension.label} className="rounded-lg border border-outline-variant/30 p-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="font-medium text-primary">{dimension.label}</p>
                <span className="text-sm font-semibold text-secondary">{dimension.score}점</span>
              </div>
              <ProgressBar value={dimension.score} />
              <p className="mt-2 text-xs text-on-surface-variant">{dimension.note}</p>
            </div>
          ))}
        </div>
      </SectionCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="강점">
          <ul className="list-inside list-disc space-y-1 text-sm text-on-surface-variant">
            {report.strengths.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </SectionCard>
        <SectionCard title="보완 필요">
          <ul className="list-inside list-disc space-y-1 text-sm text-on-surface-variant">
            {report.weaknesses.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </SectionCard>
      </div>

      <SectionCard title="AI 권고 사항" className="mt-6">
        <ul className="space-y-2 text-sm text-on-surface-variant">
          {report.recommendations.map((item) => (
            <li key={item} className="rounded-lg bg-surface-container px-3 py-2">
              {item}
            </li>
          ))}
        </ul>
      </SectionCard>

      <SectionCard title="추천 공고 TOP 3" className="mt-6">
        <ul className="divide-y divide-outline-variant/20">
          {report.topMatches.map((match) => (
            <li key={match.programTitle} className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-primary">{match.programTitle}</p>
                <p className="text-sm text-on-surface-variant">{match.agency}</p>
              </div>
              <ScoreBadge score={match.score} size="sm" />
            </li>
          ))}
        </ul>
      </SectionCard>
    </div>
  );
}
