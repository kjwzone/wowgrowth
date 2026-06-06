export const ProgressBar = ({
  value,
  label,
  showValue = true,
}: {
  value: number;
  label?: string;
  showValue?: boolean;
}) => (
  <div>
    {(label || showValue) && (
      <div className="mb-1.5 flex justify-between text-sm">
        {label ? <span className="text-on-surface-variant">{label}</span> : <span />}
        {showValue ? <span className="font-semibold text-secondary">{value}%</span> : null}
      </div>
    )}
    <div className="h-2 overflow-hidden rounded-full bg-surface-container">
      <div
        className="h-full rounded-full bg-secondary transition-all duration-500"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  </div>
);
