"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  PROGRAM_STATUS_OPTIONS,
  type ProgramStatus,
} from "@/lib/validation/program";

type ProgramStatusSelectProps = {
  programId: string;
  value: ProgramStatus;
};

export const ProgramStatusSelect = ({ programId, value }: ProgramStatusSelectProps) => {
  const router = useRouter();
  const [status, setStatus] = useState<ProgramStatus>(value);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onChange = async (nextStatus: ProgramStatus) => {
    if (nextStatus === status) return;

    const previous = status;
    setStatus(nextStatus);
    setPending(true);
    setError(null);

    const res = await fetch(`/api/admin/programs/${programId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    const json = await res.json();
    setPending(false);

    if (!json.success) {
      setStatus(previous);
      setError(json.error?.message ?? "상태 변경에 실패했습니다.");
      return;
    }

    router.refresh();
  };

  return (
    <span className="inline-flex flex-col items-end gap-0.5">
      <select
        value={status}
        disabled={pending}
        onChange={(e) => onChange(e.target.value as ProgramStatus)}
        aria-label="공고 상태"
        className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 disabled:opacity-60"
      >
        {PROGRAM_STATUS_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </span>
  );
};
