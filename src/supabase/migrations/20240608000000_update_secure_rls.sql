-- Drop all existing policies first
DROP POLICY IF EXISTS "Users can view their own enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Users can create their own enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Users can update their own pending enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Admins can view all enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Admins can update any enrollment" ON public.enrollments;

-- Create secure function to check admin status
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Check both JWT claim and users table for admin role
  RETURN (
    auth.jwt() ->> 'role' = 'admin'
    AND
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()::text
      AND role = 'admin'
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS on all tables
ALTER TABLE public.firebase_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

-- Firebase Users Table Policies
CREATE POLICY "Users can view only their own firebase mapping"
  ON public.firebase_users
  FOR SELECT
  TO authenticated
  USING (firebase_uid = auth.uid());

CREATE POLICY "Service role can manage all firebase users"
  ON public.firebase_users
  FOR ALL
  TO service_role
  USING (true);

CREATE POLICY "System can create initial firebase mapping"
  ON public.firebase_users
  FOR INSERT
  TO authenticated
  WITH CHECK (firebase_uid = auth.uid());

-- Enrollments Table Policies
-- Read policies
CREATE POLICY "Students can view their own enrollments"
  ON public.enrollments
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()::text
    AND NOT is_admin()
  );

CREATE POLICY "Admins can view all enrollments"
  ON public.enrollments
  FOR SELECT
  TO authenticated
  USING (is_admin());

-- Insert policies
CREATE POLICY "Students can create their own enrollments"
  ON public.enrollments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()::text
    AND status = 'pending'
    AND NOT is_admin()
  );

-- Update policies
CREATE POLICY "Students can update their own pending enrollments"
  ON public.enrollments
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()::text
    AND status = 'pending'
    AND NOT is_admin()
  )
  WITH CHECK (
    user_id = auth.uid()::text
    AND status = 'pending'
  );

CREATE POLICY "Admins can update any enrollment"
  ON public.enrollments
  FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (
    -- Ensure status transitions are valid
    CASE
      WHEN OLD.status = 'pending' THEN NEW.status IN ('approved', 'rejected')
      WHEN OLD.status = 'approved' THEN NEW.status IN ('enrolled', 'withdrawn')
      WHEN OLD.status = 'enrolled' THEN NEW.status IN ('completed', 'dropped')
      ELSE FALSE
    END
  );

-- Delete policies
CREATE POLICY "Students can delete only draft enrollments"
  ON public.enrollments
  FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()::text
    AND status = 'draft'
    AND NOT is_admin()
  );

CREATE POLICY "Admins can delete invalid enrollments"
  ON public.enrollments
  FOR DELETE
  TO authenticated
  USING (is_admin());

-- Create view for enrollment statistics (admin only)
CREATE VIEW public.enrollment_stats AS
SELECT 
    status,
    COUNT(*) as count,
    DATE_TRUNC('day', submitted_at) as date
FROM public.enrollments
GROUP BY status, DATE_TRUNC('day', submitted_at);

-- Set view owner and permissions
ALTER VIEW public.enrollment_stats OWNER TO authenticated;
REVOKE ALL ON public.enrollment_stats FROM PUBLIC;
GRANT SELECT ON public.enrollment_stats TO authenticated;

-- Add RLS to storage buckets
CREATE POLICY "Users can manage their own profile pictures"
  ON storage.objects
  FOR ALL
  TO authenticated
  USING (
    bucket_id = 'profile-pics'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can access their own documents"
  ON storage.objects
  FOR ALL
  TO authenticated
  USING (
    bucket_id = 'user-files'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Admins can access all files"
  ON storage.objects
  FOR ALL
  TO authenticated
  USING (is_admin());

-- Add rate limiting function
CREATE OR REPLACE FUNCTION check_rate_limit(
  user_id text,
  action_type text,
  max_requests int,
  window_minutes int
)
RETURNS boolean AS $$
BEGIN
  -- Clean old entries
  DELETE FROM rate_limits
  WHERE created_at < NOW() - (window_minutes || ' minutes')::interval;
  
  -- Check count
  IF (
    SELECT COUNT(*)
    FROM rate_limits
    WHERE
      user_id = user_id
      AND action = action_type
      AND created_at > NOW() - (window_minutes || ' minutes')::interval
  ) >= max_requests THEN
    RETURN false;
  END IF;
  
  -- Log action
  INSERT INTO rate_limits (user_id, action)
  VALUES (user_id, action_type);
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
