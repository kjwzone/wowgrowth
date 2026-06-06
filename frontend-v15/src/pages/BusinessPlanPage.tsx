import { useEffect, useState } from "react";
import { Download, Send } from "lucide-react";
import { PageHeader, SectionCard } from "@/components/ui/PageHeader";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { AiAgentPanel } from "@/components/ui/AiAgentPanel";
import { BusinessPlanEditor } from "@/components/ui/BusinessPlanEditor";
import { BUSINESS_PLAN_SKILL_LABELS } from "@/lib/business-plan-skill";
import { businessPlanApi } from "@/lib/api";
import type { BusinessPlanDraft } from "@/types";

export default function BusinessPlanPage() {
  const [draft, setDraft] = useState<BusinessPlanDraft | null>(null);
  const [activeId, setActiveId] = useState("");
  const [aiState, setAiState] = useState<"idle" | "generating" | "done">("idle");

  useEffect(() => {
    void businessPlanApi.get().then((d) => {
      setDraft(d);
      setActiveId(d.sections[0]?.id ?? "");
    });
  }, []);

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
    const updated = await businessPlanApi.generateFullDraft(setDraft);
    setDraft(updated);
    setAiState("done");
    setTimeout(() => setAiState("idle"), 1500);
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
              className="inline-flex items-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-on-secondary"
            >
              <Send className="h-4 w-4" />
              제출 준비
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
