-- Dev seed (run after migration; requires auth.users rows or manual profile inserts)
-- Usage: supabase db reset (applies migrations + seed) or psql -f supabase/seed.sql

-- NOTE: Replace UUIDs below after creating test users in Supabase Auth.
-- Example flow:
--   1. Sign up test users in Supabase Dashboard
--   2. Copy user IDs into variables below
--   3. Run seed

-- Admin profile (set role after signup trigger created default 'user')
-- update public.profiles set role = 'admin' where email = 'admin@wowgrowth.dev';
-- update public.profiles set role = 'reviewer' where email = 'reviewer@wowgrowth.dev';

-- Sample support program (requires admin profile id)
/*
insert into public.support_programs (
  title,
  agency,
  category,
  region,
  application_start_date,
  application_end_date,
  status,
  content_raw,
  created_by
) values (
  '2026 창업도약패키지',
  '중소벤처기업부',
  '창업',
  '전국',
  '2026-06-01',
  '2026-06-30',
  'published',
  '창업 7년 이내 기업 대상 지원사업 공고 요약문...',
  '<ADMIN_PROFILE_UUID>'
);
*/
