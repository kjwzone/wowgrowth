import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Download, FileSpreadsheet, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { DiagnosisHarnessReport } from "@/components/diagnosis/DiagnosisHarnessReport";
import { companyApi, diagnosisReportApi } from "@/lib/api";
import type { CompanyDiagnosisReport } from "@/lib/company-diagnosis";
import { COMMENTARY_SECTIONS } from "@/lib/company-diagnosis";
import { downloadDiagnosisHarnessXlsx } from "@/lib/diagnosis-harness-xlsx";
import type { CompanyProfile } from "@/types";

const formatDiagnosisBasisNote = (generatedAt: string): string => {
  const [year, month, day] = generatedAt.split("-");
  if (!year || !month || !day) {
    return "※ 최근 3개년도 재무제표 데이터를 기반으로 분석합니다.";
  }
  return `※ ${year}년 ${month}월 ${day}일 기준 · 최근 3개년도 재무제표 데이터를 기반으로 분석합니다.`;
};

export default function CompanyDiagnosisReportPage() {
  const [report, setReport] = useState<CompanyDiagnosisReport | null>(null);
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [xlsxLoading, setXlsxLoading] = useState(false);
  const [xlsxError, setXlsxError] = useState<string | null>(null);

  useEffect(() => {
    void Promise.all([diagnosisReportApi.get(), companyApi.get()]).then(([nextReport, nextCompany]) => {
      setReport(nextReport);
      setCompany(nextCompany);
    });
  }, []);

  const downloadReport = () => {
    if (!report) return;
    const commentaryBlock = COMMENTARY_SECTIONS.map(
      ({ key, label }) => `### ${label}\n${report.commentary[key]}`,
    ).join("\n\n");

    const lines = [
      `# ${report.companyName} 기업경영진단 보고서`,
      `작성일: ${report.generatedAt}`,
      `종합: ${report.overallGrade} (${report.overallScore}점)`,
      `주당평가액: ${report.tax.perShareValue}`,
      "",
      "## 진단 코멘트",
      commentaryBlock,
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

  const downloadXlsx = async () => {
    if (!report || !company) return;
    setXlsxLoading(true);
    setXlsxError(null);
    try {
      await downloadDiagnosisHarnessXlsx(report, company);
    } catch (error: unknown) {
      setXlsxError(
        error instanceof Error
          ? error.message
          : "xlsx 파일 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
      );
    } finally {
      setXlsxLoading(false);
    }
  };

  if (!report || !company) {
    return <p className="text-on-surface-variant">기업진단보고서 로딩 중...</p>;
  }

  return (
    <div>
      <PageHeader
        title="기업진단보고서"
        description={formatDiagnosisBasisNote(report.generatedAt)}
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
              className="inline-flex items-center gap-2 rounded-lg border border-outline-variant/60 bg-white px-4 py-2 text-sm font-medium text-primary hover:bg-surface-container"
            >
              <Download className="h-4 w-4" />
              텍스트 다운로드
            </button>
            <button
              type="button"
              title="IU.Partners 5시트 양식 xlsx 다운로드"
              disabled={xlsxLoading}
              className="inline-flex items-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-on-secondary hover:opacity-90 disabled:opacity-60"
              onClick={() => void downloadXlsx()}
            >
              <FileSpreadsheet className="h-4 w-4" />
              {xlsxLoading ? "xlsx 생성 중..." : "xlsx 생성 (하네스)"}
            </button>
          </div>
        }
      />

      {xlsxError ? (
        <p className="mb-4 rounded-lg border border-error/30 bg-error/5 px-4 py-3 text-sm text-error">
          {xlsxError}
        </p>
      ) : null}

      <DiagnosisHarnessReport report={report} />
    </div>
  );
}
