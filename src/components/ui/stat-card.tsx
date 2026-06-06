import Link from "next/link";

export type StatCardTone = "default" | "warn" | "ok" | "accent";

const toneClasses: Record<StatCardTone, string> = {
  default: "border-slate-200 bg-white",
  warn: "border-amber-200 bg-amber-50",
  ok: "border-emerald-200 bg-emerald-50",
  accent: "border-indigo-200 bg-indigo-50",
};

export const StatCard = ({
  label,
  value,
  hint,
  href,
  tone = "default",
  icon,
}: {
  label: string;
  value: number | string;
  hint?: string;
  href?: string;
  tone?: StatCardTone;
  icon?: React.ReactNode;
}) => {
  const content = (
    <div className={`rounded-xl border p-4 shadow-sm ${toneClasses[tone]}`}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-slate-600">{label}</p>
        {icon ? (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/80 text-lg shadow-sm">
            {icon}
          </span>
        ) : null}
      </div>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );

  return href ? (
    <Link href={href} className="block transition hover:-translate-y-0.5 hover:opacity-95">
      {content}
    </Link>
  ) : (
    content
  );
};
