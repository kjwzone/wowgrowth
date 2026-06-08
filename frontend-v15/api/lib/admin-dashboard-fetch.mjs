import {
  mapBusinessPlanRows,
  mapCompanyRows,
  mapDiagnosisRows,
  mapMatchingRows,
} from "./admin-dashboard-mappers.mjs";

const emptyProgramCounts = () => ({
  total: 0,
  draft: 0,
  published: 0,
  closed: 0,
});

const emptyJobCounts = () => ({
  total: 0,
  queued: 0,
  running: 0,
  succeeded: 0,
  failed: 0,
});

const isProgramStatus = (value) =>
  value === "draft" || value === "published" || value === "closed";

const isJobStatus = (value) =>
  value === "queued" ||
  value === "running" ||
  value === "succeeded" ||
  value === "failed";

export const countProgramStatuses = (rows) =>
  rows.reduce(
    (acc, row) => {
      if (isProgramStatus(row.status)) {
        acc[row.status] += 1;
      }
      acc.total += 1;
      return acc;
    },
    emptyProgramCounts(),
  );

export const countJobStatuses = (rows) =>
  rows.reduce(
    (acc, row) => {
      if (isJobStatus(row.status)) {
        acc[row.status] += 1;
      }
      acc.total += 1;
      return acc;
    },
    emptyJobCounts(),
  );

export const fetchAdminDashboardDetails = async (supabase) => {
  const [companiesRes, diagnosisRes, matchesRes, plansRes] = await Promise.all([
    supabase
      .from("companies")
      .select("id, company_name, business_number, industry, region, created_at, updated_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("diagnosis_reports")
      .select(
        "id, company_id, status, model, created_at, updated_at, report_json, companies ( company_name )",
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("matching_results")
      .select(
        "id, company_id, program_id, score, recommendation_level, status, reasons, created_at, companies ( company_name ), support_programs ( title, agency, status )",
      )
      .order("score", { ascending: false }),
    supabase
      .from("business_plan_drafts")
      .select(
        "id, company_id, program_id, title, status, model, plan_json, created_at, updated_at, companies ( company_name, profiles!owner_id ( full_name, email ) ), support_programs ( title, agency )",
      )
      .order("updated_at", { ascending: false }),
  ]);

  const errors = [
    companiesRes.error,
    diagnosisRes.error,
    matchesRes.error,
    plansRes.error,
  ].filter(Boolean);

  if (errors.length > 0) {
    throw new Error(errors.map((error) => error.message).join("; "));
  }

  return {
    companies: mapCompanyRows(companiesRes.data ?? []),
    diagnosisReports: mapDiagnosisRows(diagnosisRes.data ?? []),
    matchingResults: mapMatchingRows(matchesRes.data ?? []),
    businessPlans: mapBusinessPlanRows(plansRes.data ?? []),
  };
};

export const fetchAdminDashboardSummary = async (supabase) => {
  const [
    programsRes,
    companiesRes,
    matchesRes,
    diagnosisRes,
    plansRes,
    jobsRes,
    failedJobsRes,
    details,
  ] = await Promise.all([
    supabase.from("support_programs").select("status"),
    supabase.from("companies").select("id", { count: "exact", head: true }),
    supabase.from("matching_results").select("id", { count: "exact", head: true }),
    supabase.from("diagnosis_reports").select("id", { count: "exact", head: true }),
    supabase.from("business_plan_drafts").select("id", { count: "exact", head: true }),
    supabase.from("ai_jobs").select("status"),
    supabase
      .from("ai_jobs")
      .select("id, task_type, error_code, created_at")
      .eq("status", "failed")
      .order("created_at", { ascending: false })
      .limit(5),
    fetchAdminDashboardDetails(supabase),
  ]);

  const errors = [
    programsRes.error,
    companiesRes.error,
    matchesRes.error,
    diagnosisRes.error,
    plansRes.error,
    jobsRes.error,
    failedJobsRes.error,
  ].filter(Boolean);

  if (errors.length > 0) {
    throw new Error(errors.map((error) => error.message).join("; "));
  }

  return {
    programs: countProgramStatuses(programsRes.data ?? []),
    companies: companiesRes.count ?? 0,
    matches: matchesRes.count ?? 0,
    diagnosisReports: diagnosisRes.count ?? 0,
    businessPlans: plansRes.count ?? 0,
    aiJobs: countJobStatuses(jobsRes.data ?? []),
    recentFailedJobs: failedJobsRes.data ?? [],
    details,
  };
};
