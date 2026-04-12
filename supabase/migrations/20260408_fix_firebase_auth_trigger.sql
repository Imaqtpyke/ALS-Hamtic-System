-- ============================================================
-- COMPREHENSIVE FIX: Firebase UID vs UUID Constraint
-- ============================================================
-- This script fixes the "invalid input syntax for type uuid" error
-- by replacing auth.uid() (which casts to UUID) with a safe
-- Firebase UID extractor in allTriggers and RLS Policies.
-- ============================================================

-- 1. Create a safe Firebase UID extractor helper
CREATE OR REPLACE FUNCTION get_firebase_uid()
RETURNS TEXT AS $$
BEGIN
  RETURN current_setting('request.jwt.claim.sub', true);
END;
$$ LANGUAGE plpgsql STABLE;

-- 2. Update update_updated_at_column trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  
  -- Update status history if status changed
  IF (TG_OP = 'UPDATE') AND (OLD.status IS DISTINCT FROM NEW.status) THEN
    NEW.status_history = OLD.status_history || 
      jsonb_build_object(
        'status', NEW.status,
        'date', to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
        'notes', NEW.notes,
        'updated_by', get_firebase_uid()
      );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Update Role Check helper functions
CREATE OR REPLACE FUNCTION is_student()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = get_firebase_uid()
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
    WHERE id = get_firebase_uid()
      AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Recreate RLS Policies with get_firebase_uid()

-- Drop existing policies first to be safe
DROP POLICY IF EXISTS "Students can view their own enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Students can create their own enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Students can update their own pending enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Create updated policies
CREATE POLICY "Students can view their own enrollments"
  ON public.enrollments
  FOR SELECT
  USING (
    user_id = get_firebase_uid()
    AND is_student()
  );

CREATE POLICY "Students can create their own enrollments"
  ON public.enrollments
  FOR INSERT
  WITH CHECK (
    user_id = get_firebase_uid()
    AND is_student()
    AND status = 'pending'
  );

CREATE POLICY "Students can update their own pending enrollments"
  ON public.enrollments
  FOR UPDATE
  USING (
    user_id = get_firebase_uid()
    AND is_student()
    AND status = 'pending'
  )
  WITH CHECK (
    user_id = get_firebase_uid()
    AND status = 'pending'
  );

CREATE POLICY "Users can view their own profile"
  ON public.profiles
  FOR SELECT
  USING (id = get_firebase_uid());

CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  USING (id = get_firebase_uid());
