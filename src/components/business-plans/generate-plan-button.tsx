"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { PlanGenerationProgress } from "@/components/business-plans/plan-generation-progress";

export const GeneratePlanButton = ({
  programId,
  matchingResultId,
}: {
  programId: string;
  matchingResultId?: string;
}) => {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [finished, setFinished] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const startedAtRef = useRef<number | null>(null);

  useEffect(() => {
    if (!pending) {
      return undefined;
    }

    startedAtRef.current = Date.now();
    setElapsedMs(0);
    setFinished(false);

    const timer = window.setInterval(() => {
      if (startedAtRef.current === null) {
        return;
      }
      setElapsedMs(Date.now() - startedAtRef.current);
    }, 500);

    return () => window.clearInterval(timer);
  }, [pending]);

  const onClick = async () => {
    setPending(true);
    setMessage(null);

    try {
      const res = await fetch("/api/business-plans/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ programId, matchingResultId }),
      });
      const json = await res.json();

      if (!json.success) {
        const code = json.error?.code as string | undefined;
        const hint =
          code === "VALIDATION_ERROR"
            ? "기업정보를 먼저 등록하거나, 추천 목록에서 해당 사업을 선택해 생성하세요."
            : "";
        setMessage(
          [json.error?.message ?? "생성 실패", hint].filter(Boolean).join("\n"),
        );
        return;
      }

      setFinished(true);
      if (startedAtRef.current !== null) {
        setElapsedMs(Date.now() - startedAtRef.current);
      }

      await new Promise((resolve) => window.setTimeout(resolve, 400));
      router.push(`/business-plans/${json.data.id}`);
      router.refresh();
    } finally {
      setPending(false);
      setFinished(false);
      startedAtRef.current = null;
      setElapsedMs(0);
    }
  };

  return (
    <div className="min-w-0">
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-60"
      >
        {pending ? "AI 작성 중..." : "사업계획서 초안 생성"}
      </button>
      <PlanGenerationProgress
        active={pending}
        finished={finished}
        elapsedMs={elapsedMs}
      />
      {message ? (
        <p className="mt-2 whitespace-pre-wrap text-sm text-red-600">{message}</p>
      ) : null}
    </div>
  );
};
