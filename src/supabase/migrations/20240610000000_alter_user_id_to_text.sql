-- Alter table enrollments to change user_id from uuid to text
ALTER TABLE public.enrollments
ALTER COLUMN user_id TYPE TEXT;

-- Alter table profiles to change id from uuid to text
ALTER TABLE public.profiles
ALTER COLUMN id TYPE TEXT; 