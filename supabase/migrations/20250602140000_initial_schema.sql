-- WOW Growth Platform MVP-1: initial schema
-- Ref: docs/db-schema.md

-- ---------------------------------------------------------------------------
-- Helpers (no table dependencies)
-- ---------------------------------------------------------------------------

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  role text not null default 'user'
    check (role in ('user', 'admin', 'reviewer')),
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_profiles_role on public.profiles (role);

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  company_name text not null,
  business_number text not null unique,
  industry text not null,
  region text not null,
  founded_year int check (founded_year is null or founded_year between 1800 and 2100),
  certifications jsonb not null default '[]'::jsonb,
  patents jsonb not null default '[]'::jsonb,
  financials jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_companies_owner_id on public.companies (owner_id);
create index idx_companies_region_industry on public.companies (region, industry);

create table public.support_programs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  agency text not null,
  category text,
  region text,
  application_start_date date,
  application_end_date date,
  status text not null default 'draft'
    check (status in ('draft', 'published', 'closed')),
  content_raw text,
  created_by uuid not null references public.profiles (id) on delete restrict,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_support_programs_status on public.support_programs (status);
create index idx_support_programs_region_category on public.support_programs (region, category);
create index idx_support_programs_application_end_date on public.support_programs (application_end_date);

create table public.ai_jobs (
  id uuid primary key default gen_random_uuid(),
  task_type text not null
    check (task_type in (
      'announcement_summary',
      'announcement_metadata',
      'recommendation_reasoning'
    )),
  target_type text not null
    check (target_type in ('support_programs', 'matching_results')),
  target_id uuid not null,
  status text not null default 'queued'
    check (status in ('queued', 'running', 'succeeded', 'failed')),
  attempt_count int not null default 0 check (attempt_count >= 0),
  error_code text,
  error_message text,
  requested_by uuid not null references public.profiles (id) on delete restrict,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_ai_jobs_status on public.ai_jobs (status);
create index idx_ai_jobs_target on public.ai_jobs (target_type, target_id);
create index idx_ai_jobs_created_at on public.ai_jobs (created_at desc);

create table public.program_metadata (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.support_programs (id) on delete cascade,
  schema_version text not null default 'v1',
  task_type text not null
    check (task_type in ('announcement_summary', 'announcement_metadata')),
  model text not null,
  prompt_version text not null,
  status text not null default 'draft'
    check (status in ('draft', 'reviewing', 'approved', 'rejected')),
  metadata_json jsonb not null,
  extracted_fields jsonb not null default '{}'::jsonb,
  created_by_job_id uuid references public.ai_jobs (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_program_metadata_program_id on public.program_metadata (program_id);
create index idx_program_metadata_status on public.program_metadata (status);
create index idx_program_metadata_task_type on public.program_metadata (task_type);
create index gin_program_metadata_json on public.program_metadata using gin (metadata_json);

create table public.matching_results (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  program_id uuid not null references public.support_programs (id) on delete cascade,
  score int not null check (score between 0 and 100),
  recommendation_level text not null
    check (recommendation_level in ('high', 'medium', 'low')),
  reasons jsonb not null default '[]'::jsonb,
  risks jsonb not null default '[]'::jsonb,
  improvement_tasks jsonb not null default '[]'::jsonb,
  schema_version text not null default 'v1',
  task_type text not null default 'recommendation_reasoning',
  model text,
  prompt_version text,
  status text not null default 'draft'
    check (status in ('draft', 'reviewing', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, program_id)
);

create index idx_matching_results_company_id on public.matching_results (company_id);
create index idx_matching_results_program_id on public.matching_results (program_id);
create index idx_matching_results_score on public.matching_results (score desc);

create table public.review_logs (
  id uuid primary key default gen_random_uuid(),
  review_target_type text not null
    check (review_target_type in ('program_metadata', 'matching_results')),
  review_target_id uuid not null,
  action text not null
    check (action in ('created', 'updated', 'approved', 'rejected', 'retried')),
  before_json jsonb,
  after_json jsonb,
  review_comment text,
  actor_id uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now()
);

create index idx_review_logs_target on public.review_logs (review_target_type, review_target_id);
create index idx_review_logs_actor_id on public.review_logs (actor_id);
create index idx_review_logs_created_at on public.review_logs (created_at desc);

-- ---------------------------------------------------------------------------
-- Role helpers (after tables exist)
-- ---------------------------------------------------------------------------

create or replace function public.get_my_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.is_admin_or_reviewer()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid() and role in ('admin', 'reviewer')
  );
$$;

create or replace function public.owns_company(p_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.companies
    where id = p_company_id and owner_id = auth.uid()
  );
$$;

create or replace function public.prevent_profile_role_change()
returns trigger
language plpgsql
as $$
begin
  if auth.uid() is not null
    and auth.uid() = old.id
    and not public.is_admin()
    and new.role is distinct from old.role
  then
    raise exception 'role change is not allowed';
  end if;
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'user');
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

create trigger profiles_prevent_role_change
  before update on public.profiles
  for each row execute function public.prevent_profile_role_change();

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create trigger companies_updated_at
  before update on public.companies
  for each row execute function public.handle_updated_at();

create trigger support_programs_updated_at
  before update on public.support_programs
  for each row execute function public.handle_updated_at();

create trigger ai_jobs_updated_at
  before update on public.ai_jobs
  for each row execute function public.handle_updated_at();

create trigger program_metadata_updated_at
  before update on public.program_metadata
  for each row execute function public.handle_updated_at();

create trigger matching_results_updated_at
  before update on public.matching_results
  for each row execute function public.handle_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.support_programs enable row level security;
alter table public.program_metadata enable row level security;
alter table public.matching_results enable row level security;
alter table public.review_logs enable row level security;
alter table public.ai_jobs enable row level security;

create policy profiles_select_own_or_admin
  on public.profiles for select
  to authenticated
  using (id = auth.uid() or public.is_admin());

create policy profiles_update_own_or_admin
  on public.profiles for update
  to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

create policy companies_select
  on public.companies for select
  to authenticated
  using (
    owner_id = auth.uid()
    or public.is_admin_or_reviewer()
  );

create policy companies_insert_own
  on public.companies for insert
  to authenticated
  with check (owner_id = auth.uid());

create policy companies_update_own_or_admin
  on public.companies for update
  to authenticated
  using (owner_id = auth.uid() or public.is_admin())
  with check (owner_id = auth.uid() or public.is_admin());

create policy companies_delete_own_or_admin
  on public.companies for delete
  to authenticated
  using (owner_id = auth.uid() or public.is_admin());

create policy support_programs_select_authenticated
  on public.support_programs for select
  to authenticated
  using (true);

create policy support_programs_admin_write
  on public.support_programs for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy program_metadata_select_authenticated
  on public.program_metadata for select
  to authenticated
  using (true);

create policy program_metadata_insert_reviewer
  on public.program_metadata for insert
  to authenticated
  with check (public.is_admin_or_reviewer());

create policy program_metadata_update_reviewer
  on public.program_metadata for update
  to authenticated
  using (public.is_admin_or_reviewer())
  with check (public.is_admin_or_reviewer());

create policy program_metadata_delete_admin
  on public.program_metadata for delete
  to authenticated
  using (public.is_admin());

create policy matching_results_select
  on public.matching_results for select
  to authenticated
  using (
    public.owns_company(company_id)
    or public.is_admin_or_reviewer()
  );

create policy matching_results_insert
  on public.matching_results for insert
  to authenticated
  with check (
    public.is_admin()
    or public.owns_company(company_id)
  );

create policy matching_results_update_reviewer
  on public.matching_results for update
  to authenticated
  using (public.is_admin_or_reviewer())
  with check (public.is_admin_or_reviewer());

create policy matching_results_delete_admin
  on public.matching_results for delete
  to authenticated
  using (public.is_admin());

create policy review_logs_select
  on public.review_logs for select
  to authenticated
  using (
    actor_id = auth.uid()
    or public.is_admin_or_reviewer()
  );

create policy review_logs_insert_reviewer
  on public.review_logs for insert
  to authenticated
  with check (public.is_admin_or_reviewer() and actor_id = auth.uid());

create policy ai_jobs_select
  on public.ai_jobs for select
  to authenticated
  using (
    requested_by = auth.uid()
    or public.is_admin_or_reviewer()
  );

create policy ai_jobs_insert
  on public.ai_jobs for insert
  to authenticated
  with check (
    requested_by = auth.uid()
    and (public.is_admin() or public.get_my_role() = 'user')
  );

create policy ai_jobs_update_admin
  on public.ai_jobs for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant execute on function public.get_my_role() to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_admin_or_reviewer() to authenticated;
grant execute on function public.owns_company(uuid) to authenticated;
