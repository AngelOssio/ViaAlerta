-- Authenticated clients read roles through the existing row-level policy.
grant select on table public.user_roles to authenticated;
