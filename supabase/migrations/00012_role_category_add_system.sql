-- Migration: Add 'system' value to role_category enum
-- Must run in its own transaction (separate file) before any statement that
-- USES the new enum value (the event_admin role insert in 00013).
-- =====================================================================

ALTER TYPE role_category ADD VALUE IF NOT EXISTS 'system';
