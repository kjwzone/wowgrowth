"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export const RefreshPageButton = ({ label = "새로고침" }: { label?: string }) => {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const onClick = () => {
    setPending(true);
    router.refresh();
    window.setTimeout(() => setPending(false), 400);
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="rounded-md border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-60"
    >
      {pending ? "갱신 중..." : label}
    </button>
  );
};
