"use client";

import { useState } from "react";
import { ANNOUNCEMENT_PDF_MAX_BYTES } from "@/lib/programs/announcement-pdf";
import {
  readAnnouncementPdfAsText,
  type AnnouncementPdfUpload,
} from "@/lib/programs/announcement-pdf";

type AnnouncementPdfInputProps = {
  value: AnnouncementPdfUpload | null;
  onChange: (value: AnnouncementPdfUpload | null) => void;
};

export const AnnouncementPdfInput = ({ value, onChange }: AnnouncementPdfInputProps) => {
  const [fileError, setFileError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const onFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setFileError(null);
    setPending(true);

    try {
      const uploaded = await readAnnouncementPdfAsText(file);
      onChange(uploaded);
    } catch (err) {
      onChange(null);
      setFileError(err instanceof Error ? err.message : "PDF 처리 실패");
    } finally {
      setPending(false);
    }
  };

  const clearFile = () => {
    setFileError(null);
    onChange(null);
  };

  const maxMb = Math.round(ANNOUNCEMENT_PDF_MAX_BYTES / (1024 * 1024));

  return (
    <div className="space-y-2">
      <p className="text-xs text-slate-500">
        PDF 파일만 업로드할 수 있습니다. (최대 {maxMb}MB, 텍스트 자동 추출)
      </p>
      <input
        type="file"
        accept=".pdf,application/pdf"
        disabled={pending}
        onChange={onFileSelected}
        className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-sm file:text-white"
      />
      {pending ? <p className="text-xs text-slate-500">PDF를 읽는 중...</p> : null}
      {fileError ? <p className="text-sm text-red-600">{fileError}</p> : null}
      {value ? (
        <div className="flex items-center justify-between gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
          <span className="truncate">
            {value.fileName}{" "}
            <span className="text-xs text-slate-400">
              ({Math.round(value.sizeBytes / 1024)}KB)
            </span>
          </span>
          <button
            type="button"
            onClick={clearFile}
            className="shrink-0 text-xs text-red-600 underline"
          >
            삭제
          </button>
        </div>
      ) : null}
    </div>
  );
};
