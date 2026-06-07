import { useState } from "react";
import {
  Activity,
  BadgeCheck,
  Building2,
  CircleDollarSign,
  Landmark,
  Scale,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  COMMENTARY_SECTIONS,
  type CompanyDiagnosisReport,
  type DiagnosisCommentary,
} from "@/lib/company-diagnosis";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { SectionCard } from "@/components/ui/PageHeader";
import { ScoreBadge } from "@/components/ui/ScoreBadge";

const commentaryIcons: Record<keyof DiagnosisCommentary, typeof Activity> = {
  overview: Building2,
  stability: Scale,
  profitability: TrendingUp,
  funding: CircleDollarSign,
  tax: Landmark,
  summary: BadgeCheck,
};

const gradeTone = (grade: string): string => {
  if (grade.startsWith("A")) return "bg-emerald-50 text-emerald-800 border-emerald-200";
  if (grade.startsWith("B")) return "bg-sky-50 text-sky-800 border-sky-200";
  if (grade.startsWith("C")) return "bg-amber-50 text-amber-900 border-amber-200";
  return "bg-surface-container text-on-surface-variant border-outline-variant/40";
};

export const DiagnosisHarnessReport = ({ report }: { report: CompanyDiagnosisReport }) => {
  const [activeCommentary, setActiveCommentary] =
    useState<keyof DiagnosisCommentary>("overview");

  const ActiveIcon = commentaryIcons[activeCommentary];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-secondary/30 bg-secondary/5 p-5">
          <p className="text-xs font-medium text-on-surface-variant">종합 진단등급</p>
          <div className="mt-2 flex items-end gap-2">
            <span className="text-3xl font-bold text-primary">{report.overallGrade}</span>
            <span className="pb-1 text-lg font-semibold text-secondary">{report.overallScore}점</span>
          </div>
          <p className="mt-1 text-xs text-on-surface-variant">상태: {report.status}</p>
        </div>
        <div className="rounded-xl border border-outline-variant/40 bg-white p-5">
          <p className="text-xs font-medium text-on-surface-variant">주당평가액 (추정)</p>
          <p className="mt-2 text-xl font-bold text-primary">{report.tax.perShareValue}</p>
          <p className="mt-1 text-xs text-on-surface-variant">{report.tax.note}</p>
        </div>
        <div className="rounded-xl border border-outline-variant/40 bg-white p-5">
          <p className="text-xs font-medium text-on-surface-variant">자금조달 여력</p>
          <p className="mt-2 text-xl font-bold text-primary">{report.funding.ebitdaInterest}</p>
          <p className="mt-1 text-xs text-on-surface-variant">
            EBITDA/이자 · 추가대출 {report.funding.additionalCapacity}
          </p>
        </div>
        <div className="rounded-xl border border-outline-variant/40 bg-white p-5">
          <p className="text-xs font-medium text-on-surface-variant">대상 기업</p>
          <p className="mt-2 text-lg font-bold text-primary">{report.companyName}</p>
          <p className="mt-1 text-xs text-on-surface-variant">
            {report.industry} · {report.stage}
          </p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <SectionCard
          title="진단 코멘트"
          description="하네스 commentary 단계 (overview → summary)"
          className="xl:col-span-2"
        >
          <div className="flex flex-wrap gap-2 border-b border-outline-variant/20 pb-4">
            {COMMENTARY_SECTIONS.map(({ key, label }) => {
              const Icon = commentaryIcons[key];
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveCommentary(key)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition",
                    activeCommentary === key
                      ? "bg-primary text-on-primary"
                      : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              );
            })}
          </div>
          <div className="mt-4 flex gap-3">
            <div className="rounded-lg bg-primary-fixed/40 p-2.5 text-secondary">
              <ActiveIcon className="h-5 w-5" />
            </div>
            <p className="text-sm leading-relaxed text-on-surface-variant">
              {report.commentary[activeCommentary]}
            </p>
          </div>
        </SectionCard>

        <div className="space-y-4">
          <SectionCard title="부문 진단등급" description="안정성·수익성·활동성·성장성">
            <ul className="space-y-3">
              {report.sectionGrades.map((item) => (
                <li
                  key={item.section}
                  className="rounded-lg border border-outline-variant/30 p-3"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-primary">{item.section}</span>
                    <span
                      className={cn(
                        "rounded-md border px-2 py-0.5 text-xs font-bold",
                        gradeTone(item.grade),
                      )}
                    >
                      {item.grade}
                    </span>
                  </div>
                  <ProgressBar value={item.score} showValue={false} />
                  <p className="mt-2 text-xs text-on-surface-variant">{item.note}</p>
                </li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard title="외부 데이터">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-2">
                <dt className="text-on-surface-variant">동종평균</dt>
                <dd className="text-right font-medium text-primary">{report.externalData.industryAvg}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-on-surface-variant">신용등급</dt>
                <dd className="text-right font-medium text-primary">{report.externalData.creditRating}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-on-surface-variant">현금흐름등급</dt>
                <dd className="text-right font-medium text-primary">{report.externalData.cashflowGrade}</dd>
              </div>
            </dl>
          </SectionCard>
        </div>
      </div>

      <SectionCard title="주요 재무비율" description="calculate 단계 ratios (3개년)">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-outline-variant/30 text-left text-xs uppercase text-on-surface-variant">
                <th className="py-2 pr-4 font-semibold">지표</th>
                {report.ratioYears.map((year) => (
                  <th key={year} className="px-3 py-2 font-semibold">
                    {year}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {report.keyRatios.map((row) => (
                <tr key={row.label} className="border-b border-outline-variant/15">
                  <td className="py-2.5 pr-4 font-medium text-primary">{row.label}</td>
                  {report.ratioYears.map((year) => (
                    <td key={year} className="px-3 py-2.5 text-on-surface-variant">
                      {row.values[year] == null ? "—" : row.values[year]?.toLocaleString("ko-KR")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <div className="grid gap-4 md:grid-cols-2">
        <SectionCard title="자금조달 스냅샷">
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-on-surface-variant">담보대출한도</dt>
              <dd className="font-semibold text-primary">{report.funding.collateralLimit}</dd>
            </div>
            <div>
              <dt className="text-on-surface-variant">신용대출한도</dt>
              <dd className="font-semibold text-primary">{report.funding.creditLimit}</dd>
            </div>
          </dl>
        </SectionCard>
        <SectionCard title="강점 · 보완">
          <div className="grid gap-4 sm:grid-cols-2">
            <ul className="list-inside list-disc space-y-1 text-sm text-on-surface-variant">
              {report.strengths.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <ul className="list-inside list-disc space-y-1 text-sm text-on-surface-variant">
              {report.weaknesses.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </SectionCard>
      </div>

      <SectionCard title="AI 권고 · 추천 공고">
        <ul className="mb-4 space-y-2">
          {report.recommendations.map((item) => (
            <li
              key={item}
              className="flex items-start gap-2 rounded-lg bg-surface-container px-3 py-2 text-sm text-on-surface-variant"
            >
              <Activity className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
              {item}
            </li>
          ))}
        </ul>
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
};
