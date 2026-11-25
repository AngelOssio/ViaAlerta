-- Existing RLS limits report reads to owners and administrators.
grant select on table public.reports to authenticated;
