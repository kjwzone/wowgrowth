"use client";

import { useState } from "react";
import type { FinancialsFormValue } from "@/lib/company/financials";
import { FINANCIAL_FILE_MAX_COUNT } from "@/lib/company/financials";
import { createStatementFileFromUpload } from "@/lib/company/read-financial-file";

type FinancialsInputProps = {
  value: FinancialsFormValue;
  onChange: (value: FinancialsFormValue) => void;
};

export const FinancialsInput = ({ value, onChange }: FinancialsInputProps) => {
  const [fileError, setFileError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const onSummaryChange = (summaryText: string) => {
    onChange({ ...value, summaryText });
  };

  const onFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = [...(e.target.files ?? [])];
    e.target.value = "";
    if (selected.length === 0) return;

    setFileError(null);
    setPending(true);

    try {
      const remaining = FINANCIAL_FILE_MAX_COUNT - value.files.length;
      if (remaining <= 0) {
        throw new Error(`재무제표 파일은 최대 ${FINANCIAL_FILE_MAX_COUNT}개까지 등록할 수 있습니다.`);
      }

      const toAdd = selected.slice(0, remaining);
      const uploaded = await Promise.all(toAdd.map((f) => createStatementFileFromUpload(f)));

      onChange({
        ...value,
        files: [...value.files, ...uploaded],
      });
    } catch (err) {
      setFileError(err instanceof Error ? err.message : "파일 처리 실패");
    } finally {
      setPending(false);
    }
  };

  const removeFile = (id: string) => {
    onChange({
      ...value,
      files: value.files.filter((f) => f.id !== id),
    });
  };

  return (
    <div className="space-y-6 rounded-md border border-slate-200 bg-slate-50 p-4">
      <div>
        <h3 className="text-sm font-semibold text-slate-800">재무 정보</h3>
        <p className="mt-1 text-xs text-slate-500">
          PDF 파일 업로드시 스캔 파일은 인식이 안될 수 있습니다. 이 경우 &quot;재무정보
          요약&quot;에 텍스트를 입력해 주세요. (챗GPT 등 이용 추천)
        </p>
      </div>

      <div>
        <p className="text-sm font-medium text-slate-700">1. 재무제표 파일 업로드</p>
        <p className="mt-1 text-xs text-slate-500">
          PDF, CSV, TXT, TSV (PDF 3MB / 텍스트 512KB 이하, 최대 {FINANCIAL_FILE_MAX_COUNT}개)
        </p>
        <input
          type="file"
          accept=".pdf,.csv,.txt,.tsv,application/pdf,text/csv,text/plain"
          multiple
          disabled={pending || value.files.length >= FINANCIAL_FILE_MAX_COUNT}
          onChange={onFilesSelected}
          className="mt-2 block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-sm file:text-white"
        />
        {pending ? (
          <p className="mt-2 text-xs text-slate-500">파일을 읽는 중...</p>
        ) : null}
        {fileError ? <p className="mt-2 text-sm text-red-600">{fileError}</p> : null}

        {value.files.length > 0 ? (
          <ul className="mt-3 divide-y divide-slate-200 rounded-md border border-slate-200 bg-white">
            {value.files.map((file) => (
              <li
                key={file.id}
                className="flex items-center justify-between gap-2 px-3 py-2 text-sm"
              >
                <span className="truncate">
                  {file.file_name}{" "}
                  <span className="text-xs text-slate-400">
                    ({Math.round(file.size_bytes / 1024)}KB)
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => removeFile(file.id)}
                  className="shrink-0 text-xs text-red-600 underline"
                >
                  삭제
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div>
        <p className="text-sm font-medium text-slate-700">2. 재무정보 요약 (직접 입력)</p>
        <textarea
          name="financialSummary"
          rows={6}
          value={value.summaryText}
          onChange={(e) => onSummaryChange(e.target.value)}
          placeholder={`예시:\n- 2024년 매출 12억, 영업이익 1.2억\n- 부채비율 45%, 유동비율 180%\n- 주요 고객: B2B SaaS 구독`}
          className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
    </div>
  );
};
