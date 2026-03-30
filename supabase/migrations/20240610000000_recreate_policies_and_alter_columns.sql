-- Drop RLS policies that depend on user_id or id
DROP POLICY IF EXISTS "Students can view their own enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Students can create their own enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Students can update their own pending enrollments" ON public.enrollments;

DROP POLICY IF EXISTS "Admins can view all enrollments" ON public.enrollments; -- Re-add if needed
DROP POLICY IF EXISTS "Admins can manage enrollments" ON public.enrollments; -- Re-add if needed

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Drop foreign key constraint on profiles.id if it exists and links to auth.users.id
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Drop helper functions that depend on profiles.id (if they exist and depend on the old type)
DROP FUNCTION IF EXISTS public.is_student();
DROP FUNCTION IF EXISTS public.is_admin();

-- Alter table enrollments to change user_id from uuid to text
ALTER TABLE public.enrollments
ALTER COLUMN user_id TYPE TEXT;

-- Alter table profiles to change id from uuid to text
ALTER TABLE public.profiles
ALTER COLUMN id TYPE TEXT;

-- Re-create helper functions for user role checks (now using TEXT for id)
CREATE OR REPLACE FUNCTION is_student()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'student'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-create policies for students
CREATE POLICY "Students can view their own enrollments"
  ON public.enrollments
  FOR SELECT
  USING (
    user_id = auth.uid()
    AND is_student()
  );

CREATE POLICY "Students can create their own enrollments"
  ON public.enrollments
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND is_student()
    AND status = 'pending'
  );

CREATE POLICY "Students can update their own pending enrollments"
  ON public.enrollments
  FOR UPDATE
  USING (
    user_id = auth.uid()
    AND is_student()
    AND status = 'pending'
  )
  WITH CHECK (
    user_id = auth.uid()
    AND status = 'pending'
  );

-- Re-create policies for admins
CREATE POLICY "Admins can view all enrollments"
  ON public.enrollments
  FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can manage enrollments"
  ON public.enrollments
  FOR ALL
  USING (is_admin())
  WITH CHECK (
    is_admin()
    AND (
      CASE 
        WHEN status = 'pending' THEN true  -- Admins can create pending enrollments
        WHEN status IN ('approved', 'rejected') THEN true  -- Admins can approve/reject
        WHEN status IN ('enrolled', 'withdrawn') THEN true  -- Admins can enroll/withdraw
        WHEN status IN ('completed', 'dropped') THEN true  -- Admins can complete/drop
        ELSE false
      END
    )
  );

-- Re-create policy for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles
  FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  USING (id = auth.uid()); 