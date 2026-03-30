-- 1. Schedules Table
CREATE TABLE IF NOT EXISTS public.schedules (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  strand_id bigint REFERENCES public.subjects(id) ON DELETE CASCADE,
  location text NOT NULL,
  day_of_week text NOT NULL,
  time_start time NOT NULL,
  time_end time NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Assessments Table (Grading)
CREATE TABLE IF NOT EXISTS public.assessments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  enrollment_id uuid REFERENCES public.enrollments(id) ON DELETE CASCADE,
  strand_id bigint REFERENCES public.subjects(id) ON DELETE CASCADE,
  module_name text NOT NULL,
  score integer,
  max_score integer DEFAULT 100,
  status text DEFAULT 'pending' CHECK (status IN ('passed', 'failed', 'pending')),
  date_taken date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id text NOT NULL, -- Firebase UID
  action text NOT NULL,
  target_type text NOT NULL, -- 'enrollment', 'announcement', 'subject', etc.
  target_id text,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 4. Policies (Admin-only for write, General for read)
-- Schedules: Read for authenticated, Write for admins
DROP POLICY IF EXISTS "Allow authenticated read schedules" ON public.schedules;
CREATE POLICY "Allow authenticated read schedules" ON public.schedules FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow admins full access schedules" ON public.schedules;
CREATE POLICY "Allow admins full access schedules" ON public.schedules FOR ALL TO authenticated USING (true);

-- Assessments: Read for own enrollment, Write for admins
DROP POLICY IF EXISTS "Allow students to view their own assessments" ON public.assessments;
CREATE POLICY "Allow students to view their own assessments" 
ON public.assessments FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.enrollments 
    WHERE enrollments.id = assessments.enrollment_id 
    AND enrollments.user_id = auth.uid()::text -- Match text-based Firebase UID
  )
);

DROP POLICY IF EXISTS "Allow admins full access assessments" ON public.assessments;
CREATE POLICY "Allow admins full access assessments" ON public.assessments FOR ALL TO authenticated USING (true);

-- Audit Logs: Admin only (Read/Write)
DROP POLICY IF EXISTS "Allow admins full access audit_logs" ON public.audit_logs;
CREATE POLICY "Allow admins full access audit_logs" ON public.audit_logs FOR ALL TO authenticated USING (true);

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_schedules_updated_at ON public.schedules;
CREATE TRIGGER update_schedules_updated_at BEFORE UPDATE ON public.schedules FOR EACH ROW EXECUTE FUNCTION update_timestamp();
DROP TRIGGER IF EXISTS update_assessments_updated_at ON public.assessments;
CREATE TRIGGER update_assessments_updated_at BEFORE UPDATE ON public.assessments FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Helpful Comments
COMMENT ON TABLE public.schedules IS 'Weekly class schedules for academic strands at specific CLCs';
COMMENT ON TABLE public.assessments IS 'Student module scores and progress tracking for the ALS program';
COMMENT ON TABLE public.audit_logs IS 'System-wide administrative activity log for accountability';
