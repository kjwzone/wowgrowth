import Link from "next/link";
import type { OnboardingStep } from "@/lib/data/user-dashboard";

export const OnboardingProgress = ({
  steps,
  completionPercent,
}: {
  steps: OnboardingStep[];
  completionPercent: number;
}) => (
  <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h3 className="text-base font-semibold text-slate-900">진행 현황</h3>
        <p className="mt-0.5 text-sm text-slate-500">
          기업정보 등록부터 사업계획서까지 단계별로 진행하세요
        </p>
      </div>
      <div className="text-right">
        <p className="text-2xl font-semibold text-indigo-600">{completionPercent}%</p>
        <p className="text-xs text-slate-500">완료</p>
      </div>
    </div>

    <div
      className="mb-5 h-2 overflow-hidden rounded-full bg-slate-100"
      role="progressbar"
      aria-valuenow={completionPercent}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all"
        style={{ width: `${completionPercent}%` }}
      />
    </div>

    <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {steps.map((step, index) => (
        <li key={step.id}>
          <Link
            href={step.href}
            className={`group flex h-full flex-col rounded-lg border p-3 transition hover:-translate-y-0.5 hover:shadow-md ${
              step.done
                ? "border-emerald-200 bg-emerald-50"
                : "border-slate-200 bg-slate-50 hover:border-indigo-200 hover:bg-indigo-50/40"
            }`}
          >
            <div className="mb-2 flex items-center gap-2">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                  step.done
                    ? "bg-emerald-500 text-white"
                    : "bg-white text-slate-500 ring-1 ring-slate-200"
                }`}
              >
                {step.done ? "✓" : index + 1}
              </span>
              <span className="text-sm font-medium text-slate-900">{step.label}</span>
            </div>
            <p className="text-xs text-slate-500">{step.description}</p>
          </Link>
        </li>
      ))}
    </ol>
  </div>
);
