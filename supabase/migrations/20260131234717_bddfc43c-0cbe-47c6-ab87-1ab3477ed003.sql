-- Single big migration (post-Phase 1): complete remaining HRM schema with safe, additive changes

-- =====================
-- 1) Shared helpers
-- =====================

-- Ensure updated_at trigger exists (already present as function)

-- =====================
-- 2) Attendance & Time Tracking
-- =====================
CREATE TABLE IF NOT EXISTS public.shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  break_duration integer NOT NULL DEFAULT 0,
  days_of_week smallint[] NOT NULL DEFAULT '{1,2,3,4,5}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.clock_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  latitude numeric,
  longitude numeric,
  radius integer,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.attendance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT (now()::date),
  clock_in timestamptz,
  clock_out timestamptz,
  break_duration integer NOT NULL DEFAULT 0,
  total_hours numeric,
  status public.attendance_status NOT NULL DEFAULT 'present',
  location jsonb,
  ip_address text,
  notes text,
  approved_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (employee_id, date)
);

CREATE INDEX IF NOT EXISTS idx_attendance_records_employee_date ON public.attendance_records(employee_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_records_status ON public.attendance_records(status);

CREATE TABLE IF NOT EXISTS public.wfh_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  max_days_per_week integer NOT NULL DEFAULT 2,
  requires_approval boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.wfh_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  end_date date NOT NULL,
  reason text,
  status public.approval_status NOT NULL DEFAULT 'pending',
  approved_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wfh_requests_employee_status ON public.wfh_requests(employee_id, status);

-- =====================
-- 3) Leave Management
-- =====================
CREATE TABLE IF NOT EXISTS public.leave_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  days_allowed_per_year integer NOT NULL DEFAULT 0,
  carry_forward_allowed boolean NOT NULL DEFAULT false,
  max_carry_forward integer NOT NULL DEFAULT 0,
  requires_approval boolean NOT NULL DEFAULT true,
  color text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (name)
);

-- Evolve existing leave_requests table safely
ALTER TABLE public.leave_requests
  ADD COLUMN IF NOT EXISTS leave_type_id uuid REFERENCES public.leave_types(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS total_days numeric,
  ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS rejected_reason text,
  ADD COLUMN IF NOT EXISTS cancellation_reason text;

-- status is currently text; keep it for compatibility but default future rows to approval_status values
-- (We won't convert type to enum here to avoid breaking existing data.)

CREATE INDEX IF NOT EXISTS idx_leave_requests_employee_status ON public.leave_requests(employee_id, status);
CREATE INDEX IF NOT EXISTS idx_leave_requests_leave_type ON public.leave_requests(leave_type_id);

CREATE TABLE IF NOT EXISTS public.employee_leave_balances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  leave_type_id uuid NOT NULL REFERENCES public.leave_types(id) ON DELETE CASCADE,
  year integer NOT NULL,
  total_days numeric NOT NULL DEFAULT 0,
  used_days numeric NOT NULL DEFAULT 0,
  remaining_days numeric NOT NULL DEFAULT 0,
  carry_forward_days numeric NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (employee_id, leave_type_id, year)
);

CREATE INDEX IF NOT EXISTS idx_leave_balances_employee_year ON public.employee_leave_balances(employee_id, year);

CREATE TABLE IF NOT EXISTS public.leave_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  leave_request_id uuid NOT NULL REFERENCES public.leave_requests(id) ON DELETE CASCADE,
  action text NOT NULL,
  performed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  old_status text,
  new_status text,
  comments text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- =====================
-- 4) Payroll & Benefits
-- =====================
CREATE TABLE IF NOT EXISTS public.payroll_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  month integer NOT NULL,
  year integer NOT NULL,
  base_salary numeric NOT NULL DEFAULT 0,
  gross_salary numeric NOT NULL DEFAULT 0,
  deductions jsonb NOT NULL DEFAULT '{}'::jsonb,
  bonuses jsonb NOT NULL DEFAULT '{}'::jsonb,
  net_salary numeric NOT NULL DEFAULT 0,
  payment_date date,
  payment_method text,
  status public.approval_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (employee_id, year, month)
);

CREATE INDEX IF NOT EXISTS idx_payroll_employee_period ON public.payroll_records(employee_id, year DESC, month DESC);

DO $$ BEGIN
  CREATE TYPE public.salary_component_type AS ENUM ('earning','deduction','bonus');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.salary_components (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  component_name text NOT NULL,
  component_type public.salary_component_type NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  percentage numeric,
  is_taxable boolean NOT NULL DEFAULT true,
  effective_from date,
  effective_to date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DO $$ BEGIN
  CREATE TYPE public.benefit_type AS ENUM ('health','retirement','insurance','allowance','other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.benefit_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  type public.benefit_type NOT NULL DEFAULT 'other',
  provider text,
  coverage_amount numeric,
  employee_contribution numeric,
  employer_contribution numeric,
  eligibility jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (name)
);

CREATE TABLE IF NOT EXISTS public.employee_benefits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  benefit_plan_id uuid NOT NULL REFERENCES public.benefit_plans(id) ON DELETE CASCADE,
  enrollment_date date,
  coverage_start date,
  coverage_end date,
  status text NOT NULL DEFAULT 'active',
  beneficiaries jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (employee_id, benefit_plan_id)
);

CREATE TABLE IF NOT EXISTS public.expense_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  max_amount numeric,
  requires_receipt boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (name)
);

CREATE TABLE IF NOT EXISTS public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  category_id uuid REFERENCES public.expense_categories(id) ON DELETE SET NULL,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  date date NOT NULL DEFAULT (now()::date),
  description text,
  receipt_url text,
  status public.approval_status NOT NULL DEFAULT 'pending',
  approved_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  approved_at timestamptz,
  reimbursed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_expenses_employee_date ON public.expenses(employee_id, date DESC);

-- =====================
-- 5) Performance
-- =====================
CREATE TABLE IF NOT EXISTS public.performance_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  reviewer_id uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  review_period_start date,
  review_period_end date,
  overall_rating numeric,
  strengths text,
  areas_for_improvement text,
  goals text,
  comments text,
  status public.approval_status NOT NULL DEFAULT 'pending',
  submitted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.performance_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  target_date date,
  status text NOT NULL DEFAULT 'active',
  progress_percentage integer NOT NULL DEFAULT 0,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.performance_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL REFERENCES public.performance_reviews(id) ON DELETE CASCADE,
  metric_name text NOT NULL,
  rating numeric,
  weight numeric,
  comments text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.competency_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL REFERENCES public.performance_reviews(id) ON DELETE CASCADE,
  competency_name text NOT NULL,
  rating numeric,
  comments text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- =====================
-- 6) Recruitment & Onboarding
-- =====================
CREATE TABLE IF NOT EXISTS public.candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text,
  last_name text,
  email text,
  phone text,
  resume_url text,
  linkedin_url text,
  source text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.job_postings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  position_id uuid REFERENCES public.positions(id) ON DELETE SET NULL,
  description text,
  requirements jsonb NOT NULL DEFAULT '{}'::jsonb,
  employment_type public.employment_type,
  location text,
  salary_range text,
  status text NOT NULL DEFAULT 'open',
  posted_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  posted_at timestamptz,
  closes_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.job_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_posting_id uuid NOT NULL REFERENCES public.job_postings(id) ON DELETE CASCADE,
  candidate_id uuid NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  resume_url text,
  cover_letter text,
  status text NOT NULL DEFAULT 'applied',
  applied_at timestamptz NOT NULL DEFAULT now(),
  reviewed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (job_posting_id, candidate_id)
);

CREATE TABLE IF NOT EXISTS public.interviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.job_applications(id) ON DELETE CASCADE,
  interviewer_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  scheduled_at timestamptz,
  duration integer,
  type text,
  location text,
  status text NOT NULL DEFAULT 'scheduled',
  feedback text,
  rating numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.job_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  position_id uuid REFERENCES public.positions(id) ON DELETE SET NULL,
  offer_letter_url text,
  salary_offered numeric,
  joining_date date,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.onboarding_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  tasks jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (name)
);

CREATE TABLE IF NOT EXISTS public.onboarding_processes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  template_id uuid REFERENCES public.onboarding_templates(id) ON DELETE SET NULL,
  start_date date,
  expected_completion date,
  actual_completion date,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.onboarding_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  process_id uuid NOT NULL REFERENCES public.onboarding_processes(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  assigned_to uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  due_date date,
  completed_at timestamptz,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- =====================
-- 7) Projects & Training
-- =====================
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS start_date date,
  ADD COLUMN IF NOT EXISTS end_date date,
  ADD COLUMN IF NOT EXISTS budget numeric,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS public.project_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  role text,
  allocation_percentage integer,
  joined_at timestamptz NOT NULL DEFAULT now(),
  left_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, employee_id)
);

CREATE TABLE IF NOT EXISTS public.training_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  instructor text,
  duration_hours numeric,
  max_participants integer,
  category text,
  prerequisites jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.training_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.training_courses(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  start_date date,
  completion_date date,
  status text NOT NULL DEFAULT 'enrolled',
  certificate_url text,
  score numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (course_id, employee_id)
);

-- =====================
-- 8) Communication & Compliance
-- =====================
CREATE TABLE IF NOT EXISTS public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text,
  published_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  published_at timestamptz,
  expires_at timestamptz,
  priority text,
  target_audience jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.announcement_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id uuid NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  read_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (announcement_id, user_id)
);

-- Evolve notifications table to include type (existing table already has user_id/title/message/link/is_read/read_at)
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS type text;

-- Messaging
DO $$ BEGIN
  CREATE TYPE public.conversation_type AS ENUM ('direct','group','announcement');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text,
  type public.conversation_type NOT NULL DEFAULT 'direct',
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.conversation_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at timestamptz NOT NULL DEFAULT now(),
  left_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Documents & compliance
CREATE TABLE IF NOT EXISTS public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  title text NOT NULL,
  type text,
  file_url text,
  uploaded_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  uploaded_at timestamptz,
  expires_at timestamptz,
  is_verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.compliance_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  category text,
  due_date date,
  status text NOT NULL DEFAULT 'active',
  assigned_to uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.employee_compliance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  compliance_item_id uuid NOT NULL REFERENCES public.compliance_items(id) ON DELETE CASCADE,
  completed_at timestamptz,
  certificate_url text,
  expiry_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (employee_id, compliance_item_id)
);

-- Audit logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  resource text NOT NULL,
  resource_id uuid,
  old_value jsonb,
  new_value jsonb,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- =====================
-- 9) System settings & preferences
-- =====================
CREATE TABLE IF NOT EXISTS public.system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  description text,
  updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (key)
);

CREATE TABLE IF NOT EXISTS public.user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  theme text,
  language text,
  notifications_enabled boolean NOT NULL DEFAULT true,
  preferences jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

-- =====================
-- 10) Triggers for updated_at
-- =====================
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_shifts_updated_at') THEN
  CREATE TRIGGER trg_shifts_updated_at BEFORE UPDATE ON public.shifts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_clock_locations_updated_at') THEN
  CREATE TRIGGER trg_clock_locations_updated_at BEFORE UPDATE ON public.clock_locations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_attendance_records_updated_at') THEN
  CREATE TRIGGER trg_attendance_records_updated_at BEFORE UPDATE ON public.attendance_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_wfh_policies_updated_at') THEN
  CREATE TRIGGER trg_wfh_policies_updated_at BEFORE UPDATE ON public.wfh_policies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_wfh_requests_updated_at') THEN
  CREATE TRIGGER trg_wfh_requests_updated_at BEFORE UPDATE ON public.wfh_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_leave_types_updated_at') THEN
  CREATE TRIGGER trg_leave_types_updated_at BEFORE UPDATE ON public.leave_types
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_leave_requests_updated_at') THEN
  CREATE TRIGGER trg_leave_requests_updated_at BEFORE UPDATE ON public.leave_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_leave_balances_updated_at') THEN
  CREATE TRIGGER trg_leave_balances_updated_at BEFORE UPDATE ON public.employee_leave_balances
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_payroll_records_updated_at') THEN
  CREATE TRIGGER trg_payroll_records_updated_at BEFORE UPDATE ON public.payroll_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_salary_components_updated_at') THEN
  CREATE TRIGGER trg_salary_components_updated_at BEFORE UPDATE ON public.salary_components
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_benefit_plans_updated_at') THEN
  CREATE TRIGGER trg_benefit_plans_updated_at BEFORE UPDATE ON public.benefit_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_employee_benefits_updated_at') THEN
  CREATE TRIGGER trg_employee_benefits_updated_at BEFORE UPDATE ON public.employee_benefits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_expense_categories_updated_at') THEN
  CREATE TRIGGER trg_expense_categories_updated_at BEFORE UPDATE ON public.expense_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_expenses_updated_at') THEN
  CREATE TRIGGER trg_expenses_updated_at BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_performance_reviews_updated_at') THEN
  CREATE TRIGGER trg_performance_reviews_updated_at BEFORE UPDATE ON public.performance_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_performance_goals_updated_at') THEN
  CREATE TRIGGER trg_performance_goals_updated_at BEFORE UPDATE ON public.performance_goals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_performance_metrics_updated_at') THEN
  CREATE TRIGGER trg_performance_metrics_updated_at BEFORE UPDATE ON public.performance_metrics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_competency_ratings_updated_at') THEN
  CREATE TRIGGER trg_competency_ratings_updated_at BEFORE UPDATE ON public.competency_ratings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_candidates_updated_at') THEN
  CREATE TRIGGER trg_candidates_updated_at BEFORE UPDATE ON public.candidates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_job_postings_updated_at') THEN
  CREATE TRIGGER trg_job_postings_updated_at BEFORE UPDATE ON public.job_postings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_job_applications_updated_at') THEN
  CREATE TRIGGER trg_job_applications_updated_at BEFORE UPDATE ON public.job_applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_interviews_updated_at') THEN
  CREATE TRIGGER trg_interviews_updated_at BEFORE UPDATE ON public.interviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_job_offers_updated_at') THEN
  CREATE TRIGGER trg_job_offers_updated_at BEFORE UPDATE ON public.job_offers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_onboarding_templates_updated_at') THEN
  CREATE TRIGGER trg_onboarding_templates_updated_at BEFORE UPDATE ON public.onboarding_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_onboarding_processes_updated_at') THEN
  CREATE TRIGGER trg_onboarding_processes_updated_at BEFORE UPDATE ON public.onboarding_processes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_onboarding_tasks_updated_at') THEN
  CREATE TRIGGER trg_onboarding_tasks_updated_at BEFORE UPDATE ON public.onboarding_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_projects_updated_at') THEN
  CREATE TRIGGER trg_projects_updated_at BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_project_members_updated_at') THEN
  CREATE TRIGGER trg_project_members_updated_at BEFORE UPDATE ON public.project_members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_training_courses_updated_at') THEN
  CREATE TRIGGER trg_training_courses_updated_at BEFORE UPDATE ON public.training_courses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_training_enrollments_updated_at') THEN
  CREATE TRIGGER trg_training_enrollments_updated_at BEFORE UPDATE ON public.training_enrollments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_announcements_updated_at') THEN
  CREATE TRIGGER trg_announcements_updated_at BEFORE UPDATE ON public.announcements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_conversations_updated_at') THEN
  CREATE TRIGGER trg_conversations_updated_at BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_conversation_participants_updated_at') THEN
  CREATE TRIGGER trg_conversation_participants_updated_at BEFORE UPDATE ON public.conversation_participants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_messages_updated_at') THEN
  CREATE TRIGGER trg_messages_updated_at BEFORE UPDATE ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_documents_updated_at') THEN
  CREATE TRIGGER trg_documents_updated_at BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_compliance_items_updated_at') THEN
  CREATE TRIGGER trg_compliance_items_updated_at BEFORE UPDATE ON public.compliance_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_employee_compliance_updated_at') THEN
  CREATE TRIGGER trg_employee_compliance_updated_at BEFORE UPDATE ON public.employee_compliance
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_system_settings_updated_at') THEN
  CREATE TRIGGER trg_system_settings_updated_at BEFORE UPDATE ON public.system_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_user_preferences_updated_at') THEN
  CREATE TRIGGER trg_user_preferences_updated_at BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
END IF; END $$;

-- =====================
-- 11) RLS for new tables (pattern: own employee or HR)
-- =====================
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clock_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wfh_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wfh_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salary_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.benefit_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_benefits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competency_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_processes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_compliance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Read-only reference data
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='leave_types' AND policyname='leave_types_read_authenticated') THEN
    CREATE POLICY leave_types_read_authenticated ON public.leave_types FOR SELECT USING (true);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='leave_types' AND policyname='leave_types_write_hr') THEN
    CREATE POLICY leave_types_write_hr ON public.leave_types FOR ALL
      USING (public.is_admin_or_hr(auth.uid()))
      WITH CHECK (public.is_admin_or_hr(auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='expense_categories' AND policyname='expense_categories_read_authenticated') THEN
    CREATE POLICY expense_categories_read_authenticated ON public.expense_categories FOR SELECT USING (true);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='expense_categories' AND policyname='expense_categories_write_hr') THEN
    CREATE POLICY expense_categories_write_hr ON public.expense_categories FOR ALL
      USING (public.is_admin_or_hr(auth.uid()))
      WITH CHECK (public.is_admin_or_hr(auth.uid()));
  END IF;
END $$;

-- Employee-scoped tables (own or HR)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='attendance_records' AND policyname='attendance_records_select_own_or_hr') THEN
    CREATE POLICY attendance_records_select_own_or_hr ON public.attendance_records
      FOR SELECT USING (public.is_own_employee_id(employee_id) OR public.is_admin_or_hr(auth.uid()));
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='attendance_records' AND policyname='attendance_records_insert_own') THEN
    CREATE POLICY attendance_records_insert_own ON public.attendance_records
      FOR INSERT WITH CHECK (public.is_own_employee_id(employee_id));
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='attendance_records' AND policyname='attendance_records_update_own_or_hr') THEN
    CREATE POLICY attendance_records_update_own_or_hr ON public.attendance_records
      FOR UPDATE USING (public.is_own_employee_id(employee_id) OR public.is_admin_or_hr(auth.uid()))
      WITH CHECK (public.is_own_employee_id(employee_id) OR public.is_admin_or_hr(auth.uid()));
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='attendance_records' AND policyname='attendance_records_delete_hr_only') THEN
    CREATE POLICY attendance_records_delete_hr_only ON public.attendance_records
      FOR DELETE USING (public.is_admin_or_hr(auth.uid()));
  END IF;
END $$;

-- wfh
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='wfh_requests' AND policyname='wfh_requests_select_own_or_hr') THEN
    CREATE POLICY wfh_requests_select_own_or_hr ON public.wfh_requests
      FOR SELECT USING (public.is_own_employee_id(employee_id) OR public.is_admin_or_hr(auth.uid()));
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='wfh_requests' AND policyname='wfh_requests_insert_own') THEN
    CREATE POLICY wfh_requests_insert_own ON public.wfh_requests
      FOR INSERT WITH CHECK (public.is_own_employee_id(employee_id));
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='wfh_requests' AND policyname='wfh_requests_update_own_or_hr') THEN
    CREATE POLICY wfh_requests_update_own_or_hr ON public.wfh_requests
      FOR UPDATE USING (public.is_own_employee_id(employee_id) OR public.is_admin_or_hr(auth.uid()))
      WITH CHECK (public.is_own_employee_id(employee_id) OR public.is_admin_or_hr(auth.uid()));
  END IF;
END $$;

-- leave balances
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='employee_leave_balances' AND policyname='leave_balances_select_own_or_hr') THEN
    CREATE POLICY leave_balances_select_own_or_hr ON public.employee_leave_balances
      FOR SELECT USING (public.is_own_employee_id(employee_id) OR public.is_admin_or_hr(auth.uid()));
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='employee_leave_balances' AND policyname='leave_balances_write_hr') THEN
    CREATE POLICY leave_balances_write_hr ON public.employee_leave_balances
      FOR ALL USING (public.is_admin_or_hr(auth.uid()))
      WITH CHECK (public.is_admin_or_hr(auth.uid()));
  END IF;
END $$;

-- payroll
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='payroll_records' AND policyname='payroll_select_own_or_hr') THEN
    CREATE POLICY payroll_select_own_or_hr ON public.payroll_records
      FOR SELECT USING (public.is_own_employee_id(employee_id) OR public.is_admin_or_hr(auth.uid()));
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='payroll_records' AND policyname='payroll_write_hr') THEN
    CREATE POLICY payroll_write_hr ON public.payroll_records
      FOR ALL USING (public.is_admin_or_hr(auth.uid()))
      WITH CHECK (public.is_admin_or_hr(auth.uid()));
  END IF;
END $$;

-- expenses
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='expenses' AND policyname='expenses_select_own_or_hr') THEN
    CREATE POLICY expenses_select_own_or_hr ON public.expenses
      FOR SELECT USING (public.is_own_employee_id(employee_id) OR public.is_admin_or_hr(auth.uid()));
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='expenses' AND policyname='expenses_insert_own') THEN
    CREATE POLICY expenses_insert_own ON public.expenses
      FOR INSERT WITH CHECK (public.is_own_employee_id(employee_id));
  END IF;
END $$;

-- system settings: HR/Admin only
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='system_settings' AND policyname='system_settings_hr_only') THEN
    CREATE POLICY system_settings_hr_only ON public.system_settings
      FOR ALL USING (public.is_admin_or_hr(auth.uid()))
      WITH CHECK (public.is_admin_or_hr(auth.uid()));
  END IF;
END $$;

-- user preferences: own only
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='user_preferences' AND policyname='user_preferences_select_own') THEN
    CREATE POLICY user_preferences_select_own ON public.user_preferences
      FOR SELECT USING (user_id = auth.uid());
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='user_preferences' AND policyname='user_preferences_upsert_own') THEN
    CREATE POLICY user_preferences_upsert_own ON public.user_preferences
      FOR INSERT WITH CHECK (user_id = auth.uid());
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='user_preferences' AND policyname='user_preferences_update_own') THEN
    CREATE POLICY user_preferences_update_own ON public.user_preferences
      FOR UPDATE USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;
