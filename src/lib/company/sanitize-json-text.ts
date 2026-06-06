/** PostgreSQL jsonb에 저장 가능한 텍스트로 정화 (PDF 추출 텍스트 등) */
export const sanitizeTextForJsonStorage = (text: string): string => {
  const out: string[] = [];

  for (let i = 0; i < text.length; i += 1) {
    const code = text.charCodeAt(i);

    if (code === 0) continue;

    if (code >= 0xd800 && code <= 0xdbff) {
      const next = text.charCodeAt(i + 1);
      if (next >= 0xdc00 && next <= 0xdfff) {
        const point =
          ((code - 0xd800) << 10) + (next - 0xdc00) + 0x10000;
        out.push(String.fromCodePoint(point));
        i += 1;
        continue;
      }
      continue;
    }

    if (code >= 0xdc00 && code <= 0xdfff) continue;

    if (code < 32 && code !== 9 && code !== 10 && code !== 13) continue;

    out.push(text[i]!);
  }

  return out.join("");
};
