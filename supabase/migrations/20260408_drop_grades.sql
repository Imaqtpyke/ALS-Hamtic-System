-- Migration: Drop Grading and Messaging Features
-- Created: 2026-04-08

-- Drop the assessments (grades) table and all related policies
DROP TABLE IF EXISTS assessments CASCADE;

-- Drop the inquiries (messages) table and all related policies
DROP TABLE IF EXISTS inquiries CASCADE;

-- Note: CASCASE ensures that any dependent objects (like the RLS policies we created)
-- are also removed along with the tables.
