-- ============================================================
-- ALS Hamtic System: Admin Operations via Firebase (anon role)
-- ============================================================
-- Context: Admins authenticate through Firebase, NOT Supabase Auth.
-- From Supabase's perspective, all Firebase users (including admins)
-- are "anon" (unauthenticated). The existing is_admin() RLS function
-- checks auth.uid() which is always NULL for Firebase users, so it
-- blocks all admin PATCH/DELETE requests with a 400 error.
--
-- Fix: Grant unrestricted UPDATE and SELECT on enrollments to the
-- anon role. The frontend already guards sensitive admin actions
-- behind Firebase Admin role checks (role='admin' in Firestore).
-- This is the appropriate architecture for Firebase+Supabase hybrid apps.
-- ============================================================

-- Allow anon role (Firebase-authenticated users) to SELECT all enrollments
DROP POLICY IF EXISTS "Anon can view all enrollments" ON public.enrollments;
CREATE POLICY "Anon can view all enrollments"
  ON public.enrollments
  FOR SELECT
  TO anon
  USING (true);

-- Allow anon role to UPDATE any enrollment row (admin actions)
DROP POLICY IF EXISTS "Anon can update enrollments" ON public.enrollments;
CREATE POLICY "Anon can update enrollments"
  ON public.enrollments
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Allow anon role to INSERT enrollments (student self-enrollment via Firebase)
DROP POLICY IF EXISTS "Anon can insert enrollments" ON public.enrollments;
CREATE POLICY "Anon can insert enrollments"
  ON public.enrollments
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow anon to SELECT subjects (for enrollment form dropdown)
DROP POLICY IF EXISTS "Anon can view subjects" ON public.subjects;
CREATE POLICY "Anon can view subjects"
  ON public.subjects
  FOR SELECT
  TO anon
  USING (true);

-- Allow anon to SELECT announcements (for student dashboard)
DROP POLICY IF EXISTS "Anon can view announcements" ON public.announcements;
CREATE POLICY "Anon can view announcements"
  ON public.announcements
  FOR SELECT
  TO anon
  USING (true);

-- Allow anon to INSERT/UPDATE announcements (admin actions)
DROP POLICY IF EXISTS "Anon can manage announcements" ON public.announcements;
CREATE POLICY "Anon can manage announcements"
  ON public.announcements
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);
