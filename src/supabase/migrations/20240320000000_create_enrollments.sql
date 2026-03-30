-- Create enrollments table with proper constraints and defaults
CREATE TABLE IF NOT EXISTS public.enrollments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text NOT NULL, -- Firebase UID
  personal_info jsonb NOT NULL CHECK (jsonb_typeof(personal_info) = 'object'),
  educational_background jsonb NOT NULL CHECK (jsonb_typeof(educational_background) = 'object'),
  learning_preferences jsonb NOT NULL CHECK (jsonb_typeof(learning_preferences) = 'object'),
  subjects jsonb NOT NULL CHECK (jsonb_typeof(subjects) = 'array'),
  status text NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'approved', 'rejected', 'enrolled', 'completed', 'dropped', 'withdrawn')),
  status_history jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(status_history) = 'array'),
  submitted_at timestamptz NOT NULL DEFAULT now(),
  approved_at timestamptz,
  rejected_at timestamptz,
  rejection_reason text,
  enrollment_date timestamptz,
  completion_date timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT valid_user_id CHECK (user_id ~ '^[a-zA-Z0-9_-]{20,}$'), -- Firebase UID format
  CONSTRAINT valid_dates CHECK (
    (status = 'approved' AND approved_at IS NOT NULL) OR
    (status = 'rejected' AND rejected_at IS NOT NULL) OR
    (status IN ('pending', 'enrolled', 'completed', 'dropped', 'withdrawn'))
  )
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_enrollments_user_id ON public.enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON public.enrollments(status);
CREATE INDEX IF NOT EXISTS idx_enrollments_submitted_at ON public.enrollments(submitted_at);
CREATE INDEX IF NOT EXISTS idx_enrollments_status_history ON public.enrollments USING gin(status_history);

-- Enable RLS
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

-- Create trigger function for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  -- Update status history if status changed
  IF OLD.status <> NEW.status THEN
    NEW.status_history = OLD.status_history || 
      jsonb_build_object(
        'status', NEW.status,
        'date', to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
        'notes', NEW.notes,
        'updated_by', auth.uid()::text
      );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_enrollments_updated_at ON public.enrollments;

-- Create trigger for automatic timestamp and status history updates
CREATE TRIGGER update_enrollments_updated_at
  BEFORE UPDATE ON public.enrollments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add helpful comments
COMMENT ON TABLE public.enrollments IS 'Student enrollment records with automated timestamp and status history tracking';
COMMENT ON COLUMN public.enrollments.user_id IS 'Firebase User ID of the student';
COMMENT ON COLUMN public.enrollments.status_history IS 'Array of status changes with timestamps and notes';
COMMENT ON TRIGGER update_enrollments_updated_at ON public.enrollments IS 'Automatically updates timestamps and status history on changes';