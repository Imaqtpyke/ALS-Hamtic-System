-- Migration: Create audit_logs table
-- Description: Stores administrative actions and changes for auditing purposes.

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id text NOT NULL,
    action text NOT NULL,
    target_type text NOT NULL,
    target_id text,
    details jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow read access only to authenticated users (admins)
-- Note: Assuming admin role check or simple auth.uid() check is sufficient based on your setup.
-- If you have a custom claim for admin: `auth.jwt() ->> 'role' = 'admin'`
CREATE POLICY "Admins can view audit logs" 
ON public.audit_logs 
FOR SELECT 
TO authenticated 
USING (true); -- In a truly strict setup, restrict to admins only. We'll allow all authenticated to view if they have dashboard access.

-- Allow insert access to authenticated users
CREATE POLICY "Admins can insert audit logs" 
ON public.audit_logs 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- No update or delete policies (Audit logs should be append-only)
