import { Bot, CheckCircle2, Circle, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { BUSINESS_PLAN_SKILL_LABELS } from "@/lib/business-plan-skill";
import type { BusinessPlanSkillId, PipelineStep } from "@/types";

type AiState = "idle" | "generating" | "done";

export const AiAgentPanel = ({
  title = "AI 에이전트",
  message,
  state = "idle",
  onGenerate,
  generateLabel = "선택 섹션 AI 추가 생성 (심화)",
  skillId,
  pipelineSteps,
  activeAgent,
  onGenerateFull,
  onGenerateFullQuality,
  fullGenerateLabel = "전체 사업계획서 AI 생성",
  fullGenerateQualityLabel = "고품질 생성 (느림)",
}: {
  title?: string;
  message: string;
  state?: AiState;
  onGenerate?: () => void;
  generateLabel?: string;
  skillId?: BusinessPlanSkillId;
  pipelineSteps?: PipelineStep[];
  activeAgent?: string;
  onGenerateFull?: () => void;
  onGenerateFullQuality?: () => void;
  fullGenerateLabel?: string;
  fullGenerateQualityLabel?: string;
}) => (
  <div className="rounded-xl border border-secondary/20 bg-gradient-to-br from-primary-fixed/30 to-secondary-fixed/20 p-5">
    <div className="flex items-start gap-3">
      <div className="rounded-lg bg-secondary p-2 text-on-secondary">
        {state === "generating" ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Bot className="h-5 w-5" />
        )}
      </div>
      <div className="flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="flex items-center gap-2 text-sm font-semibold text-primary">
            <Sparkles className="h-4 w-4 text-secondary" />
            {title}
          </p>
          {skillId ? (
            <span className="rounded-full bg-secondary/15 px-2.5 py-0.5 text-xs font-medium text-secondary">
              Skill: {BUSINESS_PLAN_SKILL_LABELS[skillId]}
            </span>
          ) : null}
          {activeAgent ? (
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs text-primary">
              {activeAgent}
            </span>
          ) : null}
        </div>
        <p
          className={cn(
            "mt-2 text-sm text-on-surface-variant",
            state === "generating" && "animate-pulse",
          )}
        >
          {message}
        </p>

        {pipelineSteps && pipelineSteps.length > 0 ? (
          <ul className="mt-3 space-y-1.5 rounded-lg bg-surface/60 p-3 text-xs">
            {pipelineSteps.map((step) => (
              <li key={step.id} className="flex items-center gap-2 text-on-surface-variant">
                {step.status === "done" ? (
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-secondary" />
                ) : step.status === "running" ? (
                  <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-secondary" />
                ) : (
                  <Circle className="h-3.5 w-3.5 shrink-0 opacity-40" />
                )}
                <span className={cn(step.status === "running" && "font-medium text-primary")}>
                  {step.label}
                </span>
                <span className="text-on-surface-variant/60">({step.agent})</span>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2">
          {onGenerateFull ? (
            <button
              type="button"
              onClick={onGenerateFull}
              disabled={state === "generating"}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-on-primary transition hover:opacity-90 disabled:opacity-60"
            >
              {state === "generating" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  AI 생성 중...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  {fullGenerateLabel}
                </>
              )}
            </button>
          ) : null}
          {onGenerateFullQuality ? (
            <button
              type="button"
              onClick={onGenerateFullQuality}
              disabled={state === "generating"}
              title="공고 분석 + Pro 모델 2단계 (약 2~4분)"
              className="inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-surface px-4 py-2 text-sm font-medium text-primary transition hover:bg-primary/5 disabled:opacity-60"
            >
              {fullGenerateQualityLabel}
            </button>
          ) : null}
          {onGenerate ? (
            <button
              type="button"
              onClick={onGenerate}
              disabled={state === "generating"}
              className="inline-flex items-center gap-2 rounded-lg border border-secondary bg-surface px-4 py-2 text-sm font-medium text-secondary transition hover:bg-secondary/10 disabled:opacity-60"
            >
              {generateLabel}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  </div>
);
