-- Fix: Postgres doesn't support CREATE POLICY IF NOT EXISTS

create extension if not exists pgcrypto;

create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Roles enum
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM (
    'super_admin',
    'hr_manager',
    'hr_staff',
    'department_head',
    'team_lead',
    'employee',
    'intern'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Tables
create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

create table if not exists public.profiles (
  id uuid primary key,
  email text,
  first_name text,
  last_name text,
  avatar_url text,
  phone_number text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(name)
);

create table if not exists public.positions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  department_id uuid references public.departments(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  department_id uuid references public.departments(id) on delete set null,
  team_lead_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references public.profiles(id) on delete set null,
  department_id uuid references public.departments(id) on delete set null,
  position_id uuid references public.positions(id) on delete set null,
  team_id uuid references public.teams(id) on delete set null,
  manager_id uuid references public.employees(id) on delete set null,
  employee_code text,
  hire_date date,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  clock_in timestamptz,
  clock_out timestamptz,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.leave_requests (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  reason text,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text,
  message text,
  link text,
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

-- Indexes
create index if not exists idx_employees_user_id on public.employees(user_id);
create index if not exists idx_attendance_employee_id on public.attendance(employee_id);
create index if not exists idx_leave_requests_employee_id on public.leave_requests(employee_id);
create index if not exists idx_notifications_user_id on public.notifications(user_id);

-- Triggers
DO $$ BEGIN
  IF NOT EXISTS (select 1 from pg_trigger where tgname = 'set_profiles_updated_at') THEN
    create trigger set_profiles_updated_at
    before update on public.profiles
    for each row execute function public.update_updated_at_column();
  END IF;
  IF NOT EXISTS (select 1 from pg_trigger where tgname = 'set_departments_updated_at') THEN
    create trigger set_departments_updated_at
    before update on public.departments
    for each row execute function public.update_updated_at_column();
  END IF;
  IF NOT EXISTS (select 1 from pg_trigger where tgname = 'set_positions_updated_at') THEN
    create trigger set_positions_updated_at
    before update on public.positions
    for each row execute function public.update_updated_at_column();
  END IF;
  IF NOT EXISTS (select 1 from pg_trigger where tgname = 'set_teams_updated_at') THEN
    create trigger set_teams_updated_at
    before update on public.teams
    for each row execute function public.update_updated_at_column();
  END IF;
  IF NOT EXISTS (select 1 from pg_trigger where tgname = 'set_employees_updated_at') THEN
    create trigger set_employees_updated_at
    before update on public.employees
    for each row execute function public.update_updated_at_column();
  END IF;
  IF NOT EXISTS (select 1 from pg_trigger where tgname = 'set_leave_requests_updated_at') THEN
    create trigger set_leave_requests_updated_at
    before update on public.leave_requests
    for each row execute function public.update_updated_at_column();
  END IF;
  IF NOT EXISTS (select 1 from pg_trigger where tgname = 'set_projects_updated_at') THEN
    create trigger set_projects_updated_at
    before update on public.projects
    for each row execute function public.update_updated_at_column();
  END IF;
END $$;

-- RLS
alter table public.user_roles enable row level security;
alter table public.profiles enable row level security;
alter table public.departments enable row level security;
alter table public.positions enable row level security;
alter table public.teams enable row level security;
alter table public.employees enable row level security;
alter table public.attendance enable row level security;
alter table public.leave_requests enable row level security;
alter table public.projects enable row level security;
alter table public.notifications enable row level security;

-- Helper functions for RLS
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    where ur.user_id = _user_id
      and ur.role = _role
  );
$$;

create or replace function public.is_admin_or_hr(_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select (
    public.has_role(_user_id, 'super_admin')
    or public.has_role(_user_id, 'hr_manager')
    or public.has_role(_user_id, 'hr_staff')
  );
$$;

create or replace function public.is_own_employee_id(_employee_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.employees e
    where e.id = _employee_id
      and e.user_id = auth.uid()
  );
$$;

-- Drop + recreate policies (idempotent)
-- profiles
drop policy if exists profiles_select_own_or_hr on public.profiles;
drop policy if exists profiles_insert_own on public.profiles;
drop policy if exists profiles_update_own_or_hr on public.profiles;

create policy profiles_select_own_or_hr
on public.profiles for select
to authenticated
using (id = auth.uid() or public.is_admin_or_hr(auth.uid()));

create policy profiles_insert_own
on public.profiles for insert
to authenticated
with check (id = auth.uid());

create policy profiles_update_own_or_hr
on public.profiles for update
to authenticated
using (id = auth.uid() or public.is_admin_or_hr(auth.uid()))
with check (id = auth.uid() or public.is_admin_or_hr(auth.uid()));

-- user_roles
drop policy if exists user_roles_select_own_or_hr on public.user_roles;
drop policy if exists user_roles_insert_hr_only on public.user_roles;
drop policy if exists user_roles_update_hr_only on public.user_roles;
drop policy if exists user_roles_delete_hr_only on public.user_roles;

create policy user_roles_select_own_or_hr
on public.user_roles for select
to authenticated
using (user_id = auth.uid() or public.is_admin_or_hr(auth.uid()));

create policy user_roles_insert_hr_only
on public.user_roles for insert
to authenticated
with check (public.is_admin_or_hr(auth.uid()));

create policy user_roles_update_hr_only
on public.user_roles for update
to authenticated
using (public.is_admin_or_hr(auth.uid()))
with check (public.is_admin_or_hr(auth.uid()));

create policy user_roles_delete_hr_only
on public.user_roles for delete
to authenticated
using (public.is_admin_or_hr(auth.uid()));

-- departments/positions/teams/projects
drop policy if exists departments_read_authenticated on public.departments;
drop policy if exists departments_write_hr on public.departments;
create policy departments_read_authenticated
on public.departments for select
to authenticated
using (true);
create policy departments_write_hr
on public.departments for all
to authenticated
using (public.is_admin_or_hr(auth.uid()))
with check (public.is_admin_or_hr(auth.uid()));

drop policy if exists positions_read_authenticated on public.positions;
drop policy if exists positions_write_hr on public.positions;
create policy positions_read_authenticated
on public.positions for select
to authenticated
using (true);
create policy positions_write_hr
on public.positions for all
to authenticated
using (public.is_admin_or_hr(auth.uid()))
with check (public.is_admin_or_hr(auth.uid()));

drop policy if exists teams_read_authenticated on public.teams;
drop policy if exists teams_write_hr on public.teams;
create policy teams_read_authenticated
on public.teams for select
to authenticated
using (true);
create policy teams_write_hr
on public.teams for all
to authenticated
using (public.is_admin_or_hr(auth.uid()))
with check (public.is_admin_or_hr(auth.uid()));

drop policy if exists projects_read_authenticated on public.projects;
drop policy if exists projects_write_hr on public.projects;
create policy projects_read_authenticated
on public.projects for select
to authenticated
using (true);
create policy projects_write_hr
on public.projects for all
to authenticated
using (public.is_admin_or_hr(auth.uid()))
with check (public.is_admin_or_hr(auth.uid()));

-- employees
drop policy if exists employees_select_own_or_hr on public.employees;
drop policy if exists employees_insert_hr_only on public.employees;
drop policy if exists employees_update_own_or_hr on public.employees;
drop policy if exists employees_delete_hr_only on public.employees;

create policy employees_select_own_or_hr
on public.employees for select
to authenticated
using (user_id = auth.uid() or public.is_admin_or_hr(auth.uid()));

create policy employees_insert_hr_only
on public.employees for insert
to authenticated
with check (public.is_admin_or_hr(auth.uid()));

create policy employees_update_own_or_hr
on public.employees for update
to authenticated
using (user_id = auth.uid() or public.is_admin_or_hr(auth.uid()))
with check (user_id = auth.uid() or public.is_admin_or_hr(auth.uid()));

create policy employees_delete_hr_only
on public.employees for delete
to authenticated
using (public.is_admin_or_hr(auth.uid()));

-- attendance
drop policy if exists attendance_select_own_or_hr on public.attendance;
drop policy if exists attendance_insert_own on public.attendance;
drop policy if exists attendance_update_own on public.attendance;
drop policy if exists attendance_delete_hr_only on public.attendance;

create policy attendance_select_own_or_hr
on public.attendance for select
to authenticated
using (public.is_own_employee_id(employee_id) or public.is_admin_or_hr(auth.uid()));

create policy attendance_insert_own
on public.attendance for insert
to authenticated
with check (public.is_own_employee_id(employee_id));

create policy attendance_update_own
on public.attendance for update
to authenticated
using (public.is_own_employee_id(employee_id))
with check (public.is_own_employee_id(employee_id));

create policy attendance_delete_hr_only
on public.attendance for delete
to authenticated
using (public.is_admin_or_hr(auth.uid()));

-- leave_requests
drop policy if exists leave_select_own_or_hr on public.leave_requests;
drop policy if exists leave_insert_own on public.leave_requests;
drop policy if exists leave_update_own_or_hr on public.leave_requests;
drop policy if exists leave_delete_hr_only on public.leave_requests;

create policy leave_select_own_or_hr
on public.leave_requests for select
to authenticated
using (public.is_own_employee_id(employee_id) or public.is_admin_or_hr(auth.uid()));

create policy leave_insert_own
on public.leave_requests for insert
to authenticated
with check (public.is_own_employee_id(employee_id));

create policy leave_update_own_or_hr
on public.leave_requests for update
to authenticated
using (public.is_own_employee_id(employee_id) or public.is_admin_or_hr(auth.uid()))
with check (public.is_own_employee_id(employee_id) or public.is_admin_or_hr(auth.uid()));

create policy leave_delete_hr_only
on public.leave_requests for delete
to authenticated
using (public.is_admin_or_hr(auth.uid()));

-- notifications
drop policy if exists notifications_select_own on public.notifications;
drop policy if exists notifications_update_own on public.notifications;
drop policy if exists notifications_delete_own on public.notifications;

create policy notifications_select_own
on public.notifications for select
to authenticated
using (user_id = auth.uid());

create policy notifications_update_own
on public.notifications for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy notifications_delete_own
on public.notifications for delete
to authenticated
using (user_id = auth.uid());
