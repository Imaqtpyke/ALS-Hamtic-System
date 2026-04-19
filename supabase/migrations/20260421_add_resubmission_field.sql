-- Add is_resubmission column to track if an application has been corrected by the student
ALTER TABLE public.enrollments 
ADD COLUMN IF NOT EXISTS is_resubmission boolean DEFAULT false;
