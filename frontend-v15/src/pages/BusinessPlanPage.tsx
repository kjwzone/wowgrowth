import { useEffect, useState } from "react";
import { Download, Send } from "lucide-react";
import { PageHeader, SectionCard } from "@/components/ui/PageHeader";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { AiAgentPanel } from "@/components/ui/AiAgentPanel";
import { BusinessPlanEditor } from "@/components/ui/BusinessPlanEditor";
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
    const content = await businessPlanApi.generateSection(activeId);
    setDraft({
      ...draft,
      sections: draft.sections.map((s) =>
        s.id === activeId ? { ...s, content, completeness: Math.min(100, s.completeness + 25) } : s,
      ),
      overallCompleteness: Math.min(100, draft.overallCompleteness + 8),
    });
    setAiState("done");
    setTimeout(() => setAiState("idle"), 1500);
  };

  const onChange = (id: string, content: string) => {
    if (!draft) return;
    setDraft({
      ...draft,
      sections: draft.sections.map((s) =>
        s.id === id
          ? { ...s, content, completeness: content.length > 50 ? Math.max(s.completeness, 70) : s.completeness }
          : s,
      ),
    });
  };

  if (!draft) {
    return <p className="text-on-surface-variant">사업계획서 로딩 중...</p>;
  }

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

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <SectionCard title="선택 공고">
          <p className="font-medium text-primary">{draft.programTitle}</p>
          <p className="mt-1 text-sm text-on-surface-variant">상태: {draft.status}</p>
        </SectionCard>
        <SectionCard title="완성도 점수">
          <ProgressBar value={draft.overallCompleteness} label="전체 완성도" />
        </SectionCard>
      </div>

      <AiAgentPanel
        message="선택한 섹션에 대해 AI 초안을 생성할 수 있습니다. 생성 후 항목별로 수정하세요."
        state={aiState}
        onGenerate={() => void generateSection()}
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
