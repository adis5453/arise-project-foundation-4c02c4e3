-- Phase 1: Core enums + org structure expansions + helper functions + updated_at triggers + RLS

-- 0) Enums (idempotent)
DO $$ BEGIN
  CREATE TYPE public.approval_status AS ENUM ('pending','approved','rejected','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.attendance_status AS ENUM ('present','absent','late','on_leave','holiday','weekend');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.employment_status AS ENUM ('active','on_leave','terminated','resigned','retired');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.employment_type AS ENUM ('full_time','part_time','contract','intern','temporary');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 1) Helper functions for non-recursive RLS (security definer)
CREATE OR REPLACE FUNCTION public.is_manager_of_employee(_employee_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  select exists (
    select 1
    from public.employees e
    join public.employees me on me.user_id = auth.uid()
    where e.id = _employee_id
      and e.manager_id = me.id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_same_department(_employee_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  select exists (
    select 1
    from public.employees e
    join public.employees me on me.user_id = auth.uid()
    where e.id = _employee_id
      and e.department_id is not null
      and me.department_id is not null
      and e.department_id = me.department_id
  );
$$;

-- 2) Expand existing org tables (safe ALTERs)
ALTER TABLE public.departments
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS parent_id uuid,
  ADD COLUMN IF NOT EXISTS manager_id uuid,
  ADD COLUMN IF NOT EXISTS budget numeric;

DO $$ BEGIN
  ALTER TABLE public.departments
    ADD CONSTRAINT departments_parent_fk
    FOREIGN KEY (parent_id) REFERENCES public.departments(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.departments
    ADD CONSTRAINT departments_manager_fk
    FOREIGN KEY (manager_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_departments_parent_id ON public.departments(parent_id);
CREATE INDEX IF NOT EXISTS idx_departments_manager_id ON public.departments(manager_id);

ALTER TABLE public.positions
  ADD COLUMN IF NOT EXISTS level text,
  ADD COLUMN IF NOT EXISTS min_salary numeric,
  ADD COLUMN IF NOT EXISTS max_salary numeric,
  ADD COLUMN IF NOT EXISTS requirements jsonb;

ALTER TABLE public.teams
  ADD COLUMN IF NOT EXISTS description text;

-- employees table already exists; add common HR fields (nullable to avoid breaking inserts)
ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS employment_type public.employment_type,
  ADD COLUMN IF NOT EXISTS employment_status public.employment_status,
  ADD COLUMN IF NOT EXISTS salary numeric;

-- 3) New core org tables
CREATE TABLE IF NOT EXISTS public.office_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address jsonb,
  city text,
  country text,
  timezone text,
  is_headquarters boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.employee_teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  role text,
  joined_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (employee_id, team_id)
);

CREATE INDEX IF NOT EXISTS idx_employee_teams_employee_id ON public.employee_teams(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_teams_team_id ON public.employee_teams(team_id);

-- 4) updated_at triggers (idempotent)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_departments_updated_at') THEN
    CREATE TRIGGER trg_departments_updated_at
    BEFORE UPDATE ON public.departments
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_positions_updated_at') THEN
    CREATE TRIGGER trg_positions_updated_at
    BEFORE UPDATE ON public.positions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_teams_updated_at') THEN
    CREATE TRIGGER trg_teams_updated_at
    BEFORE UPDATE ON public.teams
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_employees_updated_at') THEN
    CREATE TRIGGER trg_employees_updated_at
    BEFORE UPDATE ON public.employees
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_office_locations_updated_at') THEN
    CREATE TRIGGER trg_office_locations_updated_at
    BEFORE UPDATE ON public.office_locations
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_employee_teams_updated_at') THEN
    CREATE TRIGGER trg_employee_teams_updated_at
    BEFORE UPDATE ON public.employee_teams
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- 5) RLS
ALTER TABLE public.office_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_teams ENABLE ROW LEVEL SECURITY;

-- Office locations: readable by any authenticated user; writable by HR/Admin
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='office_locations' AND policyname='office_locations_select_authenticated'
  ) THEN
    CREATE POLICY office_locations_select_authenticated
    ON public.office_locations
    FOR SELECT
    USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='office_locations' AND policyname='office_locations_write_hr'
  ) THEN
    CREATE POLICY office_locations_write_hr
    ON public.office_locations
    FOR ALL
    USING (public.is_admin_or_hr(auth.uid()))
    WITH CHECK (public.is_admin_or_hr(auth.uid()));
  END IF;
END $$;

-- Employee teams: employee can manage own rows; HR/Admin can manage all
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='employee_teams' AND policyname='employee_teams_select_own_or_hr'
  ) THEN
    CREATE POLICY employee_teams_select_own_or_hr
    ON public.employee_teams
    FOR SELECT
    USING (public.is_own_employee_id(employee_id) OR public.is_admin_or_hr(auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='employee_teams' AND policyname='employee_teams_insert_own_or_hr'
  ) THEN
    CREATE POLICY employee_teams_insert_own_or_hr
    ON public.employee_teams
    FOR INSERT
    WITH CHECK (public.is_own_employee_id(employee_id) OR public.is_admin_or_hr(auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='employee_teams' AND policyname='employee_teams_update_own_or_hr'
  ) THEN
    CREATE POLICY employee_teams_update_own_or_hr
    ON public.employee_teams
    FOR UPDATE
    USING (public.is_own_employee_id(employee_id) OR public.is_admin_or_hr(auth.uid()))
    WITH CHECK (public.is_own_employee_id(employee_id) OR public.is_admin_or_hr(auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='employee_teams' AND policyname='employee_teams_delete_hr_only'
  ) THEN
    CREATE POLICY employee_teams_delete_hr_only
    ON public.employee_teams
    FOR DELETE
    USING (public.is_admin_or_hr(auth.uid()));
  END IF;
END $$;
