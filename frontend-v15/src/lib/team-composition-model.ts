import type { CompanyProfile, SupportProgram } from "@/types";

export type OrgChartNode = { label: string; detail: string };
export type RepresentativeRow = { label: string; value: string };
export type TeamMemberRow = {
  role: string;
  duty: string;
  capability: string;
  status: string;
};
export type PartnerRow = {
  name: string;
  capability: string;
  plan: string;
  timing: string;
};

export type TeamCompositionPlan = {
  orgChart: OrgChartNode[];
  representative: RepresentativeRow[];
  teamMembers: TeamMemberRow[];
  partners: PartnerRow[];
};

/** 정보 미입력 시 작성 공간 확보용 플레이스홀더 */
export const TEAM_PLACEHOLDER = "[작성 필요]";

const ORG_HEADER = "■ 조직도";
const REP_HEADER = "■ 대표자 역량";
const TEAM_HEADER = "■ 팀 구성(안)";
const PARTNER_HEADER = "■ 협력 기관 현황 및 협업 방안";

const TEAM_TABLE_COLUMNS = ["직책", "담당 업무", "보유 역량", "구성 상태"] as const;
const PARTNER_TABLE_COLUMNS = [
  "파트너명",
  "보유 역량",
  "협업 방안",
  "협업 시기",
] as const;

export const TEAM_COMPOSITION_COLUMNS = {
  team: TEAM_TABLE_COLUMNS,
  partner: PARTNER_TABLE_COLUMNS,
} as const;

const ORG_DELIMITER = "::";

type TeamBlockKey = "org" | "rep" | "team" | "partner";

const matchTeamHeader = (line: string): TeamBlockKey | null => {
  const text = line.replace(/^■\s*/, "").trim();
  if (text.startsWith("조직도")) return "org";
  if (text.startsWith("대표자")) return "rep";
  if (text.startsWith("팀 구성") || text.startsWith("팀구성")) return "team";
  if (text.includes("협력")) return "partner";
  return null;
};

export const hasTeamComposition = (content: string): boolean =>
  content.split("\n").some((line) => matchTeamHeader(line.trim()) !== null);

const stripOrgBullet = (line: string): string =>
  line.replace(/^[·○▪◦\-*]\s*/, "").trim();

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
    : [
        { label: "학력", value: TEAM_PLACEHOLDER },
        { label: "주요 경력", value: TEAM_PLACEHOLDER },
        { label: "주요 실적", value: TEAM_PLACEHOLDER },
        { label: "주요 역량", value: TEAM_PLACEHOLDER },
      ];
  repRows.forEach((row) => lines.push(`| ${row.label} | ${row.value} |`));

  lines.push(TEAM_HEADER);
  lines.push(`| ${TEAM_TABLE_COLUMNS.join(" | ")} |`);
  const teamRows = plan.teamMembers.length
    ? plan.teamMembers
    : [
        {
          role: TEAM_PLACEHOLDER,
          duty: TEAM_PLACEHOLDER,
          capability: TEAM_PLACEHOLDER,
          status: TEAM_PLACEHOLDER,
        },
      ];
  teamRows.forEach((row) =>
    lines.push(`| ${row.role} | ${row.duty} | ${row.capability} | ${row.status} |`),
  );

  lines.push(PARTNER_HEADER);
  lines.push(`| ${PARTNER_TABLE_COLUMNS.join(" | ")} |`);
  const partnerRows = plan.partners.length
    ? plan.partners
    : [
        {
          name: TEAM_PLACEHOLDER,
          capability: TEAM_PLACEHOLDER,
          plan: TEAM_PLACEHOLDER,
          timing: TEAM_PLACEHOLDER,
        },
      ];
  partnerRows.forEach((row) =>
    lines.push(`| ${row.name} | ${row.capability} | ${row.plan} | ${row.timing} |`),
  );

  return lines.join("\n");
};

export const parseTeamCompositionPlan = (
  content: string,
): TeamCompositionPlan => {
  const plan: TeamCompositionPlan = {
    orgChart: [],
    representative: [],
    teamMembers: [],
    partners: [],
  };

  let current: TeamBlockKey | null = null;
  let teamHeaderSeen = false;
  let partnerHeaderSeen = false;

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
      const body = stripOrgBullet(line);
      if (!body) continue;
      const [label, ...rest] = body.split(ORG_DELIMITER);
      plan.orgChart.push({
        label: label?.trim() ?? body,
        detail: rest.join(ORG_DELIMITER).trim(),
      });
      continue;
    }

    const cells = parsePipeRow(line);
    if (!cells) continue;

    if (current === "rep") {
      plan.representative.push({
        label: cells[0] ?? "",
        value: cells.slice(1).join(" / ").trim(),
      });
    } else if (current === "team") {
      const isHeaderRow =
        !teamHeaderSeen && cells[0] === TEAM_TABLE_COLUMNS[0];
      teamHeaderSeen = true;
      if (isHeaderRow) continue;
      plan.teamMembers.push({
        role: cells[0] ?? "",
        duty: cells[1] ?? "",
        capability: cells[2] ?? "",
        status: cells[3] ?? "",
      });
    } else if (current === "partner") {
      const isHeaderRow =
        !partnerHeaderSeen && cells[0] === PARTNER_TABLE_COLUMNS[0];
      partnerHeaderSeen = true;
      if (isHeaderRow) continue;
      plan.partners.push({
        name: cells[0] ?? "",
        capability: cells[1] ?? "",
        plan: cells[2] ?? "",
        timing: cells[3] ?? "",
      });
    }
  }

  return plan;
};

export const isPlaceholderValue = (value: string): boolean =>
  !value.trim() || value.trim() === TEAM_PLACEHOLDER;

export const isPlaceholderRow = (values: string[]): boolean =>
  values.every((value) => isPlaceholderValue(value));

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
    teamMembers: [
      {
        role: "AI 개발",
        duty: "모델·Skill 파이프라인 개발",
        capability: `AI 엔지니어 ${aiHeadcount}명`,
        status: "재직",
      },
      {
        role: "백엔드 개발",
        duty: "API·인프라·보안",
        capability: "Backend 엔지니어",
        status: "재직",
      },
      {
        role: "사업화 PM",
        duty: "공고 대응·사업화 전략",
        capability: "정부지원 도메인 PM",
        status: "[채용 예정]",
      },
      {
        role: "ML Engineer",
        duty: "모델 고도화·평가",
        capability: "ML 전문 인력",
        status: "[채용 예정]",
      },
    ],
    partners: [
      {
        name: program?.agency ?? TEAM_PLACEHOLDER,
        capability: "공고 주관·멘토링·심사",
        plan: "설명회·멘토링·중간점검 대응",
        timing: program?.period ?? TEAM_PLACEHOLDER,
      },
      {
        name: TEAM_PLACEHOLDER,
        capability: TEAM_PLACEHOLDER,
        plan: TEAM_PLACEHOLDER,
        timing: TEAM_PLACEHOLDER,
      },
    ],
  };
};
