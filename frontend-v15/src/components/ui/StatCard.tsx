import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export const StatCard = ({
  label,
  value,
  sub,
  icon: Icon,
  trend,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
}) => (
  <div className="rounded-xl border border-outline-variant/40 bg-white p-5 shadow-sm">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-medium text-on-surface-variant">{label}</p>
        <p className="mt-2 text-2xl font-bold text-primary">{value}</p>
        {sub ? <p className="mt-1 text-xs text-on-surface-variant">{sub}</p> : null}
      </div>
      <div className="rounded-lg bg-primary-fixed/50 p-2.5 text-secondary">
        <Icon className="h-5 w-5" />
      </div>
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
