import type { CompanyProfile, SupportProgram } from "@/types";

export type OrgChartNode = { label: string; detail: string };
export type RepresentativeRow = { label: string; value: string };
export type TeamTable = { columns: string[]; rows: string[][] };

export type TeamCompositionPlan = {
  orgChart: OrgChartNode[];
  representative: RepresentativeRow[];
  team: TeamTable;
  partners: TeamTable;
};

/** 정보 미입력 시 작성 공간 확보용 플레이스홀더 */
export const TEAM_PLACEHOLDER = "[작성 필요]";

const ORG_HEADER = "■ 조직도";
const REP_HEADER = "■ 대표자 역량";
const TEAM_HEADER = "■ 팀 구성(안)";
const PARTNER_HEADER = "■ 협력 기관 현황 및 협업 방안";

const TEAM_DEFAULT_COLUMNS = ["직책", "담당 업무", "보유 역량", "구성 상태"];
const PARTNER_DEFAULT_COLUMNS = [
  "파트너명",
  "보유 역량",
  "협업 방안",
  "협업 시기",
];

export const TEAM_COMPOSITION_COLUMNS = {
  team: TEAM_DEFAULT_COLUMNS,
  partner: PARTNER_DEFAULT_COLUMNS,
} as const;

const ORG_DELIMITER = "::";

type TeamBlockKey = "org" | "rep" | "team" | "partner";

const HEADER_KEYWORD_RULES: { key: TeamBlockKey; test: RegExp }[] = [
  { key: "org", test: /조직도|조직\s*구성|조직\s*체계/ },
  { key: "partner", test: /협력|협업|파트너/ },
  { key: "rep", test: /대표자|대표\s*역량|경영진|대표\s*이력/ },
  { key: "team", test: /팀\s*구성|팀구성|팀원|인력\s*구성|구성\(?안\)?/ },
];

/** 머리글 장식(#, ■, 숫자, *, 〈 〉 등) 제거 후 핵심 텍스트만 추출 */
const stripHeadingDecoration = (line: string): string =>
  line
    .replace(/^[^가-힣A-Za-z]+/u, "")
    .replace(/[\s*#:)\]】〉>]+$/u, "")
    .trim();

const matchTeamHeader = (line: string): TeamBlockKey | null => {
  if (line.includes("|")) return null;
  const text = stripHeadingDecoration(line);
  if (!text || text.length > 40) return null;
  for (const rule of HEADER_KEYWORD_RULES) {
    if (rule.test.test(text)) return rule.key;
  }
  return null;
};

export const hasTeamComposition = (content: string): boolean =>
  content.split("\n").some((line) => matchTeamHeader(line.trim()) !== null);

const stripOrgBullet = (line: string): string =>
  line.replace(/^[·○▪◦▶\-*]\s*/u, "").trim();

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

const tableFromRows = (rows: string[][]): TeamTable => {
  if (rows.length === 0) return { columns: [], rows: [] };
  return { columns: rows[0]!, rows: rows.slice(1) };
};

export const isPlaceholderValue = (value: string): boolean =>
  !value.trim() || value.trim() === TEAM_PLACEHOLDER;

export const isPlaceholderRow = (values: string[]): boolean =>
  values.every((value) => isPlaceholderValue(value));

export const tableIsEmpty = (table: TeamTable): boolean =>
  table.rows.length === 0 || table.rows.every((row) => isPlaceholderRow(row));

export const serializeTeamCompositionPlan = (
  plan: TeamCompositionPlan,
): string => {
  const lines: string[] = [];

  lines.push(ORG_HEADER);
  const orgNodes = plan.orgChart.length
    ? plan.orgChart
    : [{ label: TEAM_PLACEHOLDER, detail: TEAM_PLACEHOLDER }];
  orgNodes.forEach((node) =>
    lines.push(`· ${node.label} ${ORG_DELIMITER} ${node.detail}`),
  );

  lines.push(REP_HEADER);
  const repRows = plan.representative.length
    ? plan.representative
    : [{ label: "구분", value: TEAM_PLACEHOLDER }];
  repRows.forEach((row) => lines.push(`| ${row.label} | ${row.value} |`));

  const pushTable = (header: string, table: TeamTable, fallback: string[]) => {
    lines.push(header);
    const columns = table.columns.length ? table.columns : fallback;
    lines.push(`| ${columns.join(" | ")} |`);
    const rows = table.rows.length
      ? table.rows
      : [columns.map(() => TEAM_PLACEHOLDER)];
    rows.forEach((row) => lines.push(`| ${row.join(" | ")} |`));
  };

  pushTable(TEAM_HEADER, plan.team, TEAM_DEFAULT_COLUMNS);
  pushTable(PARTNER_HEADER, plan.partners, PARTNER_DEFAULT_COLUMNS);

  return lines.join("\n");
};

export const parseTeamCompositionPlan = (
  content: string,
): TeamCompositionPlan => {
  const orgChart: OrgChartNode[] = [];
  const representative: RepresentativeRow[] = [];
  const repSpillover: string[][] = [];
  const teamRows: string[][] = [];
  const partnerRows: string[][] = [];

  let current: TeamBlockKey | null = null;

  for (const raw of content.split("\n")) {
    const line = raw.trim();
    if (!line) continue;

    const header = matchTeamHeader(line);
    if (header) {
      current = header;
      continue;
    }
    if (!current) continue;

    if (current === "org") {
      const cells = parsePipeRow(line);
      if (cells) {
        orgChart.push({
          label: cells[0] ?? "",
          detail: cells.slice(1).join(" · ").trim(),
        });
        continue;
      }
      const body = stripOrgBullet(line);
      if (!body) continue;
      const [label, ...rest] = body.split(ORG_DELIMITER);
      orgChart.push({
        label: (label ?? body).trim(),
        detail: rest.join(ORG_DELIMITER).trim(),
      });
      continue;
    }

    const cells = parsePipeRow(line);
    if (!cells) continue;

    if (current === "rep") {
      if (cells.length === 2) {
        representative.push({ label: cells[0] ?? "", value: cells[1] ?? "" });
      } else {
        // 대표자 역량 블록에 다열 표(팀 구성)가 섞인 경우 → 팀 표로 분리
        repSpillover.push(cells);
      }
    } else if (current === "team") {
      teamRows.push(cells);
    } else if (current === "partner") {
      partnerRows.push(cells);
    }
  }

  const team =
    teamRows.length > 0 ? tableFromRows(teamRows) : tableFromRows(repSpillover);

  return {
    orgChart,
    representative,
    team,
    partners: tableFromRows(partnerRows),
  };
};

/** 정보 미입력 블록을 채우기 위한 가상(예시) 샘플 데이터 */
export const virtualTeamCompositionSample = (): TeamCompositionPlan => ({
  orgChart: [
    { label: "대표이사 (CEO)", detail: "경영 총괄·전략·투자 유치" },
    { label: "CTO", detail: "기술 개발 총괄·아키텍처" },
    { label: "CPO", detail: "제품 기획·UX 총괄" },
    { label: "COO", detail: "운영·사업화 총괄" },
    { label: "AI 팀", detail: "모델 개발·MLOps" },
    { label: "백엔드 팀", detail: "API·인프라·보안" },
    { label: "디자인 팀", detail: "UX/UI·브랜딩" },
    { label: "마케팅 팀", detail: "그로스·B2B 세일즈" },
  ],
  representative: [
    { label: "학력", value: "○○대학교 컴퓨터공학 학사 (예시)" },
    { label: "주요 경력", value: "前 ○○테크 AI 개발팀장 (8년) (예시)" },
    {
      label: "주요 실적",
      value: "AI SaaS 2건 출시·누적 사용자 5만+ (예시)",
    },
    {
      label: "주요 역량",
      value: "AI/ML·사업 전략·정부지원사업 수행 (예시)",
    },
  ],
  team: {
    columns: TEAM_DEFAULT_COLUMNS,
    rows: [
      [
        "대표이사 (CEO)",
        "경영 총괄·전략·투자 유치 — 전사 방향 결정",
        "前 ○○테크 창업·AI 사업 10년 (예시)",
        "재직",
      ],
      [
        "CTO",
        "AI 모델·아키텍처 설계 총괄 — 핵심 기술 리딩",
        "ML 10년·딥러닝 서비스 출시·정보처리기사 (예시)",
        "재직",
      ],
      [
        "개발팀장",
        "백엔드·인프라·보안 개발 리딩 — 플랫폼 운영",
        "분산시스템 8년·AWS SA 자격·SaaS 구축 이력 (예시)",
        "재직",
      ],
      [
        "CPO (이사)",
        "제품 기획·UX·로드맵 관리 — 사용자 경험 총괄",
        "B2B SaaS PM 6년·서비스 2건 PMF 달성 (예시)",
        "재직",
      ],
      [
        "ML 엔지니어",
        "모델 고도화·평가·MLOps — 모델 품질 개선",
        "NLP/LLM 연구·논문 2편·Kaggle Expert (예시)",
        "채용 예정",
      ],
    ],
  },
  partners: {
    columns: PARTNER_DEFAULT_COLUMNS,
    rows: [
      ["○○대학교 산학협력단", "AI 연구 인프라", "공동 연구·실증", "2026 상반기"],
      ["○○클라우드", "GPU·클라우드 인프라", "기술 지원·크레딧", "협약 기간"],
      ["○○액셀러레이터", "투자·창업 네트워크", "멘토링·IR 연계", "2026 하반기"],
    ],
  },
});

export const buildTeamCompositionPlan = (
  company: Pick<
    CompanyProfile,
    "name" | "industry" | "product" | "employees" | "patents" | "certifications"
  >,
  program: SupportProgram | undefined,
): TeamCompositionPlan => {
  const aiHeadcount = Math.max(1, Math.floor(company.employees / 3));

  return {
    orgChart: [
      { label: `대표이사 — ${company.name} 대표`, detail: "경영총괄·전략·IR" },
      { label: "AI Lead", detail: "모델·Skill 파이프라인 개발" },
      { label: "Backend Lead", detail: "API·데이터·보안 운영" },
      { label: "사업화 PM", detail: "공고 대응·일정·품질 관리" },
      { label: "CS", detail: "고객 온보딩·VOC 대응" },
    ],
    representative: [
      { label: "학력", value: TEAM_PLACEHOLDER },
      { label: "주요 경력", value: TEAM_PLACEHOLDER },
      {
        label: "주요 실적",
        value: company.patents.length
          ? company.patents.join(" · ")
          : TEAM_PLACEHOLDER,
      },
      {
        label: "주요 역량",
        value: `${company.industry} · ${company.product}`,
      },
    ],
    team: {
      columns: TEAM_DEFAULT_COLUMNS,
      rows: [
        [
          "대표이사 (CEO)",
          "경영 총괄·전략·IR — 사업 방향 수립 및 투자 유치 총괄",
          `${company.industry} 사업 10년+ · AI SaaS 창업·Series A 준비 이력`,
          "재직",
        ],
        [
          "CTO",
          "AI 모델·Skill 파이프라인 개발 총괄 — 핵심 기술 아키텍처 설계",
          "AI/ML 서비스 개발 경력 · 딥러닝 서비스 상용화 포트폴리오",
          "재직",
        ],
        [
          "개발팀장",
          "백엔드 API·데이터·인프라·보안 운영 — 플랫폼 안정성 관리",
          `분산시스템·클라우드(AWS) 구축 이력 · 개발 인력 ${aiHeadcount}명 리딩`,
          "재직",
        ],
        [
          "사업화 PM (이사)",
          "공고 대응·사업화 전략·일정/품질 관리 — 정부지원사업 PM",
          "정부지원사업 다수 수행 · 사업화 도메인 PM 경력",
          "[채용 예정]",
        ],
        [
          "ML Engineer",
          "모델 고도화·평가·MLOps — 매칭/생성 품질 개선",
          "NLP/LLM 연구 · 모델 서빙·평가 포트폴리오",
          "[채용 예정]",
        ],
      ],
    },
    partners: {
      columns: PARTNER_DEFAULT_COLUMNS,
      rows: [
        [
          program?.agency ?? TEAM_PLACEHOLDER,
          "공고 주관·멘토링·심사",
          "설명회·멘토링·중간점검 대응",
          program?.period ?? TEAM_PLACEHOLDER,
        ],
        [TEAM_PLACEHOLDER, TEAM_PLACEHOLDER, TEAM_PLACEHOLDER, TEAM_PLACEHOLDER],
      ],
    },
  };
};
