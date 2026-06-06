"use client";

import {
  formatElapsedSeconds,
  PLAN_GENERATION_STEPS,
  resolvePlanGenerationStepIndex,
} from "@/lib/business-plans/generation-progress";

type PlanGenerationProgressProps = {
  active: boolean;
  finished?: boolean;
  elapsedMs: number;
};

export const PlanGenerationProgress = ({
  active,
  finished = false,
  elapsedMs,
}: PlanGenerationProgressProps) => {
  if (!active) {
    return null;
  }

  const currentIndex = resolvePlanGenerationStepIndex(elapsedMs, finished);
  const elapsedSec = formatElapsedSeconds(elapsedMs);

  return (
    <div
      className="mt-3 w-full max-w-sm rounded-md border border-slate-200 bg-slate-50 p-3"
      role="status"
      aria-live="polite"
      aria-busy={!finished}
    >
      <div className="mb-2 flex items-center justify-between text-xs text-slate-600">
        <span className="font-medium text-slate-800">작성 진행 중</span>
        <span>{elapsedSec}초 경과 · 보통 1~3분</span>
      </div>
      <ol className="space-y-1.5">
        {PLAN_GENERATION_STEPS.map((label, index) => {
          const done = index < currentIndex || (finished && index <= currentIndex);
          const current = index === currentIndex && !finished;

          return (
            <li
              key={label}
              className={`flex items-center gap-2 text-sm ${
                done
                  ? "text-emerald-700"
                  : current
                    ? "font-medium text-slate-900"
                    : "text-slate-400"
              }`}
            >
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs ${
                  done
                    ? "bg-emerald-500 text-white"
                    : current
                      ? "border-2 border-indigo-500 bg-white"
                      : "border border-slate-300 bg-white"
                }`}
                aria-hidden
              >
                {done ? "✓" : current ? "…" : index + 1}
              </span>
              <span>{label}</span>
              {current ? (
                <span className="ml-auto text-xs text-indigo-600">진행 중</span>
              ) : null}
            </li>
          );
        })}
      </ol>
      {!finished ? (
        <p className="mt-2 text-xs text-slate-500">
          창을 닫지 마세요. AI 작성 단계에서 시간이 더 걸릴 수 있습니다.
        </p>
      ) : null}
    </div>
  );
};
