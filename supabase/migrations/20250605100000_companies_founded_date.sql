alter table public.companies
  add column if not exists founded_date date;

comment on column public.companies.founded_date is
  '설립일(법인: 등기부등본 회사성립연월일, 개인: 사업자등록증 개업연월일)';
