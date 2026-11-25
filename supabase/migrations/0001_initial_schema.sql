-- VíaAlerta · Migración 0001: Esquema base, tipos, índices y triggers
-- Proyecto académico IHM · Grupo 14 · Sección 42920

create extension if not exists pgcrypto;

-- 1. Tipos enumerados
do $$ begin
  create type public.user_role as enum ('ciudadano', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.account_status as enum ('active', 'deactivated', 'pending_deletion', 'deleted');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.report_category as enum ('hueco', 'vereda', 'senalizacion', 'buzon');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.report_risk as enum ('bajo', 'medio', 'alto');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.report_status as enum ('recibido', 'en_revision', 'en_atencion', 'resuelto');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.deletion_request_status as enum ('pending', 'cancelled', 'completed');
exception when duplicate_object then null; end $$;

-- 2. Función reutilizable para updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 3. Perfiles de usuario (sin contraseñas ni rol editable por el cliente)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  district text not null default 'Chaclacayo, Lima',
  phone text,
  account_status public.account_status not null default 'active',
  deactivated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- 4. Roles administrativos (separados del perfil para impedir autoasignación)
create table if not exists public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role not null default 'ciudadano',
  granted_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_user_roles_role on public.user_roles(role);

create trigger trg_user_roles_updated_at
  before update on public.user_roles
  for each row execute function public.set_updated_at();

-- 5. Preferencias de accesibilidad y avisos
create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  text_scale numeric(3, 2) not null default 1.00 check (text_scale >= 1.00 and text_scale <= 2.00),
  high_contrast boolean not null default false,
  large_controls boolean not null default false,
  reduce_motion boolean not null default false,
  notify_report_updates boolean not null default true,
  notify_email_confirmations boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_user_preferences_updated_at
  before update on public.user_preferences
  for each row execute function public.set_updated_at();

-- 6. Secuencia y tabla de reportes viales
create sequence if not exists public.report_tracking_seq start 1;

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  tracking_code text unique not null,
  user_id uuid references auth.users(id) on delete set null,
  client_submission_id uuid unique,
  category public.report_category not null,
  description text not null check (char_length(trim(description)) >= 10 and char_length(description) <= 1000),
  risk_level public.report_risk not null default 'medio',
  status public.report_status not null default 'recibido',
  latitude double precision not null check (latitude >= -90 and latitude <= 90),
  longitude double precision not null check (longitude >= -180 and longitude <= 180),
  address text,
  district text,
  is_demo boolean not null default false,
  anonymized_at timestamptz,
  anonymized_retention_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_reports_user_id on public.reports(user_id);
create index if not exists idx_reports_status on public.reports(status);
create index if not exists idx_reports_category on public.reports(category);
create index if not exists idx_reports_created_at on public.reports(created_at desc);
create index if not exists idx_reports_coords on public.reports(latitude, longitude);

create or replace function public.assign_report_tracking_code()
returns trigger
language plpgsql
as $$
declare
  next_num bigint;
begin
  if new.tracking_code is null or trim(new.tracking_code) = '' then
    next_num := nextval('public.report_tracking_seq');
    new.tracking_code := 'VA-' || extract(year from now())::int || '-' || lpad(next_num::text, 3, '0');
  end if;
  return new;
end;
$$;

create trigger trg_reports_tracking_code
  before insert on public.reports
  for each row execute function public.assign_report_tracking_code();

create trigger trg_reports_updated_at
  before update on public.reports
  for each row execute function public.set_updated_at();

-- 7. Metadatos de fotografías de reportes
create table if not exists public.report_photos (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports(id) on delete cascade,
  storage_path text not null unique,
  mime_type text not null default 'image/jpeg',
  file_size_bytes integer check (file_size_bytes is null or file_size_bytes > 0),
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_report_photos_report_id on public.report_photos(report_id);

create trigger trg_report_photos_updated_at
  before update on public.report_photos
  for each row execute function public.set_updated_at();

-- 8. Historial de cambios de estado
create table if not exists public.report_status_history (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports(id) on delete cascade,
  previous_status public.report_status,
  new_status public.report_status not null,
  note text,
  changed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_report_history_report_id on public.report_status_history(report_id, created_at desc);

-- Registrar automáticamente el estado inicial al crear un reporte
create or replace function public.log_initial_report_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.report_status_history (report_id, previous_status, new_status, note, changed_by)
  values (
    new.id,
    null,
    new.status,
    'Incidencia registrada y pendiente de evaluación.',
    new.user_id
  );
  return new;
end;
$$;

create trigger trg_reports_initial_history
  after insert on public.reports
  for each row execute function public.log_initial_report_status();

-- 9. Solicitudes de eliminación programada (30 días de gracia, decisión de proyecto)
create table if not exists public.account_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  confirmation_phrase text not null check (confirmation_phrase = 'ELIMINAR'),
  status public.deletion_request_status not null default 'pending',
  requested_at timestamptz not null default now(),
  scheduled_for timestamptz not null default (now() + interval '30 days'),
  cancelled_at timestamptz,
  completed_at timestamptz,
  confirmation_email_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_deletion_requests_user_status
  on public.account_deletion_requests(user_id, status);
create index if not exists idx_deletion_requests_scheduled
  on public.account_deletion_requests(scheduled_for)
  where status = 'pending';

create trigger trg_deletion_requests_updated_at
  before update on public.account_deletion_requests
  for each row execute function public.set_updated_at();

-- 10. Bitácora de envíos de correo transaccional
create table if not exists public.email_dispatch_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  template text not null,
  recipient_email text not null,
  status text not null check (status in ('sent', 'failed', 'not_configured')),
  provider_message_id text,
  error_message text,
  created_at timestamptz not null default now()
);

create index if not exists idx_email_logs_user on public.email_dispatch_logs(user_id, created_at desc);

-- 11. Trigger de alta automática al registrarse un usuario en auth.users
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(coalesce(new.email, 'Usuario'), '@', 1))
  )
  on conflict (id) do nothing;

  insert into public.user_roles (user_id, role)
  values (new.id, 'ciudadano')
  on conflict (user_id) do nothing;

  insert into public.user_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
