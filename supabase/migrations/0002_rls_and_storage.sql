-- VíaAlerta · Migración 0002: Políticas RLS, vista pública segura, RPC administrativo y Storage
-- Proyecto académico IHM · Grupo 14 · Sección 42920

-- 1. Función de verificación de administrador (evita recursión en políticas RLS)
create or replace function public.is_admin(uid uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = uid
      and role = 'admin'
  );
$$;

revoke all on function public.is_admin(uuid) from public;
grant execute on function public.is_admin(uuid) to authenticated;

-- 2. Activar RLS en todas las tablas
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.user_preferences enable row level security;
alter table public.reports enable row level security;
alter table public.report_photos enable row level security;
alter table public.report_status_history enable row level security;
alter table public.account_deletion_requests enable row level security;
alter table public.email_dispatch_logs enable row level security;

-- 3. Políticas de profiles
drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
  on public.profiles for select
  to authenticated
  using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- 4. Políticas de user_roles (solo lectura del rol propio; prohibido autoasignarse admin)
drop policy if exists "user_roles_select_own_or_admin" on public.user_roles;
create policy "user_roles_select_own_or_admin"
  on public.user_roles for select
  to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- No se crean políticas INSERT/UPDATE/DELETE para authenticated ni anon en user_roles.
-- La asignación de administradores ocurre únicamente mediante SQL privilegiado o service_role.

-- 5. Políticas de user_preferences
drop policy if exists "preferences_select_own" on public.user_preferences;
create policy "preferences_select_own"
  on public.user_preferences for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "preferences_upsert_own" on public.user_preferences;
create policy "preferences_upsert_own"
  on public.user_preferences for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "preferences_update_own" on public.user_preferences;
create policy "preferences_update_own"
  on public.user_preferences for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- 6. Políticas de reports
-- Los usuarios autenticados ven sus propios reportes; los administradores ven todos.
-- Para exploración pública (mapa/invitado), se expone la vista public.public_reports sin PII.
drop policy if exists "reports_select_own_or_admin" on public.reports;
create policy "reports_select_own_or_admin"
  on public.reports for select
  to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "reports_insert_authenticated_own" on public.reports;
create policy "reports_insert_authenticated_own"
  on public.reports for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and status = 'recibido'
    and is_demo = false
  );

-- Un ciudadano solo puede editar descripción o dirección si el reporte aún está en estado recibido.
-- Los cambios de estado solo los realiza el administrador mediante RPC o Edge Function.
drop policy if exists "reports_update_own_while_received" on public.reports;
create policy "reports_update_own_while_received"
  on public.reports for update
  to authenticated
  using (user_id = auth.uid() and status = 'recibido')
  with check (user_id = auth.uid() and status = 'recibido');

-- 7. Políticas de report_photos
drop policy if exists "report_photos_select_own_or_admin" on public.report_photos;
create policy "report_photos_select_own_or_admin"
  on public.report_photos for select
  to authenticated
  using (
    uploaded_by = auth.uid()
    or public.is_admin()
    or exists (
      select 1 from public.reports r
      where r.id = report_photos.report_id
        and r.user_id = auth.uid()
    )
  );

drop policy if exists "report_photos_insert_own" on public.report_photos;
create policy "report_photos_insert_own"
  on public.report_photos for insert
  to authenticated
  with check (
    uploaded_by = auth.uid()
    and exists (
      select 1 from public.reports r
      where r.id = report_photos.report_id
        and r.user_id = auth.uid()
    )
  );

-- 8. Políticas de report_status_history
drop policy if exists "report_history_select_visible" on public.report_status_history;
create policy "report_history_select_visible"
  on public.report_status_history for select
  to anon, authenticated
  using (true);

-- La inserción en report_status_history ocurre mediante trigger de creación o función privilegiada admin_update_report_status.

-- 9. Políticas de account_deletion_requests
drop policy if exists "deletion_requests_select_own" on public.account_deletion_requests;
create policy "deletion_requests_select_own"
  on public.account_deletion_requests for select
  to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- Las mutaciones de eliminación/cancelación se ejecutan mediante la Edge Function account-lifecycle.

-- 10. Políticas de email_dispatch_logs (solo lectura del propio usuario o admin)
drop policy if exists "email_logs_select_own_or_admin" on public.email_dispatch_logs;
create policy "email_logs_select_own_or_admin"
  on public.email_dispatch_logs for select
  to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- 11. Vista pública segura para exploración en el mapa (sin user_id, correo ni datos personales)
create or replace view public.public_reports as
select
  r.id,
  r.tracking_code,
  r.category,
  r.description,
  r.risk_level,
  r.status,
  r.latitude,
  r.longitude,
  r.address,
  r.district,
  r.is_demo,
  r.created_at,
  r.updated_at,
  (
    select rp.storage_path
    from public.report_photos rp
    where rp.report_id = r.id
    order by rp.created_at asc
    limit 1
  ) as primary_photo_path
from public.reports r;

grant select on public.public_reports to anon, authenticated;

-- 12. RPC protegido en el servidor para que un administrador actualice estado y registre historial
create or replace function public.admin_update_report_status(
  p_report_id uuid,
  p_new_status public.report_status,
  p_note text default null
)
returns public.reports
language plpgsql
security definer
set search_path = public
as $$
declare
  v_prev_status public.report_status;
  v_updated public.reports;
begin
  if auth.uid() is null or not public.is_admin(auth.uid()) then
    raise exception 'No autorizado: se requiere rol de administrador.' using errcode = '42501';
  end if;

  select status into v_prev_status
  from public.reports
  where id = p_report_id
  for update;

  if not found then
    raise exception 'Reporte no encontrado.' using errcode = 'P0002';
  end if;

  update public.reports
  set status = p_new_status,
      updated_at = now()
  where id = p_report_id
  returning * into v_updated;

  insert into public.report_status_history (
    report_id,
    previous_status,
    new_status,
    note,
    changed_by
  ) values (
    p_report_id,
    v_prev_status,
    p_new_status,
    coalesce(nullif(trim(p_note), ''), 'Estado actualizado desde la consola administrativa.'),
    auth.uid()
  );

  return v_updated;
end;
$$;

revoke all on function public.admin_update_report_status(uuid, public.report_status, text) from public;
grant execute on function public.admin_update_report_status(uuid, public.report_status, text) to authenticated;

-- 13. Bucket privado de almacenamiento de fotografías (protegido)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'report-photos',
  'report-photos',
  false,
  5242880, -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = false,
    file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

-- Solo el usuario autenticado puede subir en su carpeta {auth.uid()}/...
drop policy if exists "report_photos_storage_insert_own" on storage.objects;
create policy "report_photos_storage_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'report-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Lectura autenticada para el propietario o un administrador (los invitados usan URLs firmadas desde Edge Function)
drop policy if exists "report_photos_storage_select_own_or_admin" on storage.objects;
create policy "report_photos_storage_select_own_or_admin"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'report-photos'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_admin()
    )
  );

drop policy if exists "report_photos_storage_delete_own_or_admin" on storage.objects;
create policy "report_photos_storage_delete_own_or_admin"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'report-photos'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_admin()
    )
  );
