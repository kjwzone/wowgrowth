import { Download, FileText } from "lucide-react";
import type { BusinessPlanDocument } from "@/lib/business-plan-document";
import { downloadBusinessPlanHtml } from "@/lib/business-plan-html-export";
import { selectReferenceImages } from "@/lib/business-plan-reference-images";
import { BusinessPlanSectionVisual } from "@/components/ui/BusinessPlanSectionVisual";
import { ReferenceImageGallery } from "@/components/ui/ReferenceImageGallery";
import { ProgressBar } from "./ProgressBar";

export const BusinessPlanPreview = ({
  document,
  onJumpToSection,
}: {
  document: BusinessPlanDocument;
  onJumpToSection?: (sectionId: string) => void;
}) => {
  const referenceImages = selectReferenceImages(document.programTitle);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-secondary/20 bg-gradient-to-br from-surface to-secondary/5 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-secondary">
              통합 미리보기 · HTML 문서
            </p>
            <h3 className="mt-1 text-lg font-bold text-primary">{document.programTitle}</h3>
            <p className="mt-1 text-sm text-on-surface-variant">
              {document.sections.length}개 섹션 · 표·차트·인포그래픽 · 전체 완성도{" "}
              {document.overallCompleteness}%
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <FileText className="h-8 w-8 text-secondary/60" />
            <button
              type="button"
              onClick={() => downloadBusinessPlanHtml(document, referenceImages)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-secondary bg-white px-3 py-1.5 text-xs font-medium text-secondary hover:bg-secondary/5"
            >
              <Download className="h-3.5 w-3.5" />
              HTML 다운로드
            </button>
          </div>
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
                {section.displayLabel}
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
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-outline-variant/30 pb-3">
              <button
                type="button"
                onClick={() => onJumpToSection?.(section.id)}
                className="text-left text-base font-semibold text-primary hover:text-secondary"
                title="섹션 편집으로 이동"
              >
                {section.displayLabel}
              </button>
              <span className="text-sm font-medium text-secondary">{section.completeness}%</span>
            </div>
            <BusinessPlanSectionVisual sectionTitle={section.title} content={section.content} />
          </section>
        ))}
      </article>

      <ReferenceImageGallery images={referenceImages} />
    </div>
  );
};
