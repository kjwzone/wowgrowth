"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export const ExtractMetadataButton = ({ programId }: { programId: string }) => {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [metadataId, setMetadataId] = useState<string | null>(null);

  const onClick = async () => {
    setPending(true);
    setMessage(null);
    setMetadataId(null);

    const res = await fetch(`/api/admin/programs/${programId}/extract`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskType: "announcement_metadata" }),
    });
    const json = await res.json();
    setPending(false);

    if (!json.success) {
      setMessage(json.error?.message ?? "추출 실패");
      return;
    }

    const nextMetadataId = json.data?.metadataId as string | undefined;
    setMetadataId(nextMetadataId ?? null);
    setMessage("AI 메타데이터 추출이 완료되었습니다.");
    router.refresh();
  };

  return (
    <div>
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className="rounded-md border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-60"
      >
        {pending ? "AI 추출 중..." : "AI 메타데이터 추출"}
      </button>
      {message ? (
        <p className="mt-1 whitespace-pre-wrap text-xs text-slate-600">{message}</p>
      ) : null}
      {metadataId ? (
        <Link
          href={`/admin/reviews/programs/${metadataId}`}
          className="mt-2 inline-block text-sm text-slate-900 underline"
        >
          AI 검수 화면으로 이동
        </Link>
      ) : null}
    </div>
  );
};
