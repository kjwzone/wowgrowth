import type { ProgramStatus, ReviewStatus } from "@/types";
import { cn } from "@/lib/utils";

const programStyles: Record<ProgramStatus, string> = {
  모집중: "bg-emerald-100 text-emerald-800",
  마감임박: "bg-amber-100 text-amber-800",
  마감: "bg-slate-100 text-slate-600",
};

const reviewStyles: Record<ReviewStatus, string> = {
  대기: "bg-blue-100 text-blue-800",
  승인: "bg-emerald-100 text-emerald-800",
  반려: "bg-red-100 text-red-800",
  보완요청: "bg-amber-100 text-amber-800",
};

export const StatusBadge = ({
  status,
}: {
  status: ProgramStatus | ReviewStatus;
}) => (
  <span
    className={cn(
      "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
      programStyles[status as ProgramStatus] ?? reviewStyles[status as ReviewStatus],
    )}
  >
    {status}
  </span>
);
