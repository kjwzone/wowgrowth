export type DiagramContext = {
  companyName: string;
  product: string;
  programTitle: string;
};

export type BusinessPlanDiagram = {
  id: "bm" | "system" | "mvp";
  caption: string;
  svg: string;
};

const BLUE = "#0040e0";
const INK = "#031635";
const GRAY = "#64748b";
const LIGHT = "#e2e8f0";

const box = (
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  fill = "#ffffff",
  stroke = INK,
): string => `
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>
  <text x="${x + w / 2}" y="${y + h / 2 + 5}" text-anchor="middle" font-size="12" font-family="'Noto Sans KR', sans-serif" fill="${INK}">${label}</text>`;

const arrow = (x1: number, y1: number, x2: number, y2: number): string =>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${BLUE}" stroke-width="2" marker-end="url(#arrow)"/>`;

const wrapSvg = (body: string, title: string): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 420" role="img" aria-label="${title}">
  <defs>
    <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
      <path d="M0,0 L6,3 L0,6 Z" fill="${BLUE}"/>
    </marker>
  </defs>
  <rect width="720" height="420" fill="#ffffff"/>
  ${body}
</svg>`;

export const buildBmDiagramSvg = ({ companyName, product, programTitle }: DiagramContext): string => {
  const body = `
  <text x="360" y="28" text-anchor="middle" font-size="14" font-weight="700" fill="${INK}" font-family="'Noto Sans KR', sans-serif">BM 구성도 — ${programTitle.slice(0, 24)}</text>
  ${box(280, 150, 160, 56, "가치 제안", "#f0f4ff", BLUE)}
  ${box(40, 60, 130, 48, "고객 세그먼트")}
  ${box(40, 170, 130, 48, "고객 고통")}
  ${box(40, 280, 130, 48, "채널")}
  ${box(550, 60, 130, 48, "수익 모델")}
  ${box(550, 170, 130, 48, "핵심 자원")}
  ${box(550, 280, 130, 48, "파트너")}
  ${arrow(170, 84, 280, 170)}
  ${arrow(170, 194, 280, 185)}
  ${arrow(170, 304, 280, 200)}
  ${arrow(440, 170, 550, 84)}
  ${arrow(440, 178, 550, 194)}
  ${arrow(440, 186, 550, 304)}
  <text x="360" y="380" text-anchor="middle" font-size="11" fill="${GRAY}" font-family="'Noto Sans KR', sans-serif">${companyName} · ${product.slice(0, 36)}</text>`;
  return wrapSvg(body, "BM 구성도");
};

export const buildSystemDiagramSvg = ({ companyName, product }: DiagramContext): string => {
  const body = `
  <text x="360" y="28" text-anchor="middle" font-size="14" font-weight="700" fill="${INK}" font-family="'Noto Sans KR', sans-serif">시스템 구성도</text>
  ${box(40, 80, 120, 44, "웹 UI")}
  ${box(40, 160, 120, 44, "사업계획서")}
  ${box(40, 240, 120, 44, "관리자 검수")}
  ${box(220, 140, 140, 56, "API Gateway", "#f0f4ff", BLUE)}
  ${box(420, 60, 130, 44, "공고 분석")}
  ${box(420, 130, 130, 44, "계획서 생성")}
  ${box(420, 200, 130, 44, "예산·검증")}
  ${box(420, 270, 130, 44, "Gemini LLM")}
  ${box(590, 100, 110, 44, "기업마당 API")}
  ${box(590, 220, 110, 44, "Supabase")}
  ${arrow(160, 102, 220, 160)}
  ${arrow(160, 182, 220, 168)}
  ${arrow(160, 262, 220, 176)}
  ${arrow(360, 168, 420, 82)}
  ${arrow(360, 168, 420, 152)}
  ${arrow(360, 168, 420, 222)}
  ${arrow(550, 222, 590, 122)}
  ${arrow(550, 242, 590, 242)}
  <text x="360" y="380" text-anchor="middle" font-size="11" fill="${GRAY}" font-family="'Noto Sans KR', sans-serif">${companyName} · ${product.slice(0, 40)} Agent 파이프라인</text>`;
  return wrapSvg(body, "시스템 구성도");
};

export const buildMvpPreviewSvg = ({ programTitle }: DiagramContext): string => {
  const body = `
  <text x="360" y="28" text-anchor="middle" font-size="14" font-weight="700" fill="${INK}" font-family="'Noto Sans KR', sans-serif">MVP 예상 화면</text>
  <rect x="80" y="50" width="560" height="300" rx="10" fill="#ffffff" stroke="${INK}" stroke-width="2"/>
  <rect x="80" y="50" width="560" height="36" fill="${INK}"/>
  <text x="360" y="73" text-anchor="middle" font-size="12" fill="#ffffff" font-family="'Noto Sans KR', sans-serif">WOW Growth — ${programTitle.slice(0, 28)}</text>
  <rect x="96" y="100" width="120" height="220" fill="${LIGHT}" stroke="${LIGHT}"/>
  <text x="156" y="120" text-anchor="middle" font-size="10" fill="${GRAY}" font-family="'Noto Sans KR', sans-serif">공고·매칭</text>
  ${box(240, 110, 180, 40, "AI 초안 생성", "#f0f4ff", BLUE)}
  ${box(440, 110, 180, 40, "사업비 표")}
  ${box(240, 170, 380, 120, "통합 미리보기 · 표·차트", "#ffffff", BLUE)}
  ${box(240, 310, 180, 36, "제출 준비 검증")}
  ${box(440, 310, 180, 36, "HTML 내보내기")}
  <text x="360" y="395" text-anchor="middle" font-size="11" fill="${GRAY}" font-family="'Noto Sans KR', sans-serif">인포그래픽 · 플랫 · 벡터 · 화이트 배경</text>`;
  return wrapSvg(body, "MVP 예상도");
};

export const buildBusinessPlanDiagrams = (ctx: DiagramContext): BusinessPlanDiagram[] => [
  { id: "bm", caption: "BM 구성도", svg: buildBmDiagramSvg(ctx) },
  { id: "system", caption: "시스템 구성도", svg: buildSystemDiagramSvg(ctx) },
  { id: "mvp", caption: "MVP 예상도", svg: buildMvpPreviewSvg(ctx) },
];
