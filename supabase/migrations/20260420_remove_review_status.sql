-- Safety: Move any applicants currently in 'review' status back to 'pending' 
-- before dropping the constraint that allows 'review'
UPDATE public.enrollments SET status = 'pending' WHERE status = 'review';

-- Drop the existing constraint
ALTER TABLE public.enrollments DROP CONSTRAINT IF EXISTS status_check;

-- Create the new constraint without 'review'
ALTER TABLE public.enrollments ADD CONSTRAINT status_check
  CHECK (status IN ('pending', 'approved', 'enrolled', 'rejected', 'withdrawn', 'completed', 'dropped', 'graduated'));
