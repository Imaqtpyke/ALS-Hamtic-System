CREATE TABLE IF NOT EXISTS public.admin_messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  enrollment_id uuid REFERENCES public.enrollments(id) ON DELETE CASCADE,
  user_id text NOT NULL,
  message text NOT NULL CHECK (char_length(message) <= 500),
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.admin_messages ENABLE ROW LEVEL SECURITY;

-- Note: Using anon for Firebase-authenticated users throughout this project.
CREATE POLICY "Anon can insert messages" ON public.admin_messages FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon can read messages" ON public.admin_messages FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can update messages" ON public.admin_messages FOR UPDATE TO anon USING (true);
