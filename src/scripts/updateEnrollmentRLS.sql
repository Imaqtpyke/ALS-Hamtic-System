-- First, drop existing tables and policies to start fresh
DROP TABLE IF EXISTS public.enrollments CASCADE;
DROP TABLE IF EXISTS public.firebase_users CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Create the enrollments table with proper structure
CREATE TABLE public.enrollments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    personal_info JSONB NOT NULL,
    educational_background JSONB NOT NULL,
    learning_preferences JSONB NOT NULL,
    subjects JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    status_history JSONB DEFAULT '[]'::jsonb,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,
    CONSTRAINT valid_user_id CHECK (user_id ~ '^[a-zA-Z0-9_-]{20,}$') -- Firebase UID format
);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_enrollments_updated_at
    BEFORE UPDATE ON public.enrollments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DO $$ 
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'enrollments'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.enrollments', policy_record.policyname);
    END LOOP;
END $$;

-- Create policies for authenticated users
CREATE POLICY "Users can insert their own enrollment"
    ON public.enrollments
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can view their own enrollments"
    ON public.enrollments
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid()::text);

CREATE POLICY "Users can update their own pending enrollments"
    ON public.enrollments
    FOR UPDATE
    TO authenticated
    USING (
        user_id = auth.uid()::text 
        AND status = 'pending'
    );

-- Create policies for admins
CREATE POLICY "Admins can view all enrollments"
    ON public.enrollments
    FOR SELECT
    TO authenticated
    USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can update all enrollments"
    ON public.enrollments
    FOR UPDATE
    TO authenticated
    USING (auth.jwt() ->> 'role' = 'admin');

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_enrollments_user_id 
ON public.enrollments(user_id);

CREATE INDEX IF NOT EXISTS idx_enrollments_status 
ON public.enrollments(status);

CREATE INDEX IF NOT EXISTS idx_enrollments_submitted_at 
ON public.enrollments(submitted_at);

-- Create a view for enrollment statistics (admin only)
CREATE OR REPLACE VIEW public.enrollment_stats AS
SELECT 
    status,
    COUNT(*) as count,
    DATE_TRUNC('day', submitted_at) as date
FROM public.enrollments
GROUP BY status, DATE_TRUNC('day', submitted_at);

-- Grant necessary permissions
GRANT ALL ON public.enrollments TO authenticated;
GRANT ALL ON public.enrollment_stats TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
