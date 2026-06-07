import { splitPrimaryAndDeep, stripBulletPrefix } from "@/lib/business-plan-outline";

export type KeyValueItem = { key: string; value: string };
export type TagBlock = { tag: string; text: string };

export const parseContentLines = (content: string): string[] =>
  content
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

export const parseKeyValueItems = (lines: readonly string[]): KeyValueItem[] =>
  lines.flatMap((line) => {
    const match = line.match(/^■\s*(.+?):\s*(.+)$/);
    return match ? [{ key: match[1]!.trim(), value: match[2]!.trim() }] : [];
  });

export const parseTagBlocks = (content: string): TagBlock[] => {
  const lines = parseContentLines(content);
  return lines.flatMap((line) => {
    const match = line.match(/^【([^】]+)】\s*(.+)$/);
    return match ? [{ tag: match[1]!.trim(), text: match[2]!.trim() }] : [];
  });
};

export const parseBulletItems = (lines: readonly string[]): string[] => {
  const primaryLines = splitPrimaryAndDeep(lines.join("\n")).primary
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return primaryLines
    .map((line) => stripBulletPrefix(line).replace(/^【[^】]+】\s*/, "").trim())
    .filter(
      (line) =>
        line.length > 0 &&
        !/^심화\s*[—-]/.test(line) &&
        !line.includes("[사업비 요약]") &&
        !line.includes("[비목]"),
    );
};

export const parsePercentages = (content: string): { name: string; value: number }[] => {
  const items: { name: string; value: number }[] = [];
  for (const line of parseContentLines(content)) {
    const match = line.match(/^■\s*(.+?)\((\d+)%\)/);
    if (match) {
      items.push({ name: match[1]!.trim(), value: Number(match[2]) });
    }
  }
  return items;
};

export const parseTamSamSom = (
  content: string,
): { label: string; value: number }[] | null => {
  const line = parseContentLines(content).find((item) => /TAM\/SAM\/SOM/i.test(item));
  if (!line) return null;

  const numbers = [...line.matchAll(/([\d,]+)\s*万?社?/g)].map((m) =>
    Number(m[1]!.replace(/,/g, "")),
  );
  if (numbers.length < 3) {
    return [
      { label: "TAM", value: 400 },
      { label: "SAM", value: 50 },
      { label: "SOM", value: 5 },
    ];
  }

  return [
    { label: "TAM", value: numbers[0]! },
    { label: "SAM", value: numbers[1]! },
    { label: "SOM", value: numbers[2]! },
  ];
};

export const parseTimelinePhases = (content: string): { phase: string; detail: string }[] => {
  const phases: { phase: string; detail: string }[] = [];
  for (const line of parseContentLines(content)) {
    const match = line.match(/Phase\s*(\d+)[^:]*:\s*(.+)/i);
    if (match) {
      phases.push({ phase: `Phase ${match[1]}`, detail: match[2]!.trim() });
      continue;
    }
    const quarter = line.match(/■\s*(20\d{2}\s*Q\d[^:]*):\s*(.+)/);
    if (quarter) {
      phases.push({ phase: quarter[1]!.trim(), detail: quarter[2]!.trim() });
    }
  }
  return phases;
};
