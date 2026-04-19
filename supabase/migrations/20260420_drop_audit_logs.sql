-- Migration: Drop audit_logs table
-- This removes the audit_logs feature entirely from the database.
-- CASCADE ensures any dependent foreign keys or policies are also removed.

DROP TABLE IF EXISTS audit_logs CASCADE;
