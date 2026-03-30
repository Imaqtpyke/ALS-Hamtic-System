-- This migration is used to fix the uuid vs text type mismatch for Firebase UIDs.
-- We must drop any policies that reference these columns before altering their types.

-- 1. Drop dependent policies
DROP POLICY IF EXISTS "Allow students to view their own assessments" ON public.assessments;
DROP POLICY IF EXISTS "Students can view their own enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Students can create their own enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Students can update their own pending enrollments" ON public.enrollments;

-- 2. Alter table enrollments to change user_id from uuid to text
ALTER TABLE public.enrollments 
ALTER COLUMN user_id TYPE TEXT;

-- 3. Alter table profiles to change id from uuid to text
-- (If profiles table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
        ALTER TABLE public.profiles ALTER COLUMN id TYPE TEXT;
    END IF;
END $$;

-- 4. Re-create the most critical policy (Assessments)
-- Note: The rest are usually re-created by running update_rls.sql
CREATE POLICY "Allow students to view their own assessments" 
ON public.assessments FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.enrollments 
    WHERE enrollments.id = assessments.enrollment_id 
    AND enrollments.user_id = auth.uid()::text 
  )
);