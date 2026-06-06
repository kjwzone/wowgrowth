import { Bot, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type AiState = "idle" | "generating" | "done";

export const AiAgentPanel = ({
  title = "AI 에이전트",
  message,
  state = "idle",
  onGenerate,
  generateLabel = "AI 초안 생성",
}: {
  title?: string;
  message: string;
  state?: AiState;
  onGenerate?: () => void;
  generateLabel?: string;
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
        <p className="flex items-center gap-2 text-sm font-semibold text-primary">
          <Sparkles className="h-4 w-4 text-secondary" />
          {title}
        </p>
        <p
          className={cn(
            "mt-2 text-sm text-on-surface-variant",
            state === "generating" && "animate-pulse",
          )}
        >
          {message}
        </p>
        {onGenerate ? (
          <button
            type="button"
            onClick={onGenerate}
            disabled={state === "generating"}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-on-secondary transition hover:bg-secondary-container disabled:opacity-60"
          >
            {state === "generating" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                생성 중...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                {generateLabel}
              </>
            )}
          </button>
        ) : null}
      </div>
    </div>
  </div>
);
