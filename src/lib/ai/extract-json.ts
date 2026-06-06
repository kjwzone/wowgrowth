/** Gemini 응답에서 JSON 객체 추출 (mermaid·마크다운 혼입 대응) */

const extractBalancedObject = (text: string, start: number): string | null => {
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < text.length; i += 1) {
    const char = text[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (inString && char === "\\") {
      escaped = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;

    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null;
};

const tryParse = (candidate: string): unknown | null => {
  try {
    return JSON.parse(candidate);
  } catch {
    return null;
  }
};

export const extractJsonFromText = (text: string): unknown => {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new SyntaxError("empty response");
  }

  const direct = tryParse(trimmed);
  if (direct !== null) return direct;

  const fencedBlocks = [...trimmed.matchAll(/```(?:json)?\s*([\s\S]*?)```/gi)];
  for (const match of fencedBlocks) {
    const block = match[1]?.trim() ?? "";
    if (!block.startsWith("{")) continue;
    const parsed = tryParse(block);
    if (parsed !== null) return parsed;
    const balanced = extractBalancedObject(block, 0);
    if (balanced) {
      const parsedBalanced = tryParse(balanced);
      if (parsedBalanced !== null) return parsedBalanced;
    }
  }

  const firstBrace = trimmed.indexOf("{");
  if (firstBrace >= 0) {
    const balanced = extractBalancedObject(trimmed, firstBrace);
    if (balanced) {
      const parsed = tryParse(balanced);
      if (parsed !== null) return parsed;
    }
  }

  return JSON.parse(trimmed);
};

export const JSON_ONLY_RESPONSE_SUFFIX = [
  "[출력 형식 — 필수]",
  "응답은 반드시 단일 JSON 객체 하나만 출력한다.",
  "첫 문자는 {, 마지막 문자는 } 이어야 한다.",
  "mermaid, flowchart, ``` 코드펜스, 조직도 다이어그램 문법, 설명 문장을 출력하지 말 것.",
  "표·개조식은 JSON 문자열 필드(content) 안에만 넣는다.",
].join("\n");
