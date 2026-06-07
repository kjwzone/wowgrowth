import type { BusinessPlanDocument } from "@/lib/business-plan-document";
import {
  parseBulletItems,
  parseContentLines,
  parseKeyValueItems,
  parsePercentages,
  parseTagBlocks,
  parseTamSamSom,
} from "@/lib/business-plan-content-parser";
import type { ReferenceImage } from "@/lib/business-plan-reference-images";

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

const renderTamBars = (content: string): string => {
  const data = parseTamSamSom(content);
  if (!data) return "";
  const max = Math.max(...data.map((d) => d.value));
  return `<div class="bar-chart">${data
    .map((item) => {
      const width = Math.round((item.value / max) * 100);
      return `<div class="bar-row"><span class="bar-label">${item.label}</span><div class="bar-track"><div class="bar-fill tam" style="width:${width}%"></div></div><span class="bar-value">${item.value}</span></div>`;
    })
    .join("")}</div>`;
};

const renderBullets = (content: string): string => {
  const items = parseBulletItems(parseContentLines(content));
  if (items.length === 0) return `<pre>${escapeHtml(content)}</pre>`;
  return `<ul class="bullet-list">${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
};

const renderSectionVisualHtml = (title: string, content: string): string => {
  if (title === "일반현황") {
    return renderKeyValueTable(content) || renderBullets(content);
  }
  if (title.includes("창업 아이템")) {
    return `${renderTagGrid(content)}${renderBullets(content)}`;
  }
  if (title.includes("사업비")) {
    return `${renderBudgetBars(content)}${renderBullets(content)}`;
  }
  if (title.includes("성장전략")) {
    return `${renderTamBars(content)}${renderBullets(content)}`;
  }
  return renderBullets(content);
};

const renderReferenceImages = (images: ReferenceImage[]): string =>
  `<section class="references">
    <h2>참고 이미지 (출처 표기)</h2>
    <div class="ref-grid">
      ${images
        .map(
          (img) =>
            `<figure class="ref-card">
              <img src="${escapeHtml(img.url)}" alt="${escapeHtml(img.caption)}" loading="lazy" />
              <figcaption>
                <strong>${escapeHtml(img.caption)}</strong><br />
                출처: <a href="${escapeHtml(img.sourceUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(img.source)}</a>
                · ${escapeHtml(img.license)}
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
  .bullet-list { padding-left: 1.25rem; font-size: .875rem; }
  .bullet-list li { margin-bottom: .375rem; }
  pre { white-space: pre-wrap; font-size: .875rem; background: #f8fafc; padding: 1rem; border-radius: 8px; }
  .references h2 { font-size: 1rem; margin-bottom: 1rem; }
  .ref-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 1rem; }
  .ref-card { margin: 0; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
  .ref-card img { width: 100%; height: 160px; object-fit: cover; display: block; }
  .ref-card figcaption { padding: .75rem; font-size: .75rem; color: #475569; }
  .ref-card a { color: #0040e0; }
`;

export const exportBusinessPlanHtml = (
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

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(document.programTitle)} — 사업계획서</title>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;600;700&display=swap" rel="stylesheet" />
  <style>${BASE_STYLES}</style>
</head>
<body>
  <article class="doc">
    <h1>${escapeHtml(document.programTitle)}</h1>
    <p class="meta">사업계획서 통합 문서 · 전체 완성도 ${document.overallCompleteness}% · WOW Growth AI</p>
    ${sectionsHtml}
    ${renderReferenceImages(referenceImages)}
  </article>
</body>
</html>`;
};

export const downloadBusinessPlanHtml = (
  document: BusinessPlanDocument,
  referenceImages: ReferenceImage[],
): void => {
  const html = exportBusinessPlanHtml(document, referenceImages);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = window.document.createElement("a");
  anchor.href = url;
  anchor.download = `사업계획서-${document.programTitle.slice(0, 30).replace(/\s+/g, "-")}.html`;
  anchor.click();
  URL.revokeObjectURL(url);
};
