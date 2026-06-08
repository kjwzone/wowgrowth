import { AlertCircle, ArrowRight, CheckCircle2 } from "lucide-react";
import type { BusinessPlanDraft } from "@/types";
import type { SubmissionCheckResult } from "@/lib/business-plan-submission";
import {
  getPrimaryRemediation,
  resolveRemediationForItem,
  type RemediationAction,
} from "@/lib/business-plan-submission-remediation";

export const SubmissionResultPanel = ({
  draft,
  result,
  onRemediate,
  onRetry,
}: {
  draft: BusinessPlanDraft;
  result: SubmissionCheckResult;
  onRemediate: (action: RemediationAction) => void;
  onRetry: () => void;
}) => {
  const primaryStep = getPrimaryRemediation(draft, result.checklist);

  return (
    <div
      className={`mb-6 rounded-xl border p-5 ${
        result.ok
          ? "border-secondary/30 bg-secondary/5"
          : "border-error/30 bg-error/5"
      }`}
    >
      <p className="flex items-center gap-2 text-sm font-semibold text-primary">
        {result.ok ? (
          <>
            <CheckCircle2 className="h-4 w-4 text-secondary" />
            제출 준비 완료 — 사업계획서를 다운로드하거나 제출하세요
          </>
        ) : (
          <>
            <AlertCircle className="h-4 w-4 text-error" />
            제출 준비 불가 — 아래 항목을 보완한 뒤 다시 검증하세요
          </>
        )}
      </p>

      <ul className="mt-4 space-y-3">
        {result.checklist.map((item) => {
          const step = resolveRemediationForItem(draft, item);
          return (
            <li
              key={item.item}
              className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-outline-variant/25 bg-white/80 px-4 py-3"
            >
              <div className="flex min-w-0 flex-1 items-start gap-2">
                {item.pass ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
                ) : (
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-error" />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-primary">{item.item}</p>
                  {item.note ? (
                    <p className="mt-0.5 text-sm text-on-surface-variant">{item.note}</p>
                  ) : null}
                  {!item.pass && step?.description ? (
                    <p className="mt-1 text-xs text-on-surface-variant">{step.description}</p>
                  ) : null}
                </div>
              </div>
              {!item.pass && step ? (
                <button
                  type="button"
                  onClick={() => onRemediate(step.action)}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-secondary px-3 py-2 text-sm font-medium text-on-secondary hover:opacity-90"
                >
                  {step.label}
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </li>
          );
        })}
      </ul>

      {!result.ok ? (
        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-error/15 pt-4">
          {primaryStep ? (
            <button
              type="button"
              onClick={() => onRemediate(primaryStep.action)}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-on-primary hover:opacity-90"
            >
              {primaryStep.description ?? "첫 번째 보완 항목으로 이동"}
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : null}
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-2 rounded-lg border border-outline-variant px-4 py-2.5 text-sm font-medium text-primary hover:bg-surface-container"
          >
            제출 검증 다시 실행
          </button>
        </div>
      ) : null}
    </div>
  );
};
