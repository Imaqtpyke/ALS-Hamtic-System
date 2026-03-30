-- Drop the firebase_users table
DROP TABLE IF EXISTS public.firebase_users CASCADE;

-- Drop all existing policies first
DROP POLICY IF EXISTS "Students can view their own enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Students can create their own enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Students can update their own pending enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Admins can view all enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Admins can manage all enrollments" ON public.enrollments;

-- Create helper function for user role checks
CREATE OR REPLACE FUNCTION is_student()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()::text
    AND raw_user_meta_data->>'role' = 'student'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()::text
    AND raw_user_meta_data->>'role' = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create helper function for status transitions
CREATE OR REPLACE FUNCTION check_valid_status_transition(old_status TEXT, new_status TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN 
    (old_status IS NULL) OR -- Allow any initial status for new records
    (old_status = 'pending' AND new_status IN ('approved', 'rejected')) OR
    (old_status = 'approved' AND new_status IN ('enrolled', 'withdrawn')) OR
    (old_status = 'enrolled' AND new_status IN ('completed', 'dropped'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

-- Create policies for students
CREATE POLICY "Students can view their own enrollments"
  ON public.enrollments
  FOR SELECT
  USING (
    auth.uid()::text = user_id
    AND (is_student() OR is_admin())
  );

CREATE POLICY "Students can create their own enrollments"
  ON public.enrollments
  FOR INSERT
  WITH CHECK (
    auth.uid()::text = user_id
    AND (is_student() OR is_admin())
    AND status = 'pending'
  );

CREATE POLICY "Students can update their own pending enrollments"
  ON public.enrollments
  FOR UPDATE
  USING (
    auth.uid()::text = user_id
    AND (is_student() OR is_admin())
    AND status = 'pending'
  )
  WITH CHECK (
    auth.uid()::text = user_id
    AND status = 'pending'
  );

-- Create policies for admins
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

-- Create rate limiting table and function
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  action text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE OR REPLACE FUNCTION check_rate_limit(
  p_user_id text,
  p_action text,
  p_max_requests int,
  p_window_minutes int
)
RETURNS boolean AS $$
BEGIN
  -- Clean old entries
  DELETE FROM rate_limits
  WHERE created_at < NOW() - (p_window_minutes || ' minutes')::interval;
  
  -- Check count
  IF (
    SELECT COUNT(*)
    FROM rate_limits
    WHERE
      user_id = p_user_id
      AND action = p_action
      AND created_at > NOW() - (p_window_minutes || ' minutes')::interval
  ) >= p_max_requests THEN
    RETURN false;
  END IF;
  
  -- Log action
  INSERT INTO rate_limits (user_id, action)
  VALUES (p_user_id, p_action);
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS on rate_limits table
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Only allow system to manage rate limits
CREATE POLICY "System manages rate limits"
  ON public.rate_limits
  FOR ALL
  USING (false)
  WITH CHECK (false);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_rate_limits_user_action
  ON public.rate_limits(user_id, action, created_at);

-- Add comments for documentation
COMMENT ON TABLE public.enrollments IS 'Student enrollment records with RLS policies based on Firebase auth roles';
COMMENT ON TABLE public.rate_limits IS 'Table for tracking and limiting request rates per user and action';
COMMENT ON FUNCTION check_rate_limit IS 'Function to implement rate limiting per user and action';
COMMENT ON FUNCTION is_student IS 'Helper function to check if the current user has a student role';
COMMENT ON FUNCTION is_admin IS 'Helper function to check if the current user has an admin role';
COMMENT ON FUNCTION check_valid_status_transition IS 'Helper function to validate enrollment status transitions';
