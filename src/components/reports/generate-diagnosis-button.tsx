"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type CompanyOption = {
  id: string;
  companyName: string;
};

type GenerateDiagnosisButtonProps = {
  companies: CompanyOption[];
};

export const GenerateDiagnosisButton = ({ companies }: GenerateDiagnosisButtonProps) => {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState(companies[0]?.id ?? "");

  const showCompanySelect = companies.length > 1;
  const canGenerate = useMemo(() => Boolean(companyId), [companyId]);

  const onClick = async () => {
    if (!companyId) {
      setMessage("진단할 기업을 선택하세요.");
      return;
    }

    setPending(true);
    setMessage(null);

    const res = await fetch("/api/reports/diagnosis/generate", {
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
    router.push(`/reports/diagnosis/${json.data.id}`);
    router.refresh();
  };

  if (companies.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        진단할 기업이 없습니다. 먼저 기업정보를 등록하세요.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {showCompanySelect ? (
        <label className="block text-sm">
          <span>진단 대상 기업</span>
          <select
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
            className="mt-1 w-full max-w-md rounded-md border border-slate-300 px-3 py-2"
          >
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.companyName}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <button
        type="button"
        onClick={onClick}
        disabled={pending || !canGenerate}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-60"
      >
        {pending ? "AI 생성 중..." : "기업진단 보고서 생성"}
      </button>
      {message ? (
        <p className="whitespace-pre-wrap text-sm text-red-600">{message}</p>
      ) : null}
    </div>
  );
};
