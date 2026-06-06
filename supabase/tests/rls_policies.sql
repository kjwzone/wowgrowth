-- RLS policy smoke tests (run in Supabase SQL editor or psql after seed users)
-- Prerequisites: test users in auth.users + profiles with roles user/admin/reviewer

-- Example: set local role (Supabase uses auth.uid() from JWT in app; manual test via service role + set request.jwt)

-- 1) User cannot read another user's company
-- expect 0 rows when querying companies where owner_id != auth.uid()

-- 2) Non-admin cannot insert support_programs
-- expect RLS violation

-- 3) Admin can insert support_programs
-- expect success

-- 4) Reviewer can update program_metadata
-- expect success

-- 5) User can select own matching_results only
-- expect rows filtered by company.owner_id = auth.uid()

begin;

-- Structural checks: RLS enabled
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in (
    'profiles',
    'companies',
    'support_programs',
    'program_metadata',
    'matching_results',
    'review_logs',
    'ai_jobs'
  );

-- Policy existence
select schemaname, tablename, policyname, cmd, roles
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

rollback;
