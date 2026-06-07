export type DeepOutlineBlock = {
  title: string;
  items: string[];
};

const DEEP_HEADER_RE = /^■\s*심화\s*[—-]\s*(.+)$|^【심화\s*[—-]\s*(.+?)】$/;
const BULLET_RE = /^([·○\-]|\d+\))\s*/;

/** 본문과 심화 블록 분리 */
export const splitPrimaryAndDeep = (content: string): { primary: string; deep: string } => {
  const lines = content.split("\n");
  const deepStart = lines.findIndex((line) => DEEP_HEADER_RE.test(line.trim()));
  if (deepStart === -1) return { primary: content.trim(), deep: "" };
  return {
    primary: lines.slice(0, deepStart).join("\n").trim(),
    deep: lines.slice(deepStart).join("\n").trim(),
  };
};

export const parseDeepBlocks = (content: string): DeepOutlineBlock[] => {
  const { deep } = splitPrimaryAndDeep(content);
  if (!deep) return [];

  const blocks: DeepOutlineBlock[] = [];
  let current: DeepOutlineBlock | null = null;

  for (const raw of deep.split("\n")) {
    const line = raw.trim();
    if (!line) continue;

    const header = line.match(DEEP_HEADER_RE);
    if (header) {
      if (current) blocks.push(current);
      current = { title: (header[1] ?? header[2] ?? "심화").trim(), items: [] };
      continue;
    }

    if (!current) continue;

    if (BULLET_RE.test(line) || line.startsWith("■")) {
      current.items.push(stripBulletPrefix(line));
    } else {
      current.items.push(line);
    }
  }

  if (current) blocks.push(current);
  return blocks;
};

export const stripBulletPrefix = (line: string): string =>
  line.replace(BULLET_RE, "").replace(/^■\s*/, "").trim();

/** 마침표 제거 및 음슴체 정규화 */
export const normalizeOutlineLine = (line: string): string => {
  let text = line.trim().replace(/\.+$/u, "").replace(/。+$/u, "");

  const endings: [RegExp, string][] = [
    [/합니다$/u, "함"],
    [/합니다\.?$/u, "함"],
    [/됩니다$/u, "됨"],
    [/입니다$/u, "임"],
    [/있습니다$/u, "있음"],
    [/없습니다$/u, "없음"],
    [/합니다\s*$/u, "함"],
    [/설계합니다$/u, "설계 추진"],
    [/운영합니다$/u, "운영 예정"],
    [/확보합니다$/u, "확보 목표"],
    [/제공합니다$/u, "제공 예정"],
    [/수립합니다$/u, "수립 추진"],
    [/반영합니다$/u, "반영 예정"],
    [/높였습니다$/u, "강화"],
    [/보강했습니다$/u, "보강"],
  ];

  for (const [pattern, replacement] of endings) {
    if (pattern.test(text)) {
      text = text.replace(pattern, replacement);
      break;
    }
  }

  return text;
};

export const formatDeepBlockHeader = (title: string): string =>
  `■ 심화 — ${normalizeOutlineLine(title)}`;

export const formatOutlineItem = (item: string): string => {
  const normalized = normalizeOutlineLine(item);
  if (/^[·○\-]|\d+\)|■/.test(normalized)) return normalized;
  return `· ${normalized}`;
};

export const normalizeBusinessPlanContent = (content: string): string =>
  content
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return "";
      if (DEEP_HEADER_RE.test(trimmed)) {
        const match = trimmed.match(DEEP_HEADER_RE);
        return formatDeepBlockHeader(match?.[1] ?? match?.[2] ?? "심화");
      }
      if (trimmed.startsWith("【심화")) {
        const title = trimmed.replace(/^【심화\s*[—-]\s*/, "").replace(/】$/, "");
        return formatDeepBlockHeader(title);
      }
      if (BULLET_RE.test(trimmed) || trimmed.startsWith("■")) {
        const prefix = trimmed.match(/^(■|[·○\-]|\d+\))\s*/)?.[0] ?? "· ";
        const body = stripBulletPrefix(trimmed);
        return `${prefix.trimEnd()} ${normalizeOutlineLine(body)}`.replace(/^■\s*/, "■ ");
      }
      return normalizeOutlineLine(trimmed);
    })
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
