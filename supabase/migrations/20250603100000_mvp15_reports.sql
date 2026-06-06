-- MVP-1.5: diagnosis_reports, business_plan_drafts

create table public.diagnosis_reports (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  schema_version text not null default 'v1',
  model text not null,
  prompt_version text not null,
  status text not null default 'reviewing'
    check (status in ('draft', 'reviewing', 'approved', 'rejected')),
  report_json jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_diagnosis_reports_company_id on public.diagnosis_reports (company_id);
create index idx_diagnosis_reports_status on public.diagnosis_reports (status);

create trigger diagnosis_reports_updated_at
  before update on public.diagnosis_reports
  for each row execute function public.handle_updated_at();

create table public.business_plan_drafts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  program_id uuid not null references public.support_programs (id) on delete cascade,
  matching_result_id uuid references public.matching_results (id) on delete set null,
  schema_version text not null default 'v1',
  model text not null,
  prompt_version text not null,
  status text not null default 'reviewing'
    check (status in ('draft', 'reviewing', 'approved', 'rejected')),
  title text not null default '',
  plan_json jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, program_id)
);

create index idx_business_plan_drafts_company_id on public.business_plan_drafts (company_id);
create index idx_business_plan_drafts_program_id on public.business_plan_drafts (program_id);

create trigger business_plan_drafts_updated_at
  before update on public.business_plan_drafts
  for each row execute function public.handle_updated_at();

-- Extend ai_jobs constraints
alter table public.ai_jobs drop constraint if exists ai_jobs_task_type_check;
alter table public.ai_jobs add constraint ai_jobs_task_type_check
  check (task_type in (
    'announcement_summary',
    'announcement_metadata',
    'recommendation_reasoning',
    'diagnosis_draft',
    'plan_draft'
  ));

alter table public.ai_jobs drop constraint if exists ai_jobs_target_type_check;
alter table public.ai_jobs add constraint ai_jobs_target_type_check
  check (target_type in (
    'support_programs',
    'matching_results',
    'diagnosis_reports',
    'business_plan_drafts'
  ));

alter table public.review_logs drop constraint if exists review_logs_review_target_type_check;
alter table public.review_logs add constraint review_logs_review_target_type_check
  check (review_target_type in (
    'program_metadata',
    'matching_results',
    'diagnosis_reports',
    'business_plan_drafts'
  ));

alter table public.diagnosis_reports enable row level security;
alter table public.business_plan_drafts enable row level security;

create policy diagnosis_reports_select
  on public.diagnosis_reports for select to authenticated
  using (
    exists (
      select 1 from public.companies c
      where c.id = company_id and c.owner_id = auth.uid()
    )
    or public.is_admin_or_reviewer()
  );

create policy diagnosis_reports_insert_own
  on public.diagnosis_reports for insert to authenticated
  with check (
    exists (
      select 1 from public.companies c
      where c.id = company_id and c.owner_id = auth.uid()
    )
    or public.is_admin()
  );

create policy diagnosis_reports_update
  on public.diagnosis_reports for update to authenticated
  using (
    exists (
      select 1 from public.companies c
      where c.id = company_id and (c.owner_id = auth.uid() or public.is_admin_or_reviewer())
    )
  );

create policy business_plan_drafts_select
  on public.business_plan_drafts for select to authenticated
  using (
    exists (
      select 1 from public.companies c
      where c.id = company_id and c.owner_id = auth.uid()
    )
    or public.is_admin_or_reviewer()
  );

create policy business_plan_drafts_insert_own
  on public.business_plan_drafts for insert to authenticated
  with check (
    exists (
      select 1 from public.companies c
      where c.id = company_id and c.owner_id = auth.uid()
    )
    or public.is_admin()
  );

create policy business_plan_drafts_update
  on public.business_plan_drafts for update to authenticated
  using (
    exists (
      select 1 from public.companies c
      where c.id = company_id and (c.owner_id = auth.uid() or public.is_admin_or_reviewer())
    )
  );

grant select, insert, update on public.diagnosis_reports to authenticated;
grant select, insert, update on public.business_plan_drafts to authenticated;
