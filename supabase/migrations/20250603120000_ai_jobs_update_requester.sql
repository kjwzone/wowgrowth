-- Allow job requester to update own ai_jobs (status tracking for user-facing AI)

create policy ai_jobs_update_requester
  on public.ai_jobs for update
  to authenticated
  using (requested_by = auth.uid())
  with check (requested_by = auth.uid());
