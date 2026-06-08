const readNestedName = (relation, field) => {
  if (!relation || typeof relation !== "object") return "—";
  const value = relation[field];
  return typeof value === "string" && value.trim() ? value.trim() : "—";
};

export const extractDiagnosisScore = (reportJson) => {
  if (!reportJson || typeof reportJson !== "object") return null;
  const candidates = [
    reportJson.overallScore,
    reportJson.overall_score,
    reportJson.diagnosisScore,
    reportJson.diagnosis_score,
  ];
  const hit = candidates.find((value) => typeof value === "number");
  return typeof hit === "number" ? Math.round(hit) : null;
};

export const mapCompanyRows = (rows = []) =>
  rows.map((row) => ({
    id: row.id,
    companyName: row.company_name,
    businessNumber: row.business_number,
    industry: row.industry,
    region: row.region,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));

export const mapDiagnosisRows = (rows = []) =>
  rows.map((row) => ({
    id: row.id,
    companyId: row.company_id,
    companyName: readNestedName(row.companies, "company_name"),
    status: row.status,
    overallScore: extractDiagnosisScore(row.report_json),
    model: row.model ?? "—",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));

export const mapMatchingRows = (rows = []) =>
  rows.map((row) => ({
    id: row.id,
    companyId: row.company_id,
    companyName: readNestedName(row.companies, "company_name"),
    programId: row.program_id,
    programTitle: readNestedName(row.support_programs, "title"),
    agency: readNestedName(row.support_programs, "agency"),
    programStatus: row.support_programs?.status ?? null,
    score: row.score,
    recommendationLevel: row.recommendation_level,
    status: row.status,
    reasonCount: Array.isArray(row.reasons) ? row.reasons.length : 0,
    createdAt: row.created_at,
  }));

export const mapBusinessPlanRows = (rows = []) =>
  rows.map((row) => ({
    id: row.id,
    companyId: row.company_id,
    companyName: readNestedName(row.companies, "company_name"),
    programId: row.program_id,
    programTitle: readNestedName(row.support_programs, "title"),
    title: row.title?.trim() || readNestedName(row.support_programs, "title"),
    status: row.status,
    model: row.model ?? "—",
    sectionCount: Array.isArray(row.plan_json?.sections)
      ? row.plan_json.sections.length
      : 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
