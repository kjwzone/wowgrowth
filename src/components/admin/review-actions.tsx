"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export const ReviewActions = ({
  metadataId,
}: {
  metadataId: string;
}) => {
  const router = useRouter();
  const [pending, setPending] = useState<"approve" | "reject" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async (status: "approved" | "rejected") => {
    setPending(status === "approved" ? "approve" : "reject");
    setError(null);

    const res = await fetch(`/api/admin/reviews/programs/${metadataId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status,
        reviewComment:
          status === "approved" ? "관리자 승인" : "관리자 반려",
      }),
    });
    const json = await res.json();
    setPending(null);

    if (!json.success) {
      setError(json.error?.message ?? "처리 실패");
      return;
    }

    router.refresh();
    router.replace("/admin/reviews/programs");
  };
  return (
    <div className="flex flex-wrap gap-3">
      <button
        type="button"
        disabled={pending !== null}
        onClick={() => submit("approved")}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-60"
      >
        {pending === "approve" ? "승인 중..." : "승인"}
      </button>
      <button
        type="button"
        disabled={pending !== null}
        onClick={() => submit("rejected")}
        className="rounded-md border border-slate-300 px-4 py-2 text-sm disabled:opacity-60"
      >
        {pending === "reject" ? "반려 중..." : "반려"}
      </button>
      {error ? <p className="w-full text-sm text-red-600">{error}</p> : null}
    </div>
  );
};
