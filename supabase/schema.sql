-- =====================================================================
--  Raviraja CRM – Supabase schema (users, roles, permissions, vouchers)
--  Run this whole file once in:  Supabase Dashboard → SQL Editor → New query
-- =====================================================================

-- ---------- Tables ----------
create table if not exists public.app_users (
  id          uuid primary key default gen_random_uuid(),
  email       text not null,
  name        text not null,
  role        text not null check (role in ('Admin','Authorized Accounts Manager','Accounts Staff')),
  designation text not null default '',
  department  text not null default '',
  mobile      text not null default '',
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);
create unique index if not exists app_users_email_key on public.app_users (lower(email));

create table if not exists public.role_permissions (
  role        text primary key check (role in ('Admin','Authorized Accounts Manager','Accounts Staff')),
  permissions text[] not null default '{}',
  updated_at  timestamptz not null default now()
);

-- one row per voucher so two people editing different vouchers never overwrite each other
create table if not exists public.vouchers (
  id          text primary key,
  kind        text not null check (kind in ('IN','OUT')),
  data        jsonb not null,
  updated_at  timestamptz not null default now(),
  updated_by  text
);

-- small shared lists + branding (suppliers, customers, accounts, app/PDF branding …)
create table if not exists public.app_kv (
  key         text primary key,
  value       jsonb not null,
  updated_at  timestamptz not null default now(),
  updated_by  text
);

-- ---------- Helper functions (run with owner rights so RLS can look up the caller) ----------
create or replace function public.auth_email() returns text
language sql stable as $$ select lower(coalesce(auth.jwt() ->> 'email', '')) $$;

create or replace function public.is_active_user() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.app_users u where lower(u.email) = public.auth_email() and u.active)
$$;

create or replace function public.has_perm(p text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.app_users u
    join public.role_permissions rp on rp.role = u.role
    where lower(u.email) = public.auth_email() and u.active and p = any (rp.permissions)
  )
$$;

-- ---------- Row Level Security ----------
alter table public.app_users        enable row level security;
alter table public.role_permissions enable row level security;
alter table public.vouchers         enable row level security;
alter table public.app_kv           enable row level security;

-- app_users: you can always read your own row (so we can tell "not granted"); active users read everyone
drop policy if exists users_select on public.app_users;
create policy users_select on public.app_users for select to authenticated
  using (lower(email) = public.auth_email() or public.is_active_user());
drop policy if exists users_write on public.app_users;
create policy users_write on public.app_users for all to authenticated
  using (public.has_perm('roles.manage')) with check (public.has_perm('roles.manage'));

-- role_permissions
drop policy if exists perms_select on public.role_permissions;
create policy perms_select on public.role_permissions for select to authenticated using (public.is_active_user());
drop policy if exists perms_write on public.role_permissions;
create policy perms_write on public.role_permissions for all to authenticated
  using (public.has_perm('roles.manage')) with check (public.has_perm('roles.manage'));

-- vouchers: permissions are enforced on the server, not only in the UI
drop policy if exists vouchers_select on public.vouchers;
create policy vouchers_select on public.vouchers for select to authenticated using (public.is_active_user());
drop policy if exists vouchers_insert on public.vouchers;
create policy vouchers_insert on public.vouchers for insert to authenticated
  with check (public.has_perm(case when kind = 'IN' then 'in.create' else 'out.create' end));
drop policy if exists vouchers_update on public.vouchers;
create policy vouchers_update on public.vouchers for update to authenticated
  using (public.has_perm(case when kind = 'IN' then 'in.edit' else 'out.edit' end) or public.has_perm('voucher.approve'))
  with check (public.has_perm(case when kind = 'IN' then 'in.edit' else 'out.edit' end) or public.has_perm('voucher.approve'));
drop policy if exists vouchers_delete on public.vouchers;
create policy vouchers_delete on public.vouchers for delete to authenticated
  using (public.has_perm(case when kind = 'IN' then 'in.delete' else 'out.delete' end));

-- app_kv: everyone active reads; branding keys need the matching permission
drop policy if exists kv_select on public.app_kv;
create policy kv_select on public.app_kv for select to authenticated using (public.is_active_user());
drop policy if exists kv_write on public.app_kv;
create policy kv_write on public.app_kv for all to authenticated
  using (
    case when key in ('app_brand','pdf_branding') then public.has_perm('branding.edit') or public.has_perm('pdf.studio')
         else public.is_active_user() end)
  with check (
    case when key in ('app_brand','pdf_branding') then public.has_perm('branding.edit') or public.has_perm('pdf.studio')
         else public.is_active_user() end);

-- ---------- Live updates ----------
do $$
begin
  begin alter publication supabase_realtime add table public.app_users;        exception when others then null; end;
  begin alter publication supabase_realtime add table public.role_permissions; exception when others then null; end;
  begin alter publication supabase_realtime add table public.vouchers;         exception when others then null; end;
  begin alter publication supabase_realtime add table public.app_kv;           exception when others then null; end;
end $$;
alter table public.vouchers replica identity full;
alter table public.app_users replica identity full;

-- ---------- Default role permissions ----------
insert into public.role_permissions (role, permissions) values
 ('Admin', array['dashboard.view','docs.view','clients.view','in.view','in.create','in.edit','in.delete','out.view','out.create','out.edit','out.delete','voucher.approve','pdf.download','pdf.studio','branding.edit','roles.manage']),
 ('Authorized Accounts Manager', array['dashboard.view','docs.view','clients.view','in.view','in.create','in.edit','in.delete','out.view','out.create','out.edit','out.delete','voucher.approve','pdf.download','pdf.studio']),
 ('Accounts Staff', array['dashboard.view','docs.view','clients.view','in.view','in.create','in.edit','out.view','out.create','out.edit','pdf.download'])
on conflict (role) do nothing;

-- ---------- FIRST ADMIN  (edit the email, then run) ----------
-- This Gmail address can sign in and then add everyone else from "Roles & Access".
insert into public.app_users (email, name, role, designation, department)
values ('YOUR_GMAIL@gmail.com', 'Your Name', 'Admin', 'Managing Director', 'Executive Board')
on conflict do nothing;
