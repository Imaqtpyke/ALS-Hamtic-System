-- Phase 2 Expansion: Inquiries & Learning Modules Tables

-- 1. Inquiries Table (Help Desk System)
CREATE TABLE IF NOT EXISTS public.inquiries (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text NOT NULL, -- Firebase UID (No direct FK to enrollments because user_id isn't unique in enrollments)
  subject text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'replied', 'closed')),
  admin_reply text,
  replied_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Learning Modules Table
CREATE TABLE IF NOT EXISTS public.learning_modules (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  strand_id bigint REFERENCES public.subjects(id) ON DELETE SET NULL,
  file_url text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_modules ENABLE ROW LEVEL SECURITY;

-- 3. Inquiries Policies
-- Students: Read/Create own inquiries
DROP POLICY IF EXISTS "Students can manage own inquiries" ON public.inquiries;
CREATE POLICY "Students can manage own inquiries" 
  ON public.inquiries FOR ALL 
  TO authenticated 
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

-- Admins: Full access to all inquiries
DROP POLICY IF EXISTS "Admins can manage all inquiries" ON public.inquiries;
CREATE POLICY "Admins can manage all inquiries" 
  ON public.inquiries FOR ALL 
  TO authenticated 
  USING (is_admin()); -- Uses the is_admin() helper from update_rls.sql

-- 4. Learning Modules Policies
-- Authenticated: View active modules
DROP POLICY IF EXISTS "Students can view active modules" ON public.learning_modules;
CREATE POLICY "Students can view active modules" 
  ON public.learning_modules FOR SELECT 
  TO authenticated 
  USING (is_active = true);

-- Admins: Full access
DROP POLICY IF EXISTS "Admins can manage modules" ON public.learning_modules;
CREATE POLICY "Admins can manage modules" 
  ON public.learning_modules FOR ALL 
  TO authenticated 
  USING (is_admin());

-- 5. Triggers for updated_at
-- (Assuming update_updated_at_column exists from enrollments migration)
DROP TRIGGER IF EXISTS update_inquiries_updated_at ON public.inquiries;
CREATE TRIGGER update_inquiries_updated_at BEFORE UPDATE ON public.inquiries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_learning_modules_updated_at ON public.learning_modules;
CREATE TRIGGER update_learning_modules_updated_at BEFORE UPDATE ON public.learning_modules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add Indexes
CREATE INDEX IF NOT EXISTS idx_inquiries_user_id ON public.inquiries(user_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON public.inquiries(status);

-- Helpful Comments
COMMENT ON TABLE public.inquiries IS 'Help Desk messages for student-admin communication';
COMMENT ON TABLE public.learning_modules IS 'Repository for digital ALS learning resources (PDFs)';
