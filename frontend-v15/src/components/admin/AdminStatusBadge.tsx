import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  approved: "bg-emerald-100 text-emerald-800",
  published: "bg-emerald-100 text-emerald-800",
  succeeded: "bg-emerald-100 text-emerald-800",
  reviewing: "bg-amber-100 text-amber-900",
  draft: "bg-slate-100 text-slate-700",
  queued: "bg-slate-100 text-slate-700",
  running: "bg-sky-100 text-sky-800",
  rejected: "bg-rose-100 text-rose-800",
  failed: "bg-rose-100 text-rose-800",
  closed: "bg-slate-100 text-slate-600",
  high: "bg-emerald-100 text-emerald-800",
  medium: "bg-amber-100 text-amber-900",
  low: "bg-slate-100 text-slate-700",
};

const statusLabels: Record<string, string> = {
  approved: "승인",
  reviewing: "검수중",
  draft: "초안",
  rejected: "반려",
  published: "게시",
  closed: "마감",
  high: "높음",
  medium: "보통",
  low: "낮음",
};

export const AdminStatusBadge = ({ value }: { value: string }) => {
  const key = value.toLowerCase();
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
        statusStyles[key] ?? "bg-surface-container text-on-surface-variant",
      )}
    >
      {statusLabels[key] ?? value}
    </span>
  );
};
