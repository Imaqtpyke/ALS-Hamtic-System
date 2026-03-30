-- Create enrollments table
create table if not exists public.enrollments (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now()),
  user_id text not null,  -- Changed from uuid to text to support Firebase UIDs
  personal_info jsonb not null,
  educational_background jsonb not null,
  learning_preferences jsonb not null,
  subjects jsonb not null,
  status text not null default 'pending',
  status_history jsonb not null,
  submitted_at timestamp with time zone not null default timezone('utc'::text, now()),
  approved_at timestamp with time zone,
  rejected_at timestamp with time zone,
  rejection_reason text,
  enrollment_date timestamp with time zone,
  completion_date timestamp with time zone,
  notes text
);

-- Enable RLS
alter table public.enrollments enable row level security;

-- Policy: Students can insert their own enrollment
create policy "Students can insert their own enrollment"
  on public.enrollments
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Policy: Students can view their own enrollments
create policy "Students can view their own enrollments"
  on public.enrollments
  for select
  using (auth.uid() = user_id);

-- Policy: Students can update their own enrollments
create policy "Students can update their own enrollments"
  on public.enrollments
  for update
  using (auth.uid() = user_id);

-- Policy: Admins with role claim can view all enrollments
create policy "Admins can view all enrollments"
  on public.enrollments
  for select
  using (auth.jwt() ->> 'role' = 'admin');

-- Policy: Admins with role claim can update all enrollments
create policy "Admins can update all enrollments"
  on public.enrollments
  for update
  using (auth.jwt() ->> 'role' = 'admin');
