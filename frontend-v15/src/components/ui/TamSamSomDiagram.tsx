import type { TamSamSomTier } from "@/lib/tam-sam-som-model";

const RING_COLORS: Record<string, { fill: string; stroke: string }> = {
  tam: { fill: "#031635", stroke: "#021028" },
  sam: { fill: "#0040e0", stroke: "#0030b0" },
  som: { fill: "#93b4f4", stroke: "#5b8def" },
};

export const TamSamSomDiagram = ({ tiers }: { tiers: TamSamSomTier[] }) => (
  <div className="grid gap-6 lg:grid-cols-[minmax(220px,280px)_1fr] lg:items-center">
    <div className="mx-auto w-full max-w-[280px]" aria-hidden>
      <svg viewBox="0 0 280 160" className="h-auto w-full">
        <path
          d="M 20 140 A 120 120 0 0 1 260 140 Z"
          fill={RING_COLORS.tam!.fill}
          stroke={RING_COLORS.tam!.stroke}
          strokeWidth="1"
        />
        <path
          d="M 55 140 A 85 85 0 0 1 225 140 Z"
          fill={RING_COLORS.sam!.fill}
          stroke={RING_COLORS.sam!.stroke}
          strokeWidth="1"
        />
        <path
          d="M 90 140 A 50 50 0 0 1 190 140 Z"
          fill={RING_COLORS.som!.fill}
          stroke={RING_COLORS.som!.stroke}
          strokeWidth="1"
        />
        <text x="140" y="118" textAnchor="middle" fill="#fff" fontSize="11" fontWeight="700">
          SOM
        </text>
        <text x="140" y="95" textAnchor="middle" fill="#fff" fontSize="11" fontWeight="700">
          SAM
        </text>
        <text x="140" y="72" textAnchor="middle" fill="#fff" fontSize="11" fontWeight="700">
          TAM
        </text>
      </svg>
    </div>

    <div className="space-y-4">
      {tiers.map((tier) => (
        <div
          key={tier.key}
          className="rounded-xl border border-outline-variant/30 bg-white p-4 shadow-sm"
          style={{ borderLeftWidth: 4, borderLeftColor: RING_COLORS[tier.key]!.fill }}
        >
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-lg font-bold" style={{ color: RING_COLORS[tier.key]!.fill }}>
              {tier.acronym}
            </span>
            <span className="text-sm font-semibold text-primary">{tier.titleKo}</span>
            <span className="text-xs text-on-surface-variant">({tier.titleEn})</span>
          </div>
          <p className="mt-2 text-xs font-medium text-secondary">주요 초점: {tier.focusKo}</p>
          <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
            <span className="font-medium text-primary">예시: </span>
            {tier.example}
          </p>
          {tier.valueLabel !== "—" ? (
            <p className="mt-1 text-xs text-on-surface-variant">
              추정 규모: <strong>{tier.valueLabel}</strong>
            </p>
          ) : null}
        </div>
      ))}
    </div>
  </div>
);
