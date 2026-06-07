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

export const fetchAdminDashboardSummary = async (supabase) => {
  const [
    programsRes,
    companiesRes,
    matchesRes,
    diagnosisRes,
    plansRes,
    pendingReviewsRes,
    jobsRes,
    failedJobsRes,
    pendingItemsRes,
  ] = await Promise.all([
    supabase.from("support_programs").select("status"),
    supabase.from("companies").select("id", { count: "exact", head: true }),
    supabase.from("matching_results").select("id", { count: "exact", head: true }),
    supabase.from("diagnosis_reports").select("id", { count: "exact", head: true }),
    supabase.from("business_plan_drafts").select("id", { count: "exact", head: true }),
    supabase
      .from("program_metadata")
      .select("id", { count: "exact", head: true })
      .in("status", ["reviewing", "draft"]),
    supabase.from("ai_jobs").select("status"),
    supabase
      .from("ai_jobs")
      .select("id, task_type, error_code, created_at")
      .eq("status", "failed")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("program_metadata")
      .select("id, program_id, extracted_fields, created_at")
      .in("status", ["reviewing", "draft"])
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const errors = [
    programsRes.error,
    companiesRes.error,
    matchesRes.error,
    diagnosisRes.error,
    plansRes.error,
    pendingReviewsRes.error,
    jobsRes.error,
    failedJobsRes.error,
    pendingItemsRes.error,
  ].filter(Boolean);

  if (errors.length > 0) {
    throw new Error(errors.map((error) => error.message).join("; "));
  }

  const programIds = [
    ...new Set((pendingItemsRes.data ?? []).map((item) => item.program_id)),
  ];
  const programMap = new Map();

  if (programIds.length > 0) {
    const { data: programs, error } = await supabase
      .from("support_programs")
      .select("id, title")
      .in("id", programIds);

    if (error) {
      throw new Error(error.message);
    }

    (programs ?? []).forEach((program) => {
      programMap.set(program.id, program.title);
    });
  }

  const pendingReviewItems = (pendingItemsRes.data ?? []).map((item) => {
    const fields = item.extracted_fields;
    const titleFromFields =
      fields && typeof fields === "object" && "title" in fields
        ? fields.title
        : undefined;

    return {
      id: item.id,
      title: titleFromFields ?? programMap.get(item.program_id) ?? "제목 없음",
      created_at: item.created_at,
    };
  });

  return {
    programs: countProgramStatuses(programsRes.data ?? []),
    companies: companiesRes.count ?? 0,
    matches: matchesRes.count ?? 0,
    diagnosisReports: diagnosisRes.count ?? 0,
    businessPlans: plansRes.count ?? 0,
    pendingReviews: pendingReviewsRes.count ?? 0,
    aiJobs: countJobStatuses(jobsRes.data ?? []),
    recentFailedJobs: failedJobsRes.data ?? [],
    pendingReviewItems,
  };
};
