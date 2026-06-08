import { splitPrimaryAndDeep } from "@/lib/business-plan-outline";

export type FormTable = { columns: string[]; rows: string[][] };
export type FormItem =
  | { kind: "table"; table: FormTable }
  | { kind: "bullet"; text: string; level: 1 | 2 }
  | { kind: "text"; text: string };
export type FormBlock = { title: string; items: FormItem[] };

const HEADER_RE = /^■\s*(.+)$/;
const ANGLE_HEADER_RE = /^<\s*(.+?)\s*>$/;
const DEEP_RE = /심화\s*[—-]/;
const SUB_BULLET_RE = /^(○|▶|◦|▪)\s*/;
const NUM_BULLET_RE = /^(\d+\)|\d+\.)\s*/;
const DASH_BULLET_RE = /^[·\-*]\s*/;

const isSeparatorRow = (cells: string[]): boolean =>
  cells.length > 0 && cells.every((cell) => /^[-—\s:]*$/.test(cell));

const parsePipeRow = (line: string): string[] | null => {
  if (!line.includes("|")) return null;
  const cells = line
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
  if (cells.length < 2) return null;
  if (isSeparatorRow(cells)) return null;
  return cells;
};

export const parseFormBlocks = (content: string): FormBlock[] => {
  const { primary } = splitPrimaryAndDeep(content);
  const blocks: FormBlock[] = [];
  let current: FormBlock | null = null;
  let pendingRows: string[][] = [];

  const flushTable = () => {
    if (pendingRows.length > 0 && current) {
      current.items.push({
        kind: "table",
        table: { columns: pendingRows[0]!, rows: pendingRows.slice(1) },
      });
    }
    pendingRows = [];
  };

  const ensureBlock = () => {
    if (!current) current = { title: "", items: [] };
    return current;
  };

  for (const raw of primary.split("\n")) {
    const line = raw.trim();
    if (!line) continue;

    const headerMatch = line.match(HEADER_RE);
    if (headerMatch && !DEEP_RE.test(line)) {
      flushTable();
      if (current) blocks.push(current);
      current = { title: headerMatch[1]!.trim(), items: [] };
      continue;
    }

    const angleMatch = line.match(ANGLE_HEADER_RE);
    if (angleMatch && !line.includes("|") && angleMatch[1]!.length <= 40) {
      flushTable();
      if (current) blocks.push(current);
      current = { title: angleMatch[1]!.trim(), items: [] };
      continue;
    }

    const cells = parsePipeRow(line);
    if (cells) {
      ensureBlock();
      pendingRows.push(cells);
      continue;
    }
    // 마크다운 표 구분선(| --- | --- |)은 표를 끊지 않고 건너뜀
    if (line.includes("|") && pendingRows.length > 0) {
      continue;
    }

    flushTable();
    const block = ensureBlock();

    if (SUB_BULLET_RE.test(line)) {
      block.items.push({
        kind: "bullet",
        text: line.replace(SUB_BULLET_RE, "").trim(),
        level: 2,
      });
    } else if (NUM_BULLET_RE.test(line)) {
      block.items.push({ kind: "bullet", text: line, level: 1 });
    } else if (DASH_BULLET_RE.test(line)) {
      block.items.push({
        kind: "bullet",
        text: line.replace(DASH_BULLET_RE, "").trim(),
        level: 1,
      });
    } else {
      block.items.push({ kind: "text", text: line });
    }
  }

  flushTable();
  if (current) blocks.push(current);
  return blocks;
};

/** 본문에 "■ 제목" 형식의 폼 블록이 하나라도 있는지 */
export const hasFormBlocks = (content: string): boolean =>
  parseFormBlocks(content).some((block) => block.title.length > 0);

export const FORM_PLACEHOLDER = "[작성 필요]";

export const isFormPlaceholder = (value: string): boolean =>
  value.trim() === FORM_PLACEHOLDER;
