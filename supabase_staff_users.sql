-- =====================================================================================
-- STAFF LOGIN: make the existing `staff_users` table readable by the POS.
-- Run in the Supabase SQL editor.
--
-- Your table has columns: id, name, pin, role, is_active (+ created_at). It has NO `password`
-- column; the POS signs in with name / employee code + PIN, or the PIN alone.
--
-- The anon key returned ZERO rows for this table. With Row Level Security enabled and no SELECT
-- policy, Supabase hides every row from the anon key - that is the usual cause. This adds the
-- policy.
--
-- SECURITY NOTE: this lets anyone holding the anon key read staff PINs. Acceptable for a
-- single-store pilot; before multi-tenant SaaS, move login to Supabase Auth or an Edge Function
-- that verifies hashed PINs.
-- =====================================================================================

ALTER TABLE staff_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pos_read_staff_users ON staff_users;
CREATE POLICY pos_read_staff_users ON staff_users FOR SELECT USING (true);

-- Check what the POS will see (run as a normal query; should list your accounts):
-- SELECT id, name, role, is_active, (pin IS NOT NULL AND pin <> '') AS has_pin FROM staff_users;

-- Role values understood by the POS (case-insensitive):
--   admin / administrator / owner            -> Administrator
--   manager / supervisor                     -> Manager
--   anything else (staff, cashier, ...)      -> Cashier
-- Rows with is_active = false are ignored; NULL counts as active.
