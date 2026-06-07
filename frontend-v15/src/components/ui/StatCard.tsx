import type { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export type StatCardTone = "default" | "warn" | "ok" | "accent";

const toneClasses: Record<StatCardTone, string> = {
  default: "border-outline-variant/40 bg-white",
  warn: "border-amber-200 bg-amber-50",
  ok: "border-emerald-200 bg-emerald-50",
  accent: "border-indigo-200 bg-indigo-50",
};

export const StatCard = ({
  label,
  value,
  sub,
  hint,
  icon: Icon,
  trend,
  href,
  tone = "default",
}: {
  label: string;
  value: string | number;
  sub?: string;
  hint?: string;
  icon?: LucideIcon;
  trend?: "up" | "down" | "neutral";
  href?: string;
  tone?: StatCardTone;
}) => {
  const detail = hint ?? sub;

  const content = (
    <div
      className={cn(
        "rounded-xl border p-5 shadow-sm transition",
        toneClasses[tone],
        href && "hover:-translate-y-0.5 hover:opacity-95",
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-on-surface-variant">{label}</p>
          <p className="mt-2 text-2xl font-bold text-primary">{value}</p>
          {detail ? <p className="mt-1 text-xs text-on-surface-variant">{detail}</p> : null}
        </div>
        {Icon ? (
          <div className="rounded-lg bg-primary-fixed/50 p-2.5 text-secondary">
            <Icon className="h-5 w-5" />
          </div>
        ) : null}
      </div>
      {trend ? (
        <p
          className={cn(
            "mt-3 text-xs font-medium",
            trend === "up" && "text-success",
            trend === "down" && "text-error",
            trend === "neutral" && "text-on-surface-variant",
          )}
        >
          {trend === "up" ? "▲ 전월 대비 개선" : trend === "down" ? "▼ 주의 필요" : "— 유지"}
        </p>
      ) : null}
    </div>
  );

  return href ? (
    <Link to={href} className="block">
      {content}
    </Link>
  ) : (
    content
  );
};
