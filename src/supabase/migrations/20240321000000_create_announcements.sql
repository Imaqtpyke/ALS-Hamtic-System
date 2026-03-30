-- Create announcements table for real-time notice board
CREATE TABLE IF NOT EXISTS public.announcements (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  message text NOT NULL,
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Select access for all authenticated users
DROP POLICY IF EXISTS "Allow all authenticated users to view announcements" ON public.announcements;
CREATE POLICY "Allow all authenticated users to view announcements"
ON public.announcements FOR SELECT
TO authenticated
USING (true);

-- Full access for admins
DROP POLICY IF EXISTS "Allow admins full access to announcements" ON public.announcements;
CREATE POLICY "Allow admins full access to announcements"
ON public.announcements FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Create trigger function for updating timestamps (generic)
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update trigger for updated_at
DROP TRIGGER IF EXISTS update_announcements_updated_at ON public.announcements;
CREATE TRIGGER update_announcements_updated_at
  BEFORE UPDATE ON public.announcements
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

-- Add sample announcement
INSERT INTO public.announcements (title, message, priority)
VALUES 
  ('ALS Office Closure', 'The ALS office will be closed on October 31 for a staff development day.', 'medium'),
  ('Enrollment Phase 2', 'We are now accepting Phase 2 enrollees for the 2024 academic year. Please refer others who might be interested.', 'high');
