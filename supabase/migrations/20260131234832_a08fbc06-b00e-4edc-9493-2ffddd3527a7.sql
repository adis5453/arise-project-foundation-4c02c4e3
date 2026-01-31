-- Fix security linter: add missing RLS policies for Phase 2+ tables

-- Utility: HR-only policy creator pattern via DO blocks per table/policy

-- 1) Reference/admin-managed tables: shifts, clock_locations, wfh_policies, salary_components, benefit_plans, announcements, job_postings, onboarding_templates, training_courses, compliance_items

-- shifts
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='shifts' AND policyname='shifts_read_authenticated') THEN
    CREATE POLICY shifts_read_authenticated ON public.shifts FOR SELECT USING (true);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='shifts' AND policyname='shifts_write_hr') THEN
    CREATE POLICY shifts_write_hr ON public.shifts FOR ALL
      USING (public.is_admin_or_hr(auth.uid()))
      WITH CHECK (public.is_admin_or_hr(auth.uid()));
  END IF;
END $$;

-- clock_locations
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='clock_locations' AND policyname='clock_locations_read_authenticated') THEN
    CREATE POLICY clock_locations_read_authenticated ON public.clock_locations FOR SELECT USING (true);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='clock_locations' AND policyname='clock_locations_write_hr') THEN
    CREATE POLICY clock_locations_write_hr ON public.clock_locations FOR ALL
      USING (public.is_admin_or_hr(auth.uid()))
      WITH CHECK (public.is_admin_or_hr(auth.uid()));
  END IF;
END $$;

-- wfh_policies
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='wfh_policies' AND policyname='wfh_policies_read_authenticated') THEN
    CREATE POLICY wfh_policies_read_authenticated ON public.wfh_policies FOR SELECT USING (true);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='wfh_policies' AND policyname='wfh_policies_write_hr') THEN
    CREATE POLICY wfh_policies_write_hr ON public.wfh_policies FOR ALL
      USING (public.is_admin_or_hr(auth.uid()))
      WITH CHECK (public.is_admin_or_hr(auth.uid()));
  END IF;
END $$;

-- salary_components (HR only)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='salary_components' AND policyname='salary_components_select_hr') THEN
    CREATE POLICY salary_components_select_hr ON public.salary_components
      FOR SELECT USING (public.is_admin_or_hr(auth.uid()));
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='salary_components' AND policyname='salary_components_write_hr') THEN
    CREATE POLICY salary_components_write_hr ON public.salary_components
      FOR ALL USING (public.is_admin_or_hr(auth.uid()))
      WITH CHECK (public.is_admin_or_hr(auth.uid()));
  END IF;
END $$;

-- benefit_plans
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='benefit_plans' AND policyname='benefit_plans_read_authenticated') THEN
    CREATE POLICY benefit_plans_read_authenticated ON public.benefit_plans
      FOR SELECT USING (true);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='benefit_plans' AND policyname='benefit_plans_write_hr') THEN
    CREATE POLICY benefit_plans_write_hr ON public.benefit_plans
      FOR ALL USING (public.is_admin_or_hr(auth.uid()))
      WITH CHECK (public.is_admin_or_hr(auth.uid()));
  END IF;
END $$;

-- announcements
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='announcements' AND policyname='announcements_read_authenticated') THEN
    CREATE POLICY announcements_read_authenticated ON public.announcements
      FOR SELECT USING (true);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='announcements' AND policyname='announcements_write_hr') THEN
    CREATE POLICY announcements_write_hr ON public.announcements
      FOR ALL USING (public.is_admin_or_hr(auth.uid()))
      WITH CHECK (public.is_admin_or_hr(auth.uid()));
  END IF;
END $$;

-- job_postings
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='job_postings' AND policyname='job_postings_read_authenticated') THEN
    CREATE POLICY job_postings_read_authenticated ON public.job_postings
      FOR SELECT USING (true);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='job_postings' AND policyname='job_postings_write_hr') THEN
    CREATE POLICY job_postings_write_hr ON public.job_postings
      FOR ALL USING (public.is_admin_or_hr(auth.uid()))
      WITH CHECK (public.is_admin_or_hr(auth.uid()));
  END IF;
END $$;

-- onboarding_templates
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='onboarding_templates' AND policyname='onboarding_templates_read_authenticated') THEN
    CREATE POLICY onboarding_templates_read_authenticated ON public.onboarding_templates
      FOR SELECT USING (true);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='onboarding_templates' AND policyname='onboarding_templates_write_hr') THEN
    CREATE POLICY onboarding_templates_write_hr ON public.onboarding_templates
      FOR ALL USING (public.is_admin_or_hr(auth.uid()))
      WITH CHECK (public.is_admin_or_hr(auth.uid()));
  END IF;
END $$;

-- training_courses
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='training_courses' AND policyname='training_courses_read_authenticated') THEN
    CREATE POLICY training_courses_read_authenticated ON public.training_courses
      FOR SELECT USING (true);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='training_courses' AND policyname='training_courses_write_hr') THEN
    CREATE POLICY training_courses_write_hr ON public.training_courses
      FOR ALL USING (public.is_admin_or_hr(auth.uid()))
      WITH CHECK (public.is_admin_or_hr(auth.uid()));
  END IF;
END $$;

-- compliance_items
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='compliance_items' AND policyname='compliance_items_select_own_or_hr') THEN
    CREATE POLICY compliance_items_select_own_or_hr ON public.compliance_items
      FOR SELECT USING ((assigned_to = auth.uid()) OR public.is_admin_or_hr(auth.uid()));
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='compliance_items' AND policyname='compliance_items_write_hr') THEN
    CREATE POLICY compliance_items_write_hr ON public.compliance_items
      FOR ALL USING (public.is_admin_or_hr(auth.uid()))
      WITH CHECK (public.is_admin_or_hr(auth.uid()));
  END IF;
END $$;

-- 2) Employee-scoped tables: employee_benefits, performance_*, candidates, job_applications, interviews, job_offers, onboarding_processes, onboarding_tasks, project_members, training_enrollments, announcement_reads, documents, employee_compliance

-- employee_benefits
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='employee_benefits' AND policyname='employee_benefits_select_own_or_hr') THEN
    CREATE POLICY employee_benefits_select_own_or_hr ON public.employee_benefits
      FOR SELECT USING (public.is_own_employee_id(employee_id) OR public.is_admin_or_hr(auth.uid()));
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='employee_benefits' AND policyname='employee_benefits_write_hr') THEN
    CREATE POLICY employee_benefits_write_hr ON public.employee_benefits
      FOR ALL USING (public.is_admin_or_hr(auth.uid()))
      WITH CHECK (public.is_admin_or_hr(auth.uid()));
  END IF;
END $$;

-- performance_reviews
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='performance_reviews' AND policyname='performance_reviews_select_own_or_hr') THEN
    CREATE POLICY performance_reviews_select_own_or_hr ON public.performance_reviews
      FOR SELECT USING (public.is_own_employee_id(employee_id) OR public.is_admin_or_hr(auth.uid()));
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='performance_reviews' AND policyname='performance_reviews_write_hr') THEN
    CREATE POLICY performance_reviews_write_hr ON public.performance_reviews
      FOR ALL USING (public.is_admin_or_hr(auth.uid()))
      WITH CHECK (public.is_admin_or_hr(auth.uid()));
  END IF;
END $$;

-- performance_goals
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='performance_goals' AND policyname='performance_goals_select_own_or_hr') THEN
    CREATE POLICY performance_goals_select_own_or_hr ON public.performance_goals
      FOR SELECT USING (public.is_own_employee_id(employee_id) OR public.is_admin_or_hr(auth.uid()));
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='performance_goals' AND policyname='performance_goals_insert_own_or_hr') THEN
    CREATE POLICY performance_goals_insert_own_or_hr ON public.performance_goals
      FOR INSERT WITH CHECK (public.is_own_employee_id(employee_id) OR public.is_admin_or_hr(auth.uid()));
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='performance_goals' AND policyname='performance_goals_update_own_or_hr') THEN
    CREATE POLICY performance_goals_update_own_or_hr ON public.performance_goals
      FOR UPDATE USING (public.is_own_employee_id(employee_id) OR public.is_admin_or_hr(auth.uid()))
      WITH CHECK (public.is_own_employee_id(employee_id) OR public.is_admin_or_hr(auth.uid()));
  END IF;
END $$;

-- performance_metrics / competency_ratings: HR only (derived from reviews)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='performance_metrics' AND policyname='performance_metrics_select_hr') THEN
    CREATE POLICY performance_metrics_select_hr ON public.performance_metrics
      FOR SELECT USING (public.is_admin_or_hr(auth.uid()));
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='performance_metrics' AND policyname='performance_metrics_write_hr') THEN
    CREATE POLICY performance_metrics_write_hr ON public.performance_metrics
      FOR ALL USING (public.is_admin_or_hr(auth.uid()))
      WITH CHECK (public.is_admin_or_hr(auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='competency_ratings' AND policyname='competency_ratings_select_hr') THEN
    CREATE POLICY competency_ratings_select_hr ON public.competency_ratings
      FOR SELECT USING (public.is_admin_or_hr(auth.uid()));
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='competency_ratings' AND policyname='competency_ratings_write_hr') THEN
    CREATE POLICY competency_ratings_write_hr ON public.competency_ratings
      FOR ALL USING (public.is_admin_or_hr(auth.uid()))
      WITH CHECK (public.is_admin_or_hr(auth.uid()));
  END IF;
END $$;

-- candidates: HR only
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='candidates' AND policyname='candidates_select_hr') THEN
    CREATE POLICY candidates_select_hr ON public.candidates
      FOR SELECT USING (public.is_admin_or_hr(auth.uid()));
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='candidates' AND policyname='candidates_write_hr') THEN
    CREATE POLICY candidates_write_hr ON public.candidates
      FOR ALL USING (public.is_admin_or_hr(auth.uid()))
      WITH CHECK (public.is_admin_or_hr(auth.uid()));
  END IF;
END $$;

-- job_applications: HR only
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='job_applications' AND policyname='job_applications_select_hr') THEN
    CREATE POLICY job_applications_select_hr ON public.job_applications
      FOR SELECT USING (public.is_admin_or_hr(auth.uid()));
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='job_applications' AND policyname='job_applications_write_hr') THEN
    CREATE POLICY job_applications_write_hr ON public.job_applications
      FOR ALL USING (public.is_admin_or_hr(auth.uid()))
      WITH CHECK (public.is_admin_or_hr(auth.uid()));
  END IF;
END $$;

-- interviews: HR only
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='interviews' AND policyname='interviews_select_hr') THEN
    CREATE POLICY interviews_select_hr ON public.interviews
      FOR SELECT USING (public.is_admin_or_hr(auth.uid()));
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='interviews' AND policyname='interviews_write_hr') THEN
    CREATE POLICY interviews_write_hr ON public.interviews
      FOR ALL USING (public.is_admin_or_hr(auth.uid()))
      WITH CHECK (public.is_admin_or_hr(auth.uid()));
  END IF;
END $$;

-- job_offers: HR only
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='job_offers' AND policyname='job_offers_select_hr') THEN
    CREATE POLICY job_offers_select_hr ON public.job_offers
      FOR SELECT USING (public.is_admin_or_hr(auth.uid()));
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='job_offers' AND policyname='job_offers_write_hr') THEN
    CREATE POLICY job_offers_write_hr ON public.job_offers
      FOR ALL USING (public.is_admin_or_hr(auth.uid()))
      WITH CHECK (public.is_admin_or_hr(auth.uid()));
  END IF;
END $$;

-- onboarding_processes: employee or HR
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='onboarding_processes' AND policyname='onboarding_processes_select_own_or_hr') THEN
    CREATE POLICY onboarding_processes_select_own_or_hr ON public.onboarding_processes
      FOR SELECT USING (public.is_own_employee_id(employee_id) OR public.is_admin_or_hr(auth.uid()));
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='onboarding_processes' AND policyname='onboarding_processes_write_hr') THEN
    CREATE POLICY onboarding_processes_write_hr ON public.onboarding_processes
      FOR ALL USING (public.is_admin_or_hr(auth.uid()))
      WITH CHECK (public.is_admin_or_hr(auth.uid()));
  END IF;
END $$;

-- onboarding_tasks: HR only (assigned_to is profile id)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='onboarding_tasks' AND policyname='onboarding_tasks_select_hr') THEN
    CREATE POLICY onboarding_tasks_select_hr ON public.onboarding_tasks
      FOR SELECT USING (public.is_admin_or_hr(auth.uid()));
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='onboarding_tasks' AND policyname='onboarding_tasks_write_hr') THEN
    CREATE POLICY onboarding_tasks_write_hr ON public.onboarding_tasks
      FOR ALL USING (public.is_admin_or_hr(auth.uid()))
      WITH CHECK (public.is_admin_or_hr(auth.uid()));
  END IF;
END $$;

-- project_members: own employee rows or HR
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='project_members' AND policyname='project_members_select_own_or_hr') THEN
    CREATE POLICY project_members_select_own_or_hr ON public.project_members
      FOR SELECT USING (public.is_own_employee_id(employee_id) OR public.is_admin_or_hr(auth.uid()));
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='project_members' AND policyname='project_members_write_hr') THEN
    CREATE POLICY project_members_write_hr ON public.project_members
      FOR ALL USING (public.is_admin_or_hr(auth.uid()))
      WITH CHECK (public.is_admin_or_hr(auth.uid()));
  END IF;
END $$;

-- training_enrollments: own employee rows or HR
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='training_enrollments' AND policyname='training_enrollments_select_own_or_hr') THEN
    CREATE POLICY training_enrollments_select_own_or_hr ON public.training_enrollments
      FOR SELECT USING (public.is_own_employee_id(employee_id) OR public.is_admin_or_hr(auth.uid()));
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='training_enrollments' AND policyname='training_enrollments_insert_own_or_hr') THEN
    CREATE POLICY training_enrollments_insert_own_or_hr ON public.training_enrollments
      FOR INSERT WITH CHECK (public.is_own_employee_id(employee_id) OR public.is_admin_or_hr(auth.uid()));
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='training_enrollments' AND policyname='training_enrollments_update_hr') THEN
    CREATE POLICY training_enrollments_update_hr ON public.training_enrollments
      FOR UPDATE USING (public.is_admin_or_hr(auth.uid()))
      WITH CHECK (public.is_admin_or_hr(auth.uid()));
  END IF;
END $$;

-- announcement_reads: own only
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='announcement_reads' AND policyname='announcement_reads_select_own') THEN
    CREATE POLICY announcement_reads_select_own ON public.announcement_reads
      FOR SELECT USING (user_id = auth.uid() OR public.is_admin_or_hr(auth.uid()));
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='announcement_reads' AND policyname='announcement_reads_insert_own') THEN
    CREATE POLICY announcement_reads_insert_own ON public.announcement_reads
      FOR INSERT WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- documents: own employee docs or HR
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='documents' AND policyname='documents_select_own_or_hr') THEN
    CREATE POLICY documents_select_own_or_hr ON public.documents
      FOR SELECT USING (
        (employee_id is not null AND public.is_own_employee_id(employee_id))
        OR public.is_admin_or_hr(auth.uid())
      );
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='documents' AND policyname='documents_write_hr') THEN
    CREATE POLICY documents_write_hr ON public.documents
      FOR ALL USING (public.is_admin_or_hr(auth.uid()))
      WITH CHECK (public.is_admin_or_hr(auth.uid()));
  END IF;
END $$;

-- employee_compliance: own employee rows or HR
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='employee_compliance' AND policyname='employee_compliance_select_own_or_hr') THEN
    CREATE POLICY employee_compliance_select_own_or_hr ON public.employee_compliance
      FOR SELECT USING (public.is_own_employee_id(employee_id) OR public.is_admin_or_hr(auth.uid()));
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='employee_compliance' AND policyname='employee_compliance_write_hr') THEN
    CREATE POLICY employee_compliance_write_hr ON public.employee_compliance
      FOR ALL USING (public.is_admin_or_hr(auth.uid()))
      WITH CHECK (public.is_admin_or_hr(auth.uid()));
  END IF;
END $$;

-- audit_logs: HR only (and insert allowed for all authenticated via app layer; keep HR-only for now)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='audit_logs' AND policyname='audit_logs_hr_only') THEN
    CREATE POLICY audit_logs_hr_only ON public.audit_logs
      FOR ALL USING (public.is_admin_or_hr(auth.uid()))
      WITH CHECK (public.is_admin_or_hr(auth.uid()));
  END IF;
END $$;

-- Messaging: allow participants to read their conversations/messages; HR can manage
-- conversations
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='conversations' AND policyname='conversations_select_participant') THEN
    CREATE POLICY conversations_select_participant ON public.conversations
      FOR SELECT USING (
        public.is_admin_or_hr(auth.uid())
        OR exists (
          select 1 from public.conversation_participants cp
          where cp.conversation_id = conversations.id and cp.user_id = auth.uid()
        )
      );
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='conversations' AND policyname='conversations_write_participant') THEN
    CREATE POLICY conversations_write_participant ON public.conversations
      FOR INSERT WITH CHECK (created_by = auth.uid() OR public.is_admin_or_hr(auth.uid()));
  END IF;
END $$;

-- conversation_participants
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='conversation_participants' AND policyname='conversation_participants_select_own_or_hr') THEN
    CREATE POLICY conversation_participants_select_own_or_hr ON public.conversation_participants
      FOR SELECT USING (user_id = auth.uid() OR public.is_admin_or_hr(auth.uid()));
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='conversation_participants' AND policyname='conversation_participants_insert_own_or_hr') THEN
    CREATE POLICY conversation_participants_insert_own_or_hr ON public.conversation_participants
      FOR INSERT WITH CHECK (user_id = auth.uid() OR public.is_admin_or_hr(auth.uid()));
  END IF;
END $$;

-- messages
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='messages' AND policyname='messages_select_participant') THEN
    CREATE POLICY messages_select_participant ON public.messages
      FOR SELECT USING (
        public.is_admin_or_hr(auth.uid())
        OR exists (
          select 1 from public.conversation_participants cp
          where cp.conversation_id = messages.conversation_id and cp.user_id = auth.uid()
        )
      );
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='messages' AND policyname='messages_insert_sender') THEN
    CREATE POLICY messages_insert_sender ON public.messages
      FOR INSERT WITH CHECK (sender_id = auth.uid());
  END IF;
END $$;
