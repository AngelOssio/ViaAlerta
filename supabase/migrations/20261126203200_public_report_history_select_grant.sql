-- Let the public report detail read the timeline without exposing actor IDs.
-- report_id is required for the filter on the requested report.
grant select (id, report_id, new_status, note, created_at)
  on table public.report_status_history to anon, authenticated;
