import type { ProgramStatus } from "@/types";
import { cn } from "@/lib/utils";

const programStyles: Record<ProgramStatus, string> = {
  모집중: "bg-emerald-100 text-emerald-800",
  마감임박: "bg-amber-100 text-amber-800",
  마감: "bg-slate-100 text-slate-600",
};

export const StatusBadge = ({ status }: { status: ProgramStatus }) => (
  <span
    className={cn(
      "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
      programStyles[status],
    )}
  >
    {status}
  </span>
);
