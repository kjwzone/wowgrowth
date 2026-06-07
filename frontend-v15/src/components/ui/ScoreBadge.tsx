import { cn } from "@/lib/utils";

export const ScoreBadge = ({
  score,
  size = "md",
}: {
  score: number | null;
  size?: "sm" | "md" | "lg";
}) => {
  if (score === null) {
    return (
      <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-500">
        AI 매칭 예정
      </span>
    );
  }

  const level = score >= 85 ? "high" : score >= 70 ? "medium" : "low";
  const colors = {
    high: "bg-emerald-100 text-emerald-800 border-emerald-200",
    medium: "bg-amber-100 text-amber-800 border-amber-200",
    low: "bg-slate-100 text-slate-600 border-slate-200",
  };
  const sizes = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-1.5",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border font-semibold",
        colors[level],
        sizes[size],
      )}
    >
      AI {score}%
    </span>
  );
};
