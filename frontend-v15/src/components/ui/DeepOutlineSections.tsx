import type { DeepOutlineBlock } from "@/lib/business-plan-outline";

export const DeepOutlineSections = ({ blocks }: { blocks: DeepOutlineBlock[] }) => (
  <div className="space-y-4">
    {blocks.map((block) => (
      <div
        key={block.title}
        className="rounded-xl border border-secondary/25 bg-gradient-to-br from-secondary/5 to-primary/5 p-4"
      >
        <p className="text-sm font-bold text-secondary">■ 심화 — {block.title}</p>
        <ul className="mt-3 space-y-2">
          {block.items.map((item, index) => (
            <li
              key={`${block.title}-${index}`}
              className="flex gap-2 text-sm leading-relaxed text-on-surface-variant"
            >
              <span className="mt-0.5 shrink-0 font-bold text-secondary">·</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    ))}
  </div>
);
