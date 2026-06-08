import type { ReactNode } from "react";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { BudgetExecutionPlanTables } from "@/components/ui/BudgetExecutionPlanTables";
import { TamSamSomDiagram } from "@/components/ui/TamSamSomDiagram";
import { parseBudgetExecutionPlan } from "@/lib/budget-execution-plan-model";
import { DeepOutlineSections } from "@/components/ui/DeepOutlineSections";
import {
  parseBulletItems,
  parseContentLines,
  parseKeyValueItems,
  parsePercentages,
  parseTagBlocks,
  parseTimelinePhases,
} from "@/lib/business-plan-content-parser";
import { parseDeepBlocks, splitPrimaryAndDeep } from "@/lib/business-plan-outline";
import { buildTamSamSomTiers } from "@/lib/tam-sam-som-model";
import { cn } from "@/lib/utils";
import {
  hasTeamComposition,
  isPlaceholderValue,
  parseTeamCompositionPlan,
  tableIsEmpty,
  TEAM_COMPOSITION_COLUMNS,
  virtualTeamCompositionSample,
  type OrgChartNode,
  type RepresentativeRow,
  type TeamTable,
} from "@/lib/team-composition-model";

const CHART_COLORS = ["#0040e0", "#031635", "#5b8def", "#93b4f4", "#c5d7fa"];

const FallbackText = ({ content }: { content: string }) => (
  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-on-surface-variant">
    {content}
  </pre>
);

const KeyValueTable = ({ items }: { items: { key: string; value: string }[] }) => (
  <div className="overflow-x-auto rounded-lg border border-outline-variant/30">
    <table className="w-full min-w-[320px] text-left text-sm">
      <thead className="bg-surface-container text-xs uppercase text-on-surface-variant">
        <tr>
          <th className="px-4 py-2 font-medium">항목</th>
          <th className="px-4 py-2 font-medium">내용</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <tr key={item.key} className="border-t border-outline-variant/20">
            <td className="px-4 py-2.5 font-medium text-primary">{item.key}</td>
            <td className="px-4 py-2.5 text-on-surface-variant">{item.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const TagCalloutGrid = ({ blocks }: { blocks: { tag: string; text: string }[] }) => (
  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
    {blocks.map((block) => (
      <div
        key={block.tag}
        className="rounded-xl border border-secondary/20 bg-gradient-to-br from-secondary/5 to-primary/5 p-4"
      >
        <p className="text-xs font-bold uppercase tracking-wide text-secondary">{block.tag}</p>
        <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">{block.text}</p>
      </div>
    ))}
  </div>
);

const BulletCalloutList = ({ items }: { items: string[] }) => (
  <ul className="grid gap-2 sm:grid-cols-2">
    {items.map((item, index) => (
      <li
        key={`${index}-${item.slice(0, 24)}`}
        className="flex gap-2 rounded-lg border border-outline-variant/30 bg-surface-container/50 px-3 py-2.5 text-sm text-on-surface-variant"
      >
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary/15 text-xs font-bold text-secondary">
          {index + 1}
        </span>
        <span>{item}</span>
      </li>
    ))}
  </ul>
);

const BudgetPieChart = ({ data }: { data: { name: string; value: number }[] }) => (
  <div className="grid gap-4 lg:grid-cols-2">
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => `${value}%`} />
        </PieChart>
      </ResponsiveContainer>
    </div>
    <ul className="space-y-2 self-center text-sm">
      {data.map((item, index) => (
        <li key={item.name} className="flex items-center gap-2">
          <span
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
          />
          <span className="font-medium text-primary">{item.name}</span>
          <span className="text-on-surface-variant">{item.value}%</span>
        </li>
      ))}
    </ul>
  </div>
);

const Timeline = ({ phases }: { phases: { phase: string; detail: string }[] }) => (
  <ol className="relative space-y-4 border-l-2 border-secondary/30 pl-6">
    {phases.map((phase) => (
      <li key={phase.phase} className="relative">
        <span className="absolute -left-[1.6rem] top-1 h-3 w-3 rounded-full bg-secondary" />
        <p className="text-sm font-semibold text-primary">{phase.phase}</p>
        <p className="mt-1 text-sm text-on-surface-variant">{phase.detail}</p>
      </li>
    ))}
  </ol>
);

const TeamCards = ({ items }: { items: string[] }) => (
  <div className="grid gap-3 sm:grid-cols-2">
    {items.map((item, index) => (
      <div
        key={`${index}-${item.slice(0, 20)}`}
        className="flex items-start gap-3 rounded-xl border border-outline-variant/30 p-4"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-on-primary">
          {index + 1}
        </div>
        <p className="text-sm leading-relaxed text-on-surface-variant">{item}</p>
      </div>
    ))}
  </div>
);

const FlowDiagram = ({ steps }: { steps: string[] }) => (
  <div className="flex flex-wrap items-center gap-2">
    {steps.slice(0, 5).map((step, index) => (
      <div key={step} className="flex items-center gap-2">
        <div className="rounded-lg bg-secondary/10 px-3 py-2 text-xs font-medium text-secondary">
          {step.slice(0, 28)}
          {step.length > 28 ? "…" : ""}
        </div>
        {index < Math.min(steps.length, 5) - 1 ? (
          <span className="text-on-surface-variant">→</span>
        ) : null}
      </div>
    ))}
  </div>
);

const VirtualBadge = () => (
  <span className="inline-flex items-center gap-1 rounded-full border border-amber-300/70 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
    예시 (가상) · 실제 정보로 교체 필요
  </span>
);

const TeamSubsection = ({
  title,
  virtual,
  children,
}: {
  title: string;
  virtual?: boolean;
  children: ReactNode;
}) => (
  <div className="space-y-2.5">
    <h4 className="flex flex-wrap items-center gap-2 text-sm font-bold text-primary">
      <span className="h-3.5 w-1 rounded-full bg-primary" />
      {title}
      {virtual ? <VirtualBadge /> : null}
    </h4>
    {children}
  </div>
);

const OrgChartView = ({
  nodes,
  virtual,
}: {
  nodes: OrgChartNode[];
  virtual?: boolean;
}) => {
  const meaningful = nodes.filter((node) => !isPlaceholderValue(node.label));
  if (meaningful.length === 0) return null;

  const [head, ...rest] = meaningful;
  return (
    <div
      className={cn(
        "space-y-2 rounded-xl border p-4",
        virtual
          ? "border-amber-200/70 bg-amber-50/30"
          : "border-outline-variant/30 bg-surface-container/20",
      )}
    >
      <div className="mx-auto w-fit rounded-xl border-2 border-primary bg-primary/5 px-5 py-3 text-center">
        <p className="text-sm font-bold text-primary">{head!.label}</p>
        {head!.detail ? (
          <p className="mt-0.5 text-xs text-on-surface-variant">{head!.detail}</p>
        ) : null}
      </div>
      {rest.length > 0 ? (
        <>
          <div className="mx-auto h-4 w-px bg-outline-variant/60" />
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {rest.map((node, index) => (
              <div
                key={`${index}-${node.label}`}
                className="rounded-lg border border-outline-variant/40 bg-white px-3 py-2.5 text-center"
              >
                <p className="text-sm font-semibold text-on-surface">{node.label}</p>
                {node.detail ? (
                  <p className="mt-0.5 text-xs text-on-surface-variant">{node.detail}</p>
                ) : null}
              </div>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
};

const placeholderCell = (value: string) =>
  isPlaceholderValue(value) ? (
    <span className="text-on-surface-variant/50">{value || "(작성 필요)"}</span>
  ) : (
    value
  );

const RepresentativeTable = ({ rows }: { rows: RepresentativeRow[] }) => (
  <div className="overflow-x-auto rounded-lg border border-outline-variant/30">
    <table className="w-full min-w-[320px] text-left text-sm">
      <tbody>
        {rows.map((row, index) => (
          <tr
            key={`${index}-${row.label}`}
            className="border-t border-outline-variant/20 first:border-t-0"
          >
            <th className="w-32 bg-surface-container px-4 py-2.5 text-left font-medium text-primary">
              {row.label}
            </th>
            <td className="px-4 py-2.5 text-on-surface-variant">
              {placeholderCell(row.value)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const TeamGridTable = ({
  table,
  fallbackColumns,
}: {
  table: TeamTable;
  fallbackColumns: readonly string[];
}) => {
  const columns = table.columns.length ? table.columns : [...fallbackColumns];
  return (
    <div className="overflow-x-auto rounded-lg border border-outline-variant/30">
      <table className="w-full min-w-[480px] text-left text-sm">
        <thead className="bg-surface-container text-xs uppercase text-on-surface-variant">
          <tr>
            {columns.map((column, index) => (
              <th key={`${index}-${column}`} className="px-4 py-2 font-medium">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="border-t border-outline-variant/20 align-top">
              {columns.map((_, cellIndex) => (
                <td key={cellIndex} className="px-4 py-2.5 text-on-surface-variant">
                  {placeholderCell(row[cellIndex] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const TeamCompositionView = ({ content }: { content: string }) => {
  const plan = parseTeamCompositionPlan(content);
  const sample = virtualTeamCompositionSample();

  const orgVirtual = plan.orgChart.every((node) =>
    isPlaceholderValue(node.label),
  );
  const orgData = orgVirtual ? sample.orgChart : plan.orgChart;

  const repVirtual = plan.representative.every((row) =>
    isPlaceholderValue(row.value),
  );
  const repData = repVirtual ? sample.representative : plan.representative;

  const teamVirtual = tableIsEmpty(plan.team);
  const teamData = teamVirtual ? sample.team : plan.team;

  const partnerVirtual = tableIsEmpty(plan.partners);
  const partnerData = partnerVirtual ? sample.partners : plan.partners;

  return (
    <div className="space-y-6">
      <TeamSubsection title="조직도" virtual={orgVirtual}>
        <OrgChartView nodes={orgData} virtual={orgVirtual} />
      </TeamSubsection>
      <TeamSubsection title="대표자 역량" virtual={repVirtual}>
        <RepresentativeTable rows={repData} />
      </TeamSubsection>
      <TeamSubsection title="팀 구성(안)" virtual={teamVirtual}>
        <TeamGridTable table={teamData} fallbackColumns={TEAM_COMPOSITION_COLUMNS.team} />
      </TeamSubsection>
      <TeamSubsection title="협력 기관 현황 및 협업 방안" virtual={partnerVirtual}>
        <TeamGridTable
          table={partnerData}
          fallbackColumns={TEAM_COMPOSITION_COLUMNS.partner}
        />
      </TeamSubsection>
      <SectionDeepExtras content={content} />
    </div>
  );
};

const SectionDeepExtras = ({ content }: { content: string }) => {
  const deepBlocks = parseDeepBlocks(content);
  if (deepBlocks.length === 0) return null;
  return <DeepOutlineSections blocks={deepBlocks} />;
};

export const BusinessPlanSectionVisual = ({
  sectionTitle,
  content,
}: {
  sectionTitle: string;
  content: string;
}) => {
  if (!content.trim()) {
    return <p className="text-sm italic text-on-surface-variant/70">(미작성)</p>;
  }

  const { primary } = splitPrimaryAndDeep(content);
  const lines = parseContentLines(primary);
  const keyValues = parseKeyValueItems(lines);
  const tags = parseTagBlocks(primary);
  const bullets = parseBulletItems(lines);

  if (sectionTitle === "일반현황" && keyValues.length > 0) {
    return (
      <div className="space-y-4">
        <KeyValueTable items={keyValues} />
        {bullets.length > keyValues.length ? (
          <BulletCalloutList items={bullets.filter((b) => !b.includes(":"))} />
        ) : null}
        <SectionDeepExtras content={content} />
      </div>
    );
  }

  if (sectionTitle.includes("창업 아이템") && tags.length > 0) {
    return (
      <div className="space-y-4">
        <TagCalloutGrid blocks={tags} />
        <SectionDeepExtras content={content} />
      </div>
    );
  }

  if (sectionTitle.includes("문제 인식")) {
    return (
      <div className="space-y-4">
        <BulletCalloutList items={bullets.slice(0, 6)} />
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <strong>핵심 Pain Point:</strong> {bullets[0] ?? "시장·고객 문제 정의"}
        </div>
        <SectionDeepExtras content={content} />
      </div>
    );
  }

  if (sectionTitle.includes("실현 가능성")) {
    const phases = parseTimelinePhases(primary);
    return (
      <div className="space-y-4">
        {phases.length > 0 ? <Timeline phases={phases} /> : null}
        <BulletCalloutList items={bullets} />
        <SectionDeepExtras content={content} />
      </div>
    );
  }

  if (sectionTitle.includes("사업비")) {
    const budgetPlan = parseBudgetExecutionPlan(content);
    const budget = parsePercentages(primary);
    const notes = bullets.filter(
      (b) => !b.startsWith("[사업비") && !b.startsWith("[비목]"),
    );
    return (
      <div className="space-y-4">
        {budgetPlan ? <BudgetExecutionPlanTables plan={budgetPlan} /> : null}
        {!budgetPlan && budget.length > 0 ? <BudgetPieChart data={budget} /> : null}
        {notes.length > 0 ? <BulletCalloutList items={notes} /> : null}
        <SectionDeepExtras content={content} />
        {!budgetPlan && notes.length === 0 && parseDeepBlocks(content).length === 0 ? (
          <FallbackText content={primary} />
        ) : null}
      </div>
    );
  }

  if (sectionTitle.includes("성장전략")) {
    const tamTiers = buildTamSamSomTiers(content);
    const gtm = bullets.find((b) => /GTM|채널|BM/i.test(b));
    return (
      <div className="space-y-4">
        {tamTiers ? (
          <div>
            <p className="mb-3 text-xs font-medium text-on-surface-variant">
              TAM / SAM / SOM 시장 규모 분석
            </p>
            <TamSamSomDiagram tiers={tamTiers} />
          </div>
        ) : null}
        {gtm ? (
          <div>
            <p className="mb-2 text-xs font-medium text-on-surface-variant">Go-To-Market 흐름</p>
            <FlowDiagram steps={gtm.split(/[·/]/).map((s) => s.trim()).filter(Boolean)} />
          </div>
        ) : null}
        <BulletCalloutList items={bullets} />
        <SectionDeepExtras content={content} />
      </div>
    );
  }

  if (sectionTitle.includes("팀 구성")) {
    if (hasTeamComposition(content)) {
      return <TeamCompositionView content={content} />;
    }
    return (
      <div className="space-y-4">
        <TeamCards items={bullets} />
        <SectionDeepExtras content={content} />
      </div>
    );
  }

  if (keyValues.length > 0) {
    return <KeyValueTable items={keyValues} />;
  }

  if (tags.length > 0) {
    return <TagCalloutGrid blocks={tags} />;
  }

  if (bullets.length > 0) {
    return (
      <div className="space-y-4">
        <BulletCalloutList items={bullets} />
        <SectionDeepExtras content={content} />
      </div>
    );
  }

  const deepOnly = parseDeepBlocks(content);
  if (deepOnly.length > 0) {
    return <DeepOutlineSections blocks={deepOnly} />;
  }

  return <FallbackText content={primary} />;
};
