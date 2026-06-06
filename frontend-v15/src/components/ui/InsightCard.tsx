import { AlertCircle, CheckCircle2, Lightbulb } from "lucide-react";
import type { DashboardInsight } from "@/types";
import { cn } from "@/lib/utils";

const iconMap = {
  tip: Lightbulb,
  alert: AlertCircle,
  success: CheckCircle2,
} as const;

const styleMap = {
  tip: "border-secondary-fixed bg-secondary-fixed/20",
  alert: "border-warning/30 bg-amber-50",
  success: "border-success/30 bg-emerald-50",
};

export const InsightCard = ({ insight }: { insight: DashboardInsight }) => {
  const Icon = iconMap[insight.type];
  return (
    <div className={cn("rounded-xl border p-4", styleMap[insight.type])}>
      <div className="flex gap-3">
        <Icon className="mt-0.5 h-5 w-5 shrink-0 text-secondary" />
        <div>
          <p className="text-sm font-semibold text-primary">{insight.title}</p>
          <p className="mt-1 text-sm text-on-surface-variant">{insight.body}</p>
        </div>
      </div>
    </div>
  );
};
