-- Add missing policies for leave_audit_log
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='leave_audit_log' AND policyname='leave_audit_log_select_hr') THEN
    CREATE POLICY leave_audit_log_select_hr ON public.leave_audit_log
      FOR SELECT USING (public.is_admin_or_hr(auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='leave_audit_log' AND policyname='leave_audit_log_write_hr') THEN
    CREATE POLICY leave_audit_log_write_hr ON public.leave_audit_log
      FOR ALL USING (public.is_admin_or_hr(auth.uid()))
      WITH CHECK (public.is_admin_or_hr(auth.uid()));
  END IF;
END $$;
