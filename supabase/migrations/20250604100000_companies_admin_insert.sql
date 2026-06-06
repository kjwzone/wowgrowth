-- Admin may register companies (any owner_id for delegated onboarding)

create policy companies_insert_admin
  on public.companies for insert
  to authenticated
  with check (public.is_admin());
