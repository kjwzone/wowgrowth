"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export const GenerateMatchesButton = ({ companyId }: { companyId: string }) => {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const onClick = async () => {
    setPending(true);
    setMessage(null);
    const res = await fetch("/api/matches/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companyId }),
    });
    const json = await res.json();
    setPending(false);

    if (!json.success) {
      setMessage(json.error?.message ?? "생성 실패");
      return;
    }
    setMessage(`${json.data.created}건 추천이 생성되었습니다.`);
    router.refresh();
  };

  return (
    <div>
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-60"
      >
        {pending ? "생성 중..." : "추천 생성"}
      </button>
      {message ? <p className="mt-2 text-sm text-slate-600">{message}</p> : null}
    </div>
  );
};
