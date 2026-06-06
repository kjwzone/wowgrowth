import type { BusinessPlanSection } from "@/types";
import { ProgressBar } from "./ProgressBar";

export const BusinessPlanEditor = ({
  sections,
  activeId,
  onSelect,
  onChange,
}: {
  sections: BusinessPlanSection[];
  activeId: string;
  onSelect: (id: string) => void;
  onChange: (id: string, content: string) => void;
}) => {
  const active = sections.find((s) => s.id === activeId) ?? sections[0];

  return (
    <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
      <nav className="space-y-1">
        {sections.map((section) => (
          <button
            key={section.id}
            type="button"
            onClick={() => onSelect(section.id)}
            className={`w-full rounded-lg px-3 py-2.5 text-left text-sm transition ${
              section.id === active?.id
                ? "bg-secondary text-on-secondary"
                : "text-on-surface-variant hover:bg-surface-container"
            }`}
          >
            <p className="font-medium">{section.title}</p>
            <ProgressBar value={section.completeness} showValue={false} />
          </button>
        ))}
      </nav>
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold text-primary">{active?.title}</h3>
          <span className="text-sm text-secondary">{active?.completeness}%</span>
        </div>
        <textarea
          value={active?.content ?? ""}
          onChange={(e) => onChange(active!.id, e.target.value)}
          rows={12}
          placeholder="AI 초안을 생성하거나 직접 입력하세요."
          className="w-full rounded-xl border border-outline-variant/50 bg-white p-4 text-sm leading-relaxed focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
        />
      </div>
    </div>
  );
};
