import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ChevronDown, Download, LayoutList, Loader2, Pencil, Send } from "lucide-react";
import { PageHeader, SectionCard } from "@/components/ui/PageHeader";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { AiAgentPanel, type AiGeneratingTask } from "@/components/ui/AiAgentPanel";
import { BusinessPlanEditor } from "@/components/ui/BusinessPlanEditor";
import { BusinessPlanPreview } from "@/components/ui/BusinessPlanPreview";
import { SubmissionResultPanel } from "@/components/ui/SubmissionResultPanel";
import { BUSINESS_PLAN_SKILL_LABELS } from "@/lib/business-plan-skill";
import { mergeDraftToDocument } from "@/lib/business-plan-document";
import {
  downloadBusinessPlanDocx,
  downloadBusinessPlanHtml,
  downloadBusinessPlanPdf,
} from "@/lib/business-plan-html-export";
import { companyProfile } from "@/data/company";
import { selectReferenceImages } from "@/lib/business-plan-reference-images";
import type { RemediationAction } from "@/lib/business-plan-submission-remediation";
import { businessPlanApi, type SubmissionCheckResult } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { BusinessPlanDraft } from "@/types";

type EditorViewMode = "sections" | "preview";

export default function BusinessPlanPage() {
  const [searchParams] = useSearchParams();
  const programId = searchParams.get("programId");
  const [draft, setDraft] = useState<BusinessPlanDraft | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState("");
  const [aiState, setAiState] = useState<"idle" | "generating" | "done">("idle");
  const [aiGeneratingTask, setAiGeneratingTask] = useState<AiGeneratingTask | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<SubmissionCheckResult | null>(
    null,
  );
  const [viewMode, setViewMode] = useState<EditorViewMode>("sections");
  const editorRef = useRef<HTMLDivElement>(null);
  const [downloadMenuOpen, setDownloadMenuOpen] = useState(false);
  const [downloadingFormat, setDownloadingFormat] = useState<
    "html" | "docx" | "pdf" | null
  >(null);
  const downloadMenuRef = useRef<HTMLDivElement>(null);

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
    setAiGeneratingTask("section");
    setAiState("generating");
    const updated = await businessPlanApi.generateSection(activeId, setDraft);
    setDraft(updated);
    setAiGeneratingTask(null);
    setAiState("done");
    setTimeout(() => setAiState("idle"), 1500);
  };

  const generateFullDraft = async (mode: "fast" | "pipeline" = "fast") => {
    if (!draft) return;
    setAiGeneratingTask(mode === "pipeline" ? "full-quality" : "full-fast");
    setAiState("generating");
    setSubmissionResult(null);
    const updated = await businessPlanApi.generateFullDraft(setDraft, { mode });
    setDraft(updated);
    setAiGeneratingTask(null);
    setAiState("done");
    setTimeout(() => setAiState("idle"), 1500);
  };

  const prepareSubmission = async () => {
    if (!draft || submitting) return;
    setSubmitting(true);
    setSubmissionResult(null);
    try {
      const { draft: updated, result } = await businessPlanApi.prepareForSubmission();
      setDraft(updated);
      setSubmissionResult(result);
    } catch (error: unknown) {
      setSubmissionResult({
        ok: false,
        errors: [
          error instanceof Error ? error.message : "제출 검증 중 오류가 발생했습니다.",
        ],
        checklist: [
          {
            item: "제출 검증",
            pass: false,
            note: "잠시 후 다시 시도하거나 섹션 내용을 보완하세요.",
          },
        ],
      });
    } finally {
      setSubmitting(false);
    }
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

  const mergedDocument = useMemo(
    () => (draft ? mergeDraftToDocument(draft) : null),
    [draft],
  );

  useEffect(() => {
    if (!downloadMenuOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (
        downloadMenuRef.current &&
        !downloadMenuRef.current.contains(event.target as Node)
      ) {
        setDownloadMenuOpen(false);
      }
    };
    window.document.addEventListener("mousedown", handleClickOutside);
    return () =>
      window.document.removeEventListener("mousedown", handleClickOutside);
  }, [downloadMenuOpen]);

  const handleDownload = async (format: "html" | "docx" | "pdf") => {
    if (!mergedDocument || downloadingFormat) return;
    setDownloadMenuOpen(false);
    const references = selectReferenceImages(
      mergedDocument.programTitle,
      companyProfile.name,
      companyProfile.product,
    );
    try {
      setDownloadingFormat(format);
      if (format === "html") {
        downloadBusinessPlanHtml(mergedDocument, references);
      } else if (format === "docx") {
        await downloadBusinessPlanDocx(mergedDocument, references);
      } else {
        await downloadBusinessPlanPdf(mergedDocument, references);
      }
    } catch (error) {
      console.error("사업계획서 다운로드 실패", error);
    } finally {
      setDownloadingFormat(null);
    }
  };

  const jumpToSectionEdit = (sectionId: string) => {
    setActiveId(sectionId);
    setViewMode("sections");
    requestAnimationFrame(() => {
      editorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const handleRemediation = async (action: RemediationAction) => {
    if (!draft) return;

    if (action.type === "jump-section") {
      jumpToSectionEdit(action.sectionId);
      return;
    }

    if (action.type === "generate-section") {
      setActiveId(action.sectionId);
      setViewMode("sections");
      await generateSection();
      return;
    }

    await generateFullDraft(action.mode);
    requestAnimationFrame(() => {
      editorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
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
  const submissionPassed = submissionResult?.ok === true;
  const submissionFailed = submissionResult?.ok === false;
  const isSubmissionReady = draft.status === "ready" && submissionPassed;

  return (
    <div>
      <PageHeader
        title="사업계획서 자동작성"
        description={draft.programTitle}
        action={
          <div className="flex gap-2">
            <div className="relative" ref={downloadMenuRef}>
              <button
                type="button"
                onClick={() => setDownloadMenuOpen((open) => !open)}
                disabled={!mergedDocument || downloadingFormat !== null}
                aria-haspopup="menu"
                aria-expanded={downloadMenuOpen}
                className="inline-flex items-center gap-2 rounded-lg border border-outline-variant px-4 py-2 text-sm hover:bg-surface-container disabled:opacity-60"
              >
                {downloadingFormat ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                {downloadingFormat
                  ? `${downloadingFormat.toUpperCase()} 생성 중...`
                  : "다운로드"}
                <ChevronDown className="h-4 w-4" />
              </button>
              {downloadMenuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 z-20 mt-2 w-44 overflow-hidden rounded-lg border border-outline-variant bg-surface shadow-lg"
                >
                  {(
                    [
                      { format: "html", label: "HTML 다운로드", hint: "웹 문서" },
                      { format: "docx", label: "DOCX 다운로드", hint: "MS Word" },
                      { format: "pdf", label: "PDF 다운로드", hint: "인쇄용" },
                    ] as const
                  ).map((item) => (
                    <button
                      key={item.format}
                      type="button"
                      role="menuitem"
                      onClick={() => void handleDownload(item.format)}
                      className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-surface-container"
                    >
                      <span>{item.label}</span>
                      <span className="text-xs text-on-surface-variant">
                        {item.hint}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => void prepareSubmission()}
              disabled={submitting || isSubmissionReady}
              title={
                isSubmissionReady
                  ? "이미 제출 준비가 완료되었습니다"
                  : submissionFailed
                    ? "보완 후 제출 검증을 다시 실행합니다"
                    : "submission-verifier 스킬로 제출 전 검증을 실행합니다"
              }
              className={cn(
                "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition",
                isSubmissionReady
                  ? "bg-emerald-600 text-white disabled:opacity-100"
                  : "bg-secondary text-on-secondary hover:opacity-90 disabled:opacity-60",
              )}
            >
              <Send className="h-4 w-4" />
              {submitting
                ? "검증 중..."
                : isSubmissionReady
                  ? "제출 준비 완료"
                  : submissionFailed
                    ? "다시 검증"
                    : "제출 준비"}
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
            {draft.aiModel ? ` · ${draft.aiModel}` : " · mock 템플릿"}
          </p>
        </SectionCard>
        <SectionCard title="완성도 점수">
          <ProgressBar value={draft.overallCompleteness} label="전체 완성도" />
        </SectionCard>
      </div>

      {submissionResult ? (
        <SubmissionResultPanel
          draft={draft}
          result={submissionResult}
          onRemediate={(action) => void handleRemediation(action)}
          onRetry={() => void prepareSubmission()}
        />
      ) : null}

      <AiAgentPanel
        message={
          aiState === "generating"
            ? "Gemini Flash로 초안 생성 중… (보통 30초~2분)"
            : activeSection
              ? activeSection.content.trim().length < 50
                ? `「${activeSection.title}」이 비어 있습니다. 아래 「선택 섹션 AI 추가 생성 (심화)」을 누르면 plan-writer가 해당 섹션 초안을 작성합니다.`
                : `「${activeSection.title}」을 선택했습니다. 내용 보강·심화는 「선택 섹션 AI 추가 생성 (심화)」 · 전체 재작성은 「전체 사업계획서 AI 생성」을 사용하세요.`
              : "business-plan-writer 스킬 양식(7개 항목) 기준으로 초안을 생성합니다."
        }
        state={aiState}
        generatingTask={aiGeneratingTask}
        skillId={draft.skillId}
        pipelineSteps={draft.pipelineSteps}
        activeAgent={draft.activeAgent}
        onGenerateFull={() => void generateFullDraft("fast")}
        onGenerateFullQuality={() => void generateFullDraft("pipeline")}
        onGenerate={() => void generateSection()}
        generateLabel="선택 섹션 AI 추가 생성 (심화)"
        fullGenerateLabel="전체 AI 생성 (빠름)"
        fullGenerateQualityLabel="고품질 생성"
      />

      <div ref={editorRef}>
      <SectionCard
        title={viewMode === "sections" ? "항목별 에디터" : "통합 미리보기"}
        description={
          viewMode === "sections"
            ? "섹션별로 편집하고 AI 생성을 실행합니다."
            : "표·차트·인포그래픽으로 통합 HTML 문서를 미리봅니다."
        }
        className="mt-6"
      >
        <div className="mb-4 inline-flex rounded-lg border border-outline-variant/50 bg-surface-container p-1">
          <button
            type="button"
            onClick={() => setViewMode("sections")}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition ${
              viewMode === "sections"
                ? "bg-white text-primary shadow-sm"
                : "text-on-surface-variant hover:text-primary"
            }`}
          >
            <Pencil className="h-4 w-4" />
            섹션 편집
          </button>
          <button
            type="button"
            onClick={() => setViewMode("preview")}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition ${
              viewMode === "preview"
                ? "bg-white text-primary shadow-sm"
                : "text-on-surface-variant hover:text-primary"
            }`}
          >
            <LayoutList className="h-4 w-4" />
            통합 보기
          </button>
        </div>

        {viewMode === "sections" ? (
          <BusinessPlanEditor
            sections={draft.sections}
            activeId={activeId}
            onSelect={setActiveId}
            onChange={onChange}
          />
        ) : mergedDocument ? (
          <BusinessPlanPreview
            document={mergedDocument}
            onJumpToSection={jumpToSectionEdit}
          />
        ) : null}
      </SectionCard>
      </div>
    </div>
  );
}
