-- =====================================================================================
-- SaaS MODULES MIGRATION: CRM (customers) + PROMO ENGINE (promo_codes)
-- Run once in the Supabase SQL editor. Idempotent.
-- NOTE: the POS uses the public (anon) key. The permissive policies below mirror how the
-- rest of the app reads/writes; tighten them to your auth model before multi-tenant launch.
-- =====================================================================================

CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID, -- optional; no tenants table required
    name VARCHAR(120) NOT NULL,
    phone VARCHAR(32) NOT NULL UNIQUE,
    address TEXT DEFAULT '',
    total_orders INT NOT NULL DEFAULT 0,
    total_spent_kwd NUMERIC(12,3) NOT NULL DEFAULT 0.000,
    last_order_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS promo_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID, -- optional; no tenants table required
    code VARCHAR(32) NOT NULL UNIQUE,
    discount_type VARCHAR(12) NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value NUMERIC(10,3) NOT NULL CHECK (discount_value > 0),
    min_order_kwd NUMERIC(10,3) NOT NULL DEFAULT 0.000,
    max_uses INT,
    used_count INT NOT NULL DEFAULT 0,
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pos_rw_customers ON customers;
CREATE POLICY pos_rw_customers ON customers FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS pos_rw_promo_codes ON promo_codes;
CREATE POLICY pos_rw_promo_codes ON promo_codes FOR ALL USING (true) WITH CHECK (true);

-- The POS also needs read/write on these existing tables (add policies if RLS blocks them):
--   pos_orders, pos_order_items, shift_z_reports, raw_ingredients, recipe_bom_items,
--   staff_users (SELECT), branches (SELECT), tenants (SELECT)
