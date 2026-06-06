export const scoreBarTone = (score: number): string => {
  if (score >= 70) return "bg-emerald-500";
  if (score >= 40) return "bg-amber-400";
  return "bg-slate-400";
};

export const MatchScoreBar = ({
  score,
  label,
}: {
  score: number;
  label: string;
}) => (
  <div className="flex items-center gap-3">
    <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
      <div
        className={`h-full rounded-full ${scoreBarTone(score)}`}
        style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
      />
    </div>
    <span className="w-16 shrink-0 text-right text-xs font-medium text-slate-600">
      {score}점 · {label}
    </span>
  </div>
);
