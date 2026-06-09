import type { BusinessPlanDocument } from "@/lib/business-plan-document";
import {
  parseBulletItems,
  parseContentLines,
  parseKeyValueItems,
  parsePercentages,
  parseTagBlocks,
} from "@/lib/business-plan-content-parser";
import type { ReferenceImage } from "@/lib/business-plan-reference-images";
import {
  formatKrw,
  lineItemTotal,
  parseBudgetExecutionPlan,
  pctOfTotal,
  sumBudgetItems,
} from "@/lib/budget-execution-plan-model";
import {
  buildTamSamSomTiers,
  buildTamSamSomTiersFromTable,
  type TamSamSomTier,
} from "@/lib/tam-sam-som-model";
import { parseDeepBlocks } from "@/lib/business-plan-outline";
import {
  hasTeamComposition,
  isPlaceholderValue,
  parseTeamCompositionPlan,
  tableIsEmpty,
  TEAM_COMPOSITION_COLUMNS,
  virtualTeamCompositionSample,
  type TeamTable,
} from "@/lib/team-composition-model";
import {
  FORM_PLACEHOLDER,
  hasFormBlocks,
  parseFormBlocks,
} from "@/lib/business-plan-form-blocks";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

const escapeHtml = (text: string): string =>
  text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const renderKeyValueTable = (content: string): string => {
  const items = parseKeyValueItems(parseContentLines(content));
  if (items.length === 0) return "";
  const rows = items
    .map(
      (item) =>
        `<tr><th>${escapeHtml(item.key)}</th><td>${escapeHtml(item.value)}</td></tr>`,
    )
    .join("");
  return `<table class="kv-table"><tbody>${rows}</tbody></table>`;
};

const renderTagGrid = (content: string): string => {
  const tags = parseTagBlocks(content);
  if (tags.length === 0) return "";
  return `<div class="tag-grid">${tags
    .map(
      (tag) =>
        `<div class="tag-card"><div class="tag-label">${escapeHtml(tag.tag)}</div><p>${escapeHtml(tag.text)}</p></div>`,
    )
    .join("")}</div>`;
};

const renderBudgetBars = (content: string): string => {
  const data = parsePercentages(content);
  if (data.length === 0) return "";
  return `<div class="bar-chart">${data
    .map(
      (item) =>
        `<div class="bar-row"><span class="bar-label">${escapeHtml(item.name)}</span><div class="bar-track"><div class="bar-fill" style="width:${item.value}%"></div></div><span class="bar-value">${item.value}%</span></div>`,
    )
    .join("")}</div>`;
};

const renderBudgetExecutionPlan = (content: string): string => {
  const plan = parseBudgetExecutionPlan(content);
  if (!plan) return "";

  const { summary, items } = plan;
  const totals = sumBudgetItems(items);

  const summaryTable = `<table class="budget-table budget-summary">
    <caption>〈 사업비 집행 계획 〉</caption>
    <thead>
      <tr>
        <th rowspan="2">구분</th>
        <th colspan="2">총사업비 (A=B+C)</th>
        <th colspan="2">정부지원사업비 (B)</th>
        <th colspan="4">창업기업 자기부담사업비 (C)</th>
      </tr>
      <tr>
        <th>금액(원)</th><th>%</th>
        <th>금액(원)</th><th>%</th>
        <th colspan="2">현금</th><th colspan="2">현물</th>
      </tr>
      <tr>
        <th></th><th></th><th></th><th></th><th></th>
        <th>금액(원)</th><th>%</th><th>금액(원)</th><th>%</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>${escapeHtml(summary.regionLabel)}</td>
        <td>${formatKrw(summary.totalAmount)}</td><td>100</td>
        <td>${formatKrw(summary.govSupportAmount)}</td><td>${pctOfTotal(summary.govSupportAmount, summary.totalAmount)}</td>
        <td>${formatKrw(summary.selfCashAmount)}</td><td>${pctOfTotal(summary.selfCashAmount, summary.totalAmount)}</td>
        <td>${formatKrw(summary.selfInKindAmount)}</td><td>${pctOfTotal(summary.selfInKindAmount, summary.totalAmount)}</td>
      </tr>
    </tbody>
  </table>`;

  const itemRows = items
    .map(
      (item) =>
        `<tr>
          <td>${escapeHtml(item.category)}</td>
          <td class="left">${escapeHtml(item.plan)}</td>
          <td>${formatKrw(item.govSupport)}</td>
          <td>${formatKrw(item.selfCash)}</td>
          <td>${formatKrw(item.selfInKind)}</td>
          <td colspan="2">${formatKrw(lineItemTotal(item))}</td>
        </tr>`,
    )
    .join("");

  const detailTable = `<table class="budget-table budget-detail">
    <thead>
      <tr>
        <th rowspan="2">비 목</th>
        <th rowspan="2">집행 계획</th>
        <th colspan="5">총사업비(원) (ⓐ+ⓑ)</th>
      </tr>
      <tr>
        <th>정부지원사업비 (ⓐ)</th>
        <th colspan="2">자기부담사업비 (ⓑ)</th>
        <th colspan="2">합계 (ⓐ+ⓑ)</th>
      </tr>
      <tr>
        <th></th><th></th><th></th>
        <th>현금</th><th>현물</th><th colspan="2"></th>
      </tr>
    </thead>
    <tbody>
      ${itemRows}
      <tr class="total-row">
        <td colspan="2">합 계</td>
        <td>${formatKrw(totals.govSupport)}</td>
        <td>${formatKrw(totals.selfCash)}</td>
        <td>${formatKrw(totals.selfInKind)}</td>
        <td colspan="2">${formatKrw(totals.total)}</td>
      </tr>
    </tbody>
  </table>`;

  return `<div class="budget-plan">${summaryTable}${detailTable}</div>`;
};

const TAM_RING_COLORS: Record<string, string> = {
  tam: "#031635",
  sam: "#0040e0",
  som: "#93b4f4",
};

const renderTamSamSomDiagram = (content: string): string => {
  const tiers = buildTamSamSomTiers(content);
  if (!tiers) return "";
  return renderTamSamSomTiersHtml(tiers);
};

const renderTamSamSomTiersHtml = (tiers: TamSamSomTier[]): string => {
  const svg = `<div class="tam-diagram-svg" aria-hidden="true">
    <svg viewBox="0 0 280 160" xmlns="http://www.w3.org/2000/svg">
      <path d="M 20 140 A 120 120 0 0 1 260 140 Z" fill="${TAM_RING_COLORS.tam}" stroke="#021028" stroke-width="1"/>
      <path d="M 55 140 A 85 85 0 0 1 225 140 Z" fill="${TAM_RING_COLORS.sam}" stroke="#0030b0" stroke-width="1"/>
      <path d="M 90 140 A 50 50 0 0 1 190 140 Z" fill="${TAM_RING_COLORS.som}" stroke="#5b8def" stroke-width="1"/>
      <text x="140" y="72" text-anchor="middle" fill="#fff" font-size="11" font-weight="700">TAM</text>
      <text x="140" y="95" text-anchor="middle" fill="#fff" font-size="11" font-weight="700">SAM</text>
      <text x="140" y="118" text-anchor="middle" fill="#fff" font-size="11" font-weight="700">SOM</text>
    </svg>
  </div>`;

  const cards = tiers
    .map((tier) => {
      const valueHtml =
        tier.valueLabel !== "—"
          ? `<p class="tam-value">추정 규모: <strong>${escapeHtml(tier.valueLabel)}</strong></p>`
          : "";
      return `<div class="tam-card" style="border-left-color:${TAM_RING_COLORS[tier.key]}">
        <div class="tam-card-head">
          <span class="tam-acronym" style="color:${TAM_RING_COLORS[tier.key]}">${escapeHtml(tier.acronym)}</span>
          <span class="tam-title">${escapeHtml(tier.titleKo)}</span>
          <span class="tam-title-en">(${escapeHtml(tier.titleEn)})</span>
        </div>
        <p class="tam-focus">주요 초점: ${escapeHtml(tier.focusKo)}</p>
        <p class="tam-example"><strong>예시:</strong> ${escapeHtml(tier.example)}</p>
        ${valueHtml}
      </div>`;
    })
    .join("");

  return `<div class="tam-diagram">
    <p class="tam-diagram-label">TAM / SAM / SOM 시장 규모 분석</p>
    <div class="tam-diagram-grid">${svg}<div class="tam-cards">${cards}</div></div>
  </div>`;
};

const virtualBadgeHtml = `<span class="team-virtual-badge">예시 (가상) · 실제 정보로 교체 필요</span>`;

const renderTeamComposition = (content: string): string => {
  const plan = parseTeamCompositionPlan(content);
  const sample = virtualTeamCompositionSample();

  const orgVirtual = plan.orgChart.every((node) =>
    isPlaceholderValue(node.label),
  );
  const orgData = orgVirtual ? sample.orgChart : plan.orgChart;
  const orgNodes = orgData.filter((node) => !isPlaceholderValue(node.label));
  const [head, ...rest] = orgNodes;
  const orgHtml = head
    ? `<div class="org-chart">
        <div class="org-head"><strong>${escapeHtml(head.label)}</strong>${head.detail ? `<span>${escapeHtml(head.detail)}</span>` : ""}</div>
        ${
          rest.length
            ? `<div class="org-grid">${rest
                .map(
                  (node) =>
                    `<div class="org-node"><strong>${escapeHtml(node.label)}</strong>${node.detail ? `<span>${escapeHtml(node.detail)}</span>` : ""}</div>`,
                )
                .join("")}</div>`
            : ""
        }
      </div>`
    : "";

  const repVirtual = plan.representative.every((row) =>
    isPlaceholderValue(row.value),
  );
  const repData = repVirtual ? sample.representative : plan.representative;
  const repHtml = `<table class="kv-table"><tbody>${repData
    .map(
      (row) =>
        `<tr><th>${escapeHtml(row.label)}</th><td>${escapeHtml(row.value || "(작성 필요)")}</td></tr>`,
    )
    .join("")}</tbody></table>`;

  const gridTable = (table: TeamTable, fallback: readonly string[]): string => {
    const columns = table.columns.length ? table.columns : [...fallback];
    const head = `<thead><tr>${columns
      .map((column) => `<th>${escapeHtml(column)}</th>`)
      .join("")}</tr></thead>`;
    const body = table.rows
      .map(
        (row) =>
          `<tr>${columns
            .map((_, index) => `<td>${escapeHtml(row[index] ?? "(작성 필요)")}</td>`)
            .join("")}</tr>`,
      )
      .join("");
    return `<table class="team-table">${head}<tbody>${body}</tbody></table>`;
  };

  const teamVirtual = tableIsEmpty(plan.team);
  const teamHtml = gridTable(
    teamVirtual ? sample.team : plan.team,
    TEAM_COMPOSITION_COLUMNS.team,
  );

  const partnerVirtual = tableIsEmpty(plan.partners);
  const partnerHtml = gridTable(
    partnerVirtual ? sample.partners : plan.partners,
    TEAM_COMPOSITION_COLUMNS.partner,
  );

  const blockHtml = (title: string, virtual: boolean, body: string) =>
    `<div class="team-block"><h4>${escapeHtml(title)}${virtual ? virtualBadgeHtml : ""}</h4>${body}</div>`;

  return `<div class="team-composition">
    ${blockHtml("조직도", orgVirtual, orgHtml)}
    ${blockHtml("대표자 역량", repVirtual, repHtml)}
    ${blockHtml("팀 구성(안)", teamVirtual, teamHtml)}
    ${blockHtml("협력 기관 현황 및 협업 방안", partnerVirtual, partnerHtml)}
  </div>`;
};

const PLACEHOLDER_TOKENS = [FORM_PLACEHOLDER, "[수정 필요]"];

const highlightPlaceholder = (text: string): string => {
  let escaped = escapeHtml(text);
  for (const token of PLACEHOLDER_TOKENS) {
    escaped = escaped
      .split(escapeHtml(token))
      .join(`<span class="form-todo">${escapeHtml(token)}</span>`);
  }
  return escaped;
};

const renderFormBlocks = (content: string): string => {
  const blocks = parseFormBlocks(content);
  if (blocks.length === 0) return "";

  const imageToken = /^\[이미지\]\s*/;

  const blockHtml = blocks
    .map((block) => {
      const isMarketBlock =
        block.title.includes("목표 시장") || block.title.includes("시장 규모");
      const marketTable = isMarketBlock
        ? block.items.find((item) => item.kind === "table")
        : undefined;
      const marketTiers =
        marketTable && marketTable.kind === "table"
          ? buildTamSamSomTiersFromTable(marketTable.table.rows)
          : null;
      const diagramHtml = marketTiers ? renderTamSamSomTiersHtml(marketTiers) : "";

      const itemsHtml = block.items
        .map((item) => {
          if (item.kind === "table") {
            const columns = item.table.columns;
            const head = `<thead><tr>${columns
              .map((column) => `<th>${highlightPlaceholder(column)}</th>`)
              .join("")}</tr></thead>`;
            const body = item.table.rows
              .map(
                (row) =>
                  `<tr>${columns
                    .map((_, index) => `<td>${highlightPlaceholder(row[index] ?? "")}</td>`)
                    .join("")}</tr>`,
              )
              .join("");
            return `<table class="form-table">${head}<tbody>${body}</tbody></table>`;
          }
          if (imageToken.test(item.text)) {
            const caption = item.text.replace(imageToken, "");
            return `<div class="form-image"><span class="form-image-label">이미지 영역</span><span>${highlightPlaceholder(caption)}</span></div>`;
          }
          if (item.kind === "bullet") {
            const numbered = /^\d+[).]/.test(item.text);
            const cls =
              item.level === 2
                ? "form-bullet form-bullet-sub"
                : numbered
                  ? "form-bullet form-bullet-num"
                  : "form-bullet";
            return `<p class="${cls}">${highlightPlaceholder(item.text)}</p>`;
          }
          return `<p class="form-text">${highlightPlaceholder(item.text)}</p>`;
        })
        .join("");
      const heading = block.title
        ? `<h4 class="form-heading">${escapeHtml(block.title)}</h4>`
        : "";
      return `<div class="form-block">${heading}${diagramHtml}${itemsHtml}</div>`;
    })
    .join("");

  return `<div class="form-blocks">${blockHtml}</div>`;
};

const renderDeepOutline = (content: string): string => {
  const blocks = parseDeepBlocks(content);
  if (blocks.length === 0) return "";
  return `<div class="deep-outline">${blocks
    .map(
      (block) =>
        `<section class="deep-block">
          <h4>■ 심화 — ${escapeHtml(block.title)}</h4>
          <ul>${block.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
        </section>`,
    )
    .join("")}</div>`;
};

const renderBullets = (content: string): string => {
  const items = parseBulletItems(parseContentLines(content));
  const deep = renderDeepOutline(content);
  if (items.length === 0 && !deep) return `<pre>${escapeHtml(content)}</pre>`;
  const list =
    items.length > 0
      ? `<ul class="bullet-list">${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
      : "";
  return `${list}${deep}`;
};

const renderSectionVisualHtml = (title: string, content: string): string => {
  const deep = renderDeepOutline(content);
  if (
    (title.includes("문제 인식") ||
      title.includes("실현 가능성") ||
      title.includes("성장전략")) &&
    hasFormBlocks(content)
  ) {
    return `${renderFormBlocks(content)}${deep}`;
  }
  if (title === "일반현황") {
    return `${renderKeyValueTable(content) || renderBullets(content)}${deep}`;
  }
  if (title.includes("창업 아이템")) {
    return `${renderTagGrid(content)}${renderBullets(content)}`;
  }
  if (title.includes("사업비")) {
    const budget = renderBudgetExecutionPlan(content) || renderBudgetBars(content);
    const notes = parseBulletItems(parseContentLines(content));
    const noteList =
      notes.length > 0
        ? `<ul class="bullet-list">${notes.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
        : "";
    return `${budget}${noteList}${deep}`;
  }
  if (title.includes("성장전략")) {
    return `${renderTamSamSomDiagram(content)}${renderBullets(content)}`;
  }
  if (title.includes("팀 구성") && hasTeamComposition(content)) {
    return `${renderTeamComposition(content)}${deep}`;
  }
  return renderBullets(content);
};

const renderReferenceImages = (images: ReferenceImage[]): string =>
  `<section class="references">
    <h2>참고 이미지</h2>
    <div class="ref-grid">
      ${images
        .map(
          (img) =>
            `<figure class="ref-card">
              ${
                img.svg
                  ? `<div class="ref-svg">${img.svg}</div>`
                  : img.url
                    ? `<img src="${escapeHtml(img.url)}" alt="${escapeHtml(img.caption)}" loading="lazy" />`
                    : ""
              }
              <figcaption>
                <strong>${escapeHtml(img.caption)}</strong><br />
                ${escapeHtml(img.source)} · ${escapeHtml(img.license)}
              </figcaption>
            </figure>`,
        )
        .join("")}
    </div>
  </section>`;

const BASE_STYLES = `
  body { font-family: "Noto Sans KR", sans-serif; color: #031635; line-height: 1.6; margin: 0; padding: 2rem; background: #f8fafc; }
  .doc { max-width: 920px; margin: 0 auto; background: #fff; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 24px rgba(3,22,53,.08); }
  h1 { font-size: 1.75rem; margin-bottom: .25rem; }
  .meta { color: #64748b; font-size: .875rem; margin-bottom: 2rem; }
  section.block { margin-bottom: 2.5rem; padding-bottom: 1.5rem; border-bottom: 1px solid #e2e8f0; }
  section.block h2 { font-size: 1.125rem; color: #0040e0; margin-bottom: 1rem; }
  .kv-table { width: 100%; border-collapse: collapse; font-size: .875rem; }
  .kv-table th, .kv-table td { border: 1px solid #e2e8f0; padding: .625rem .75rem; text-align: left; vertical-align: top; }
  .kv-table th { background: #f1f5f9; width: 28%; }
  .tag-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: .75rem; margin-bottom: 1rem; }
  .tag-card { border: 1px solid #c5d7fa; background: linear-gradient(135deg, #f0f4ff, #fff); border-radius: 8px; padding: .75rem; }
  .tag-label { font-size: .75rem; font-weight: 700; color: #0040e0; text-transform: uppercase; }
  .bar-chart { margin: 1rem 0; }
  .bar-row { display: grid; grid-template-columns: 100px 1fr 48px; gap: .5rem; align-items: center; margin-bottom: .5rem; font-size: .8125rem; }
  .bar-track { height: 10px; background: #e2e8f0; border-radius: 999px; overflow: hidden; }
  .bar-fill { height: 100%; background: #0040e0; border-radius: 999px; }
  .bar-fill.tam { background: #031635; }
  .budget-plan { margin: 1rem 0 1.25rem; display: flex; flex-direction: column; gap: 1.25rem; }
  .budget-table { width: 100%; border-collapse: collapse; font-size: .75rem; }
  .budget-table caption { caption-side: top; font-weight: 700; font-size: .875rem; color: #031635; margin-bottom: .75rem; text-align: center; }
  .budget-table th, .budget-table td { border: 1px solid #cbd5e1; padding: .5rem .375rem; text-align: center; vertical-align: middle; }
  .budget-table th { background: #f1f5f9; font-weight: 600; color: #031635; }
  .budget-table td.left { text-align: left; }
  .budget-table .total-row { background: #f8fafc; font-weight: 700; }
  @media (max-width: 640px) { .budget-table { font-size: .6875rem; } }
  .tam-diagram { margin: 1rem 0 1.25rem; }
  .tam-diagram-label { font-size: .75rem; font-weight: 600; color: #64748b; margin-bottom: .75rem; }
  .tam-diagram-grid { display: grid; grid-template-columns: minmax(200px, 260px) 1fr; gap: 1.5rem; align-items: center; }
  .tam-diagram-svg svg { width: 100%; max-width: 280px; height: auto; display: block; margin: 0 auto; }
  .tam-cards { display: flex; flex-direction: column; gap: 1rem; }
  .tam-card { border: 1px solid #e2e8f0; border-left-width: 4px; border-radius: 12px; padding: 1rem; background: #fff; }
  .tam-card-head { display: flex; flex-wrap: wrap; align-items: baseline; gap: .375rem .5rem; }
  .tam-acronym { font-size: 1.125rem; font-weight: 700; }
  .tam-title { font-size: .875rem; font-weight: 600; color: #031635; }
  .tam-title-en { font-size: .75rem; color: #64748b; }
  .tam-focus { margin: .5rem 0 0; font-size: .75rem; font-weight: 600; color: #0040e0; }
  .tam-example { margin: .5rem 0 0; font-size: .875rem; color: #475569; line-height: 1.5; }
  .tam-value { margin: .375rem 0 0; font-size: .75rem; color: #64748b; }
  @media (max-width: 640px) { .tam-diagram-grid { grid-template-columns: 1fr; } }
  .team-composition { display: flex; flex-direction: column; gap: 1.5rem; }
  .team-block h4 { margin: 0 0 .625rem; font-size: .9375rem; color: #0040e0; display: flex; flex-wrap: wrap; align-items: center; gap: .5rem; }
  .team-virtual-badge { border: 1px solid #fcd34d; background: #fffbeb; color: #b45309; border-radius: 999px; padding: .125rem .5rem; font-size: .6875rem; font-weight: 500; }
  .org-chart { border: 1px solid #e2e8f0; border-radius: 12px; padding: 1rem; background: #f8fafc; text-align: center; }
  .org-head { display: inline-block; border: 2px solid #0040e0; border-radius: 12px; padding: .625rem 1.25rem; background: #eef2ff; }
  .org-head strong { display: block; color: #0040e0; font-size: .875rem; }
  .org-head span { display: block; color: #64748b; font-size: .75rem; margin-top: .125rem; }
  .org-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: .5rem; margin-top: 1rem; }
  .org-node { border: 1px solid #e2e8f0; border-radius: 8px; padding: .5rem; background: #fff; }
  .org-node strong { display: block; font-size: .8125rem; color: #031635; }
  .org-node span { display: block; font-size: .6875rem; color: #64748b; margin-top: .125rem; }
  .team-table { width: 100%; border-collapse: collapse; font-size: .8125rem; }
  .team-table th, .team-table td { border: 1px solid #e2e8f0; padding: .5rem .625rem; text-align: left; vertical-align: top; }
  .team-table th { background: #f1f5f9; font-weight: 600; }
  .form-blocks { display: flex; flex-direction: column; gap: 1.5rem; }
  .form-heading { margin: 0 0 .625rem; font-size: .9375rem; color: #0040e0; }
  .form-text { margin: .25rem 0; font-size: .875rem; color: #475569; }
  .form-bullet { margin: .25rem 0; padding-left: 1rem; font-size: .875rem; color: #475569; position: relative; }
  .form-bullet::before { content: "·"; position: absolute; left: .25rem; color: #0040e0; }
  .form-bullet-num { padding-left: .25rem; }
  .form-bullet-num::before { content: ""; }
  .form-bullet-sub { padding-left: 2rem; }
  .form-bullet-sub::before { content: "○"; left: 1.1rem; color: #94a3b8; font-size: .75rem; }
  .form-table { width: 100%; border-collapse: collapse; font-size: .8125rem; margin: .5rem 0; }
  .form-table th, .form-table td { border: 1px solid #e2e8f0; padding: .5rem .5rem; text-align: left; vertical-align: top; }
  .form-table th { background: #f1f5f9; font-weight: 600; }
  .form-todo { background: #fffbeb; color: #b45309; border-radius: 4px; padding: 0 .25rem; }
  .form-image { display: flex; flex-direction: column; align-items: center; gap: .25rem; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 2rem 1rem; text-align: center; color: #64748b; background: #f8fafc; font-size: .875rem; }
  .form-image-label { font-size: .75rem; color: #94a3b8; }
  .bullet-list { padding-left: 1.25rem; font-size: .875rem; }
  .bullet-list li { margin-bottom: .375rem; }
  .deep-outline { margin-top: 1rem; display: flex; flex-direction: column; gap: .875rem; }
  .deep-block { border: 1px solid #c5d7fa; border-radius: 12px; padding: 1rem; background: linear-gradient(135deg, #f0f4ff, #fff); }
  .deep-block h4 { margin: 0 0 .5rem; font-size: .875rem; color: #0040e0; }
  .deep-block ul { margin: 0; padding-left: 1.25rem; font-size: .875rem; color: #475569; }
  .deep-block li { margin-bottom: .375rem; line-height: 1.5; }
  pre { white-space: pre-wrap; font-size: .875rem; background: #f8fafc; padding: 1rem; border-radius: 8px; }
  .references h2 { font-size: 1rem; margin-bottom: 1rem; }
  .ref-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 1rem; }
  .ref-card { margin: 0; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
  .ref-card img { width: 100%; height: 160px; object-fit: cover; display: block; }
  .ref-svg { padding: .75rem; background: #fff; min-height: 200px; }
  .ref-svg svg { width: 100%; height: auto; display: block; }
  .ref-card figcaption { padding: .75rem; font-size: .75rem; color: #475569; }
  .ref-card a { color: #0040e0; }
`;

export const BUSINESS_PLAN_EXPORT_STYLES = BASE_STYLES;

/** 본문(article) 마크업만 생성 — HTML/DOCX/PDF 내보내기에서 공유 */
export const buildBusinessPlanArticleHtml = (
  document: BusinessPlanDocument,
  referenceImages: ReferenceImage[],
): string => {
  const sectionsHtml = document.sections
    .map(
      (section) =>
        `<section class="block" id="section-${escapeHtml(section.id)}">
          <h2>${escapeHtml(section.displayLabel)} <span style="font-size:.75rem;color:#64748b">(${section.completeness}%)</span></h2>
          ${section.content ? renderSectionVisualHtml(section.title, section.content) : "<p><em>(미작성)</em></p>"}
        </section>`,
    )
    .join("\n");

  return `<article class="doc">
    <h1>${escapeHtml(document.programTitle)}</h1>
    <p class="meta">사업계획서 통합 문서 · 전체 완성도 ${document.overallCompleteness}% · WOW Growth AI</p>
    ${sectionsHtml}
    ${renderReferenceImages(referenceImages)}
  </article>`;
};

export const exportBusinessPlanHtml = (
  document: BusinessPlanDocument,
  referenceImages: ReferenceImage[],
): string => `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(document.programTitle)} — 사업계획서</title>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;600;700&display=swap" rel="stylesheet" />
  <style>${BASE_STYLES}</style>
</head>
<body>
  ${buildBusinessPlanArticleHtml(document, referenceImages)}
</body>
</html>`;

const buildExportFilename = (
  document: BusinessPlanDocument,
  extension: string,
): string =>
  `사업계획서-${document.programTitle.slice(0, 30).replace(/\s+/g, "-")}.${extension}`;

const triggerBlobDownload = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const anchor = window.document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  anchor.style.display = "none";
  window.document.body.appendChild(anchor);
  anchor.click();
  window.setTimeout(() => {
    anchor.remove();
    URL.revokeObjectURL(url);
  }, 2000);
};

export const downloadBusinessPlanHtml = (
  document: BusinessPlanDocument,
  referenceImages: ReferenceImage[],
): void => {
  const html = exportBusinessPlanHtml(document, referenceImages);
  triggerBlobDownload(
    new Blob([html], { type: "text/html;charset=utf-8" }),
    buildExportFilename(document, "html"),
  );
};

export const downloadBusinessPlanDocx = async (
  document: BusinessPlanDocument,
  referenceImages: ReferenceImage[],
): Promise<void> => {
  const html = exportBusinessPlanHtml(document, referenceImages);
  const { asBlob } = await import("html-docx-js-typescript");
  const result = await asBlob(html, {
    orientation: "portrait",
    margins: { top: 720, right: 720, bottom: 720, left: 720 },
  });
  const blob =
    result instanceof Blob
      ? result
      : new Blob([result as BlobPart], {
          type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        });
  triggerBlobDownload(blob, buildExportFilename(document, "docx"));
};

const PDF_EXPORT_OVERRIDES = `
  body { margin: 0; padding: 0; background: #ffffff; }
  .doc { max-width: none; width: 794px; margin: 0; padding: 0; border-radius: 0; box-shadow: none; background: #ffffff; }
  section.block:first-of-type { margin-top: 0; }
`;

export const PDF_HOST_CLASS = "bp-pdf-host";

const PDF_FONT_STACK =
  '"Malgun Gothic", "Apple SD Gothic Neo", "Noto Sans KR", sans-serif';

/** PDF 캡처용 HTML — HTML보내기와 동일 스타일 + 인쇄 최적화 */
export const exportBusinessPlanHtmlForPdf = (
  document: BusinessPlanDocument,
  referenceImages: ReferenceImage[],
): string =>
  exportBusinessPlanHtml(document, referenceImages)
    .replace(
      /<link[^>]*fonts\.googleapis\.com[^>]*>\s*/i,
      "",
    )
    .replace(
      "</style>",
      `${PDF_EXPORT_OVERRIDES}
  body, .doc { font-family: ${PDF_FONT_STACK}; }
</style>`,
    );

/** 메인 문서에 렌더 — iframe 교차 문서 캡처 실패·onload 미호출 방지 */
export const createBusinessPlanPdfHost = (
  document: BusinessPlanDocument,
  referenceImages: ReferenceImage[],
  ownerDocument: Document = window.document,
): { host: HTMLElement; target: HTMLElement; cleanup: () => void } => {
  const host = ownerDocument.createElement("div");
  host.className = PDF_HOST_CLASS;
  host.setAttribute("aria-hidden", "true");
  Object.assign(host.style, {
    position: "fixed",
    left: "-10000px",
    top: "0",
    width: "794px",
    overflow: "visible",
    zIndex: "-1",
    opacity: "1",
    visibility: "visible",
    pointerEvents: "none",
    background: "#ffffff",
  });

  const style = ownerDocument.createElement("style");
  style.textContent = `${BASE_STYLES}${PDF_EXPORT_OVERRIDES}
  .${PDF_HOST_CLASS}, .${PDF_HOST_CLASS} .doc { font-family: ${PDF_FONT_STACK}; }`;
  host.appendChild(style);

  const wrapper = ownerDocument.createElement("div");
  wrapper.innerHTML = buildBusinessPlanArticleHtml(document, referenceImages);
  const article = wrapper.querySelector("article.doc");
  if (!(article instanceof HTMLElement)) {
    throw new Error("PDF export article not found");
  }
  host.appendChild(article);
  ownerDocument.body.appendChild(host);

  return {
    host,
    target: article,
    cleanup: () => host.remove(),
  };
};

export const waitForPdfLayout = (): Promise<void> =>
  new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });

const pdfTargetHasLayout = (target: HTMLElement): boolean => {
  const rect = target.getBoundingClientRect();
  return (
    target.scrollWidth > 0 ||
    target.scrollHeight > 0 ||
    rect.width > 0 ||
    rect.height > 0
  );
};

export const ensurePdfTargetReady = async (target: HTMLElement): Promise<void> => {
  await waitForPdfLayout();
  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (pdfTargetHasLayout(target)) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  if (!target.textContent?.trim()) {
    throw new Error("PDF target has no content");
  }
};

export const getBusinessPlanExportFilename = buildExportFilename;

export type PdfDownloadOffer = {
  blob: Blob;
  filename: string;
  url: string;
};

/** html2canvas 클론에서 화면 밖·숨김 스타일을 캡처 가능 상태로 복원 */
const revealClonedCaptureNode = (element: HTMLElement): void => {
  let node: HTMLElement | null = element;
  while (node) {
    node.style.visibility = "visible";
    node.style.opacity = "1";
    node.style.overflow = "visible";
    node.style.pointerEvents = "none";
    if (node.classList.contains(PDF_HOST_CLASS)) {
      node.style.position = "static";
      node.style.left = "auto";
      node.style.top = "auto";
      node.style.width = "794px";
      node.style.zIndex = "auto";
    }
    node = node.parentElement;
  }
};

const PDF_CAPTURE_BLOCKS = (target: HTMLElement): HTMLElement[] => {
  const children = Array.from(target.children).filter(
    (node): node is HTMLElement => node instanceof HTMLElement,
  );
  return children.length > 0 ? children : [target];
};

const appendCanvasToPdf = (
  pdf: {
    addPage: () => void;
    addImage: (
      imageData: string,
      format: string,
      x: number,
      y: number,
      width: number,
      height: number,
    ) => void;
    internal: { pageSize: { getWidth: () => number; getHeight: () => number } };
  },
  canvas: HTMLCanvasElement,
  hasPages: boolean,
): boolean => {
  const margin = 10;
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const contentWidth = pageWidth - margin * 2;
  const contentHeight = pageHeight - margin * 2;
  const imgData = canvas.toDataURL("image/jpeg", 0.92);
  const imgHeight = (canvas.height * contentWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = margin;
  let started = hasPages;

  while (heightLeft > 0) {
    if (started) {
      pdf.addPage();
    }
    pdf.addImage(imgData, "JPEG", margin, position, contentWidth, imgHeight);
    heightLeft -= contentHeight;
    position = heightLeft - imgHeight + margin;
    started = true;
  }

  return started;
};

export const renderBusinessPlanPdfBlob = async (target: HTMLElement): Promise<Blob> => {
  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const blocks = PDF_CAPTURE_BLOCKS(target);
  let hasPages = false;

  for (const block of blocks) {
    const canvas = await html2canvas(block, {
      scale: 1.25,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
      scrollX: 0,
      scrollY: 0,
      foreignObjectRendering: false,
      onclone: (_clonedDoc, clonedElement) => {
        if (clonedElement instanceof HTMLElement) {
          revealClonedCaptureNode(clonedElement);
        }
      },
    });

    if (canvas.width === 0 || canvas.height === 0) {
      continue;
    }

    hasPages = appendCanvasToPdf(pdf, canvas, hasPages);
  }

  if (!hasPages) {
    throw new Error("PDF canvas is empty");
  }

  const bytes = new Uint8Array(pdf.output("arraybuffer"));
  if (bytes.byteLength < 100) {
    throw new Error("PDF 파일이 비어 있습니다");
  }

  return new Blob([bytes], { type: "application/pdf" });
};

export const revokePdfDownloadOffer = (offer: PdfDownloadOffer): void => {
  URL.revokeObjectURL(offer.url);
};

export const createBusinessPlanPdfOffer = async (
  document: BusinessPlanDocument,
  referenceImages: ReferenceImage[],
): Promise<PdfDownloadOffer> => {
  window.scrollTo(0, 0);
  const filename = buildExportFilename(document, "pdf");
  const { target, cleanup } = createBusinessPlanPdfHost(document, referenceImages);

  try {
    await ensurePdfTargetReady(target);
    const blob = await renderBusinessPlanPdfBlob(target);
    return {
      blob,
      filename,
      url: URL.createObjectURL(blob),
    };
  } finally {
    cleanup();
  }
};

export const downloadBusinessPlanPdf = async (
  document: BusinessPlanDocument,
  referenceImages: ReferenceImage[],
): Promise<PdfDownloadOffer> => createBusinessPlanPdfOffer(document, referenceImages);
