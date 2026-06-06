"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AnnouncementPdfInput } from "@/components/admin/announcement-pdf-input";
import {
  formatAnnouncementContentForStorage,
  type AnnouncementPdfUpload,
} from "@/lib/programs/announcement-pdf";

export const ProgramForm = () => {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [announcementPdf, setAnnouncementPdf] = useState<AnnouncementPdfUpload | null>(
    null,
  );

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPending(true);
    setError(null);

    if (!announcementPdf) {
      setPending(false);
      setError("공고 원문 PDF를 업로드해 주세요.");
      return;
    }

    const form = new FormData(e.currentTarget);
    const body = {
      title: String(form.get("title")),
      agency: String(form.get("agency")),
      category: String(form.get("category") || "") || null,
      region: String(form.get("region") || "") || null,
      applicationStartDate: String(form.get("applicationStartDate") || "") || null,
      applicationEndDate: String(form.get("applicationEndDate") || "") || null,
      status: String(form.get("status")),
      content: formatAnnouncementContentForStorage(announcementPdf),
    };

    const res = await fetch("/api/admin/programs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    setPending(false);

    if (!json.success) {
      setError(json.error?.message ?? "등록에 실패했습니다.");
      return;
    }

    router.push("/admin/programs");
    router.refresh();
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block text-sm">
        공고명
        <input name="title" required className="mt-1 w-full rounded-md border px-3 py-2" />
      </label>
      <label className="block text-sm">
        주관기관
        <input name="agency" required className="mt-1 w-full rounded-md border px-3 py-2" />
      </label>
      <label className="block text-sm">
        분야
        <input name="category" className="mt-1 w-full rounded-md border px-3 py-2" />
      </label>
      <label className="block text-sm">
        지역
        <input name="region" className="mt-1 w-full rounded-md border px-3 py-2" />
      </label>
      <label className="block text-sm">
        신청 시작일
        <input name="applicationStartDate" type="date" className="mt-1 w-full rounded-md border px-3 py-2" />
      </label>
      <label className="block text-sm">
        신청 종료일
        <input name="applicationEndDate" type="date" className="mt-1 w-full rounded-md border px-3 py-2" />
      </label>
      <label className="block text-sm">
        상태
        <select name="status" defaultValue="draft" className="mt-1 w-full rounded-md border px-3 py-2">
          <option value="draft">draft</option>
          <option value="published">published</option>
          <option value="closed">closed</option>
        </select>
      </label>
      <div className="block text-sm">
        <span>공고 원문 (PDF 업로드)</span>
        <div className="mt-1">
          <AnnouncementPdfInput value={announcementPdf} onChange={setAnnouncementPdf} />
        </div>
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-60"
      >
        {pending ? "등록 중..." : "공고 등록"}
      </button>
    </form>
  );
};
