"use client";

type FoundedDateInputProps = {
  value: string;
  onChange: (value: string) => void;
};

const dateInputClass =
  "mt-1 w-full max-w-xs rounded-md border border-slate-300 px-3 py-2 text-sm";

export const FoundedDateInput = ({ value, onChange }: FoundedDateInputProps) => (
  <div className="space-y-2">
    <input
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={dateInputClass}
    />
    <p className="text-xs text-slate-500">캘린더에서 설립일을 선택하세요.</p>
  </div>
);
