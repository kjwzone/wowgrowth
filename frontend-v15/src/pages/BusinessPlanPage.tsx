import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AlertCircle, CheckCircle2, Download, Send } from "lucide-react";
import { PageHeader, SectionCard } from "@/components/ui/PageHeader";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { AiAgentPanel } from "@/components/ui/AiAgentPanel";
import { BusinessPlanEditor } from "@/components/ui/BusinessPlanEditor";
import { BUSINESS_PLAN_SKILL_LABELS } from "@/lib/business-plan-skill";
import { businessPlanApi, type SubmissionCheckResult } from "@/lib/api";
import type { BusinessPlanDraft } from "@/types";

export default function BusinessPlanPage() {
  const [searchParams] = useSearchParams();
  const programId = searchParams.get("programId");
  const [draft, setDraft] = useState<BusinessPlanDraft | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState("");
  const [aiState, setAiState] = useState<"idle" | "generating" | "done">("idle");
  const [submitting, setSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<SubmissionCheckResult | null>(
    null,
  );

  useEffect(() => {
    setLoadError(null);
    const load = programId
      ? businessPlanApi.initForProgram(programId)
      : businessPlanApi.get();

    void load
      .then((d) => {
        setDraft(d);
        setActiveId(d.sections[0]?.id ?? "");
      })
      .catch((error: unknown) => {
        setDraft(null);
        setLoadError(
          error instanceof Error ? error.message : "사업계획서를 불러오지 못했습니다.",
        );
      });
  }, [programId]);

  const generateSection = async () => {
    if (!draft || !activeId) return;
    setAiState("generating");
    const updated = await businessPlanApi.generateSection(activeId, setDraft);
    setDraft(updated);
    setAiState("done");
    setTimeout(() => setAiState("idle"), 1500);
  };

  const generateFullDraft = async () => {
    if (!draft) return;
    setAiState("generating");
    setSubmissionResult(null);
    const updated = await businessPlanApi.generateFullDraft(setDraft);
    setDraft(updated);
    setAiState("done");
    setTimeout(() => setAiState("idle"), 1500);
  };

  const prepareSubmission = async () => {
    if (!draft || submitting) return;
    setSubmitting(true);
    setSubmissionResult(null);
    const { draft: updated, result } = await businessPlanApi.prepareForSubmission();
    setDraft(updated);
    setSubmissionResult(result);
    setSubmitting(false);
  };

  const onChange = (id: string, content: string) => {
    if (!draft) return;
    setDraft({
      ...draft,
      sections: draft.sections.map((s) =>
        s.id === id
          ? {
              ...s,
              content,
              completeness:
                content.length > 50 ? Math.max(s.completeness, 70) : s.completeness,
            }
          : s,
      ),
    });
  };

  if (loadError) {
    return (
      <p className="rounded-lg bg-error/10 px-4 py-3 text-sm text-error">{loadError}</p>
    );
  }

  if (!draft) {
    return <p className="text-on-surface-variant">사업계획서 로딩 중...</p>;
  }

  const activeSection = draft.sections.find((s) => s.id === activeId);

  return (
    <div>
      <PageHeader
        title="사업계획서 자동작성"
        description={draft.programTitle}
        action={
          <div className="flex gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg border border-outline-variant px-4 py-2 text-sm hover:bg-surface-container"
            >
              <Download className="h-4 w-4" />
              다운로드
            </button>
            <button
              type="button"
              onClick={() => void prepareSubmission()}
              disabled={submitting || draft.status === "ready"}
              title={
                draft.status === "ready"
                  ? "이미 제출 준비가 완료되었습니다"
                  : "submission-verifier 스킬로 제출 전 검증을 실행합니다"
              }
              className="inline-flex items-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-on-secondary disabled:opacity-60"
            >
              <Send className="h-4 w-4" />
              {submitting ? "검증 중..." : draft.status === "ready" ? "제출 준비 완료" : "제출 준비"}
            </button>
          </div>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <SectionCard title="선택 공고">
          <p className="font-medium text-primary">{draft.programTitle}</p>
          <p className="mt-1 text-sm text-on-surface-variant">상태: {draft.status}</p>
        </SectionCard>
        <SectionCard title="적용 스킬">
          <p className="font-medium text-secondary">
            {BUSINESS_PLAN_SKILL_LABELS[draft.skillId]}
          </p>
          <p className="mt-1 text-xs text-on-surface-variant">
            프롬프트 {draft.promptVersion} · startup-package-plan-instructions
          </p>
        </SectionCard>
        <SectionCard title="완성도 점수">
          <ProgressBar value={draft.overallCompleteness} label="전체 완성도" />
        </SectionCard>
      </div>

      {submissionResult ? (
        <div
          className={`mb-6 rounded-xl border p-4 ${
            submissionResult.ok
              ? "border-secondary/30 bg-secondary/5"
              : "border-error/30 bg-error/5"
          }`}
        >
          <p className="flex items-center gap-2 text-sm font-semibold text-primary">
            {submissionResult.ok ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-secondary" />
                제출 준비 완료 — 관리자 검수 대기열에 등록되었습니다
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4 text-error" />
                제출 준비 불가 — 아래 항목을 보완하세요
              </>
            )}
          </p>
          <ul className="mt-3 space-y-1.5 text-sm text-on-surface-variant">
            {submissionResult.checklist.map((item) => (
              <li key={item.item} className="flex items-start gap-2">
                {item.pass ? (
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-secondary" />
                ) : (
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-error" />
                )}
                <span>
                  {item.item}
                  {item.note ? ` — ${item.note}` : ""}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <AiAgentPanel
        message={
          aiState === "generating"
            ? "Cursor Agent Skill 파이프라인 실행 중… (공고 분석 → 작성 → 예산 → 검증)"
            : activeSection?.content
              ? `「${activeSection.title}」 섹션을 선택했습니다. 비어 있는 항목은 plan-writer로 생성하세요.`
              : "business-plan-writer 스킬 양식(7개 항목) 기준으로 초안을 생성합니다."
        }
        state={aiState}
        skillId={draft.skillId}
        pipelineSteps={draft.pipelineSteps}
        activeAgent={draft.activeAgent}
        onGenerateFull={() => void generateFullDraft()}
        onGenerate={() => void generateSection()}
        generateLabel="선택 섹션 AI 생성"
        fullGenerateLabel="스킬 파이프라인 전체 생성"
      />

      <SectionCard title="항목별 에디터" className="mt-6">
        <BusinessPlanEditor
          sections={draft.sections}
          activeId={activeId}
          onSelect={setActiveId}
          onChange={onChange}
        />
      </SectionCard>
    </div>
  );
}
