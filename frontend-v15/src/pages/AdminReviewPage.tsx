import { useEffect, useState } from "react";
import { PageHeader, SectionCard } from "@/components/ui/PageHeader";
import { DataTable } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { adminApi } from "@/lib/api";
import type { AdminReviewItem, ReviewStatus } from "@/types";

export default function AdminReviewPage() {
  const [items, setItems] = useState<AdminReviewItem[]>([]);
  const [selected, setSelected] = useState<AdminReviewItem | null>(null);
  const [comment, setComment] = useState("");

  useEffect(() => {
    void adminApi.listReviews().then(setItems);
  }, []);

  const updateStatus = async (status: ReviewStatus) => {
    if (!selected) return;
    const updated = await adminApi.updateReview(selected.id, {
      status,
      adminComment: comment,
    });
    setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
    setSelected(updated);
  };

  return (
    <div>
      <PageHeader
        title="관리자 검수"
        description="AI 작성 문서 검토 · 승인/반려 · 보완 요청"
      />

      <SectionCard title="사용자별 신청 현황" className="mb-6">
        <DataTable
          rows={items}
          onRowClick={setSelected}
          columns={[
            { key: "company", header: "기업", render: (r) => r.companyName },
            { key: "applicant", header: "신청자", render: (r) => r.applicant },
            { key: "program", header: "공고", render: (r) => r.programTitle },
            { key: "doc", header: "AI 문서", render: (r) => r.aiDocumentTitle },
            { key: "date", header: "제출일", render: (r) => r.submittedAt },
            {
              key: "status",
              header: "상태",
              render: (r) => <StatusBadge status={r.status} />,
            },
          ]}
        />
      </SectionCard>

      {selected ? (
        <SectionCard title={`검수: ${selected.companyName}`}>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-3 text-sm">
              <p>
                <span className="text-on-surface-variant">공고:</span>{" "}
                {selected.programTitle}
              </p>
              <p>
                <span className="text-on-surface-variant">문서:</span>{" "}
                {selected.aiDocumentTitle}
              </p>
              <p>
                <span className="text-on-surface-variant">현재 상태:</span>{" "}
                <StatusBadge status={selected.status} />
              </p>
            </div>
            <div>
              <label className="block text-sm">
                <span className="text-on-surface-variant">관리자 코멘트</span>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                  placeholder="승인/반려/보완 사유를 입력하세요."
                  className="mt-1 w-full rounded-lg border border-outline-variant/50 p-3 text-sm focus:border-secondary focus:outline-none"
                />
              </label>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void updateStatus("승인")}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white"
                >
                  승인
                </button>
                <button
                  type="button"
                  onClick={() => void updateStatus("보완요청")}
                  className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white"
                >
                  보완 요청
                </button>
                <button
                  type="button"
                  onClick={() => void updateStatus("반려")}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white"
                >
                  반려
                </button>
              </div>
            </div>
          </div>
          {selected.adminComment ? (
            <p className="mt-4 rounded-lg bg-surface-container-low p-3 text-sm text-on-surface-variant">
              저장된 코멘트: {selected.adminComment}
            </p>
          ) : null}
        </SectionCard>
      ) : (
        <p className="text-sm text-on-surface-variant">테이블에서 항목을 선택하세요.</p>
      )}
    </div>
  );
}
