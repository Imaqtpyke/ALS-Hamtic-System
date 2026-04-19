-- Allow anon (Firebase admin) to DELETE enrollments (for deleteUserAccount)
DROP POLICY IF EXISTS "Anon can delete enrollments" ON public.enrollments;
CREATE POLICY "Anon can delete enrollments"
  ON public.enrollments
  FOR DELETE
  TO anon
  USING (true);
