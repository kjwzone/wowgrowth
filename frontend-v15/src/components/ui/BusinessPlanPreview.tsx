import { FileText } from "lucide-react";
import type { BusinessPlanDocument } from "@/lib/business-plan-document";
import { ProgressBar } from "./ProgressBar";

export const BusinessPlanPreview = ({
  document,
  onJumpToSection,
}: {
  document: BusinessPlanDocument;
  onJumpToSection?: (sectionId: string) => void;
}) => (
  <div className="space-y-6">
    <div className="rounded-xl border border-secondary/20 bg-gradient-to-br from-surface to-secondary/5 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-secondary">
            통합 미리보기
          </p>
          <h3 className="mt-1 text-lg font-bold text-primary">{document.programTitle}</h3>
          <p className="mt-1 text-sm text-on-surface-variant">
            {document.sections.length}개 섹션 · 전체 완성도 {document.overallCompleteness}%
          </p>
        </div>
        <FileText className="h-8 w-8 text-secondary/60" />
      </div>
      <div className="mt-4 max-w-xs">
        <ProgressBar value={document.overallCompleteness} label="전체 완성도" />
      </div>
    </div>

    <nav className="sticky top-0 z-10 rounded-xl border border-outline-variant/40 bg-white/95 p-3 backdrop-blur">
      <p className="mb-2 text-xs font-medium text-on-surface-variant">목차</p>
      <ul className="flex flex-wrap gap-2">
        {document.sections.map((section) => (
          <li key={section.id}>
            <a
              href={`#preview-${section.id}`}
              className="inline-block rounded-full bg-surface-container px-3 py-1 text-xs text-on-surface-variant hover:bg-secondary/10 hover:text-secondary"
            >
              {section.order}. {section.title.split("_")[0]}
            </a>
          </li>
        ))}
      </ul>
    </nav>

    <article className="space-y-8">
      {document.sections.map((section) => (
        <section
          key={section.id}
          id={`preview-${section.id}`}
          className="scroll-mt-28 rounded-xl border border-outline-variant/40 bg-white p-5 shadow-sm"
        >
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-outline-variant/30 pb-3">
            <button
              type="button"
              onClick={() => onJumpToSection?.(section.id)}
              className="text-left text-base font-semibold text-primary hover:text-secondary"
              title="섹션 편집으로 이동"
            >
              {section.order}. {section.title}
            </button>
            <span className="text-sm font-medium text-secondary">{section.completeness}%</span>
          </div>
          {section.content ? (
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-on-surface-variant">
              {section.content}
            </pre>
          ) : (
            <p className="text-sm italic text-on-surface-variant/70">(미작성)</p>
          )}
        </section>
      ))}
    </article>
  </div>
);
