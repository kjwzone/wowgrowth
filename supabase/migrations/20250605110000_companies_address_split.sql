alter table public.companies
  add column if not exists address_base text,
  add column if not exists address_detail text not null default '';
