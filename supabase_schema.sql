-- =====================================================================================
-- JEZTBRAIN MULTI-TENANT CLOUD QSR POS & ERP SYSTEM — PRODUCTION SUPABASE SCHEMA
-- Flagship Tenant: CHIKARRO Fried Chicken (Salmiya, Kuwait)
-- Platform Creator: Powered by JeztBrain
-- Currency Standard: Kuwaiti Dinar (KWD) — NUMERIC(10, 3) strict 3-decimal precision
-- =====================================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -------------------------------------------------------------------------------------
-- 1. MULTI-TENANT & BRANCH HIERARCHY
-- -------------------------------------------------------------------------------------
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(64) UNIQUE NOT NULL,
    brand_name VARCHAR(120) NOT NULL,
    brand_name_ar VARCHAR(120),
    country_code VARCHAR(8) DEFAULT 'KW',
    currency_code VARCHAR(8) DEFAULT 'KWD',
    decimal_places SMALLINT DEFAULT 3,
    website_domain VARCHAR(150),
    tax_registration_no VARCHAR(64),
    aggregator_commissions JSONB DEFAULT '{"keeta": 18.0, "web": 0.0}'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE branches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    branch_code VARCHAR(32) NOT NULL,
    name VARCHAR(120) NOT NULL,
    area VARCHAR(80) NOT NULL,
    address_line TEXT NOT NULL,
    phone VARCHAR(32) NOT NULL,
    printer_ip VARCHAR(64) DEFAULT '192.168.1.200:9100',
    is_flagship BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, branch_code)
);

-- -------------------------------------------------------------------------------------
-- 2. 3-TIER ROLE-BASED STAFF & AUTHENTICATION
-- -------------------------------------------------------------------------------------
CREATE TYPE user_role_tier AS ENUM ('staff', 'manager', 'admin');

CREATE TABLE staff_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    employee_code VARCHAR(32) NOT NULL,
    full_name VARCHAR(120) NOT NULL,
    role user_role_tier NOT NULL DEFAULT 'staff',
    pin_code VARCHAR(12) NOT NULL,
    password_hash TEXT NOT NULL,
    max_discount_pct NUMERIC(5,2) DEFAULT 10.00,
    can_void_bills BOOLEAN DEFAULT FALSE,
    can_manage_combos BOOLEAN DEFAULT FALSE,
    can_view_margins BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, employee_code),
    UNIQUE(tenant_id, pin_code)
);

-- -------------------------------------------------------------------------------------
-- 3. CATEGORIES, MENU ITEMS & MODIFIERS
-- -------------------------------------------------------------------------------------
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    slug VARCHAR(64) NOT NULL,
    name_en VARCHAR(100) NOT NULL,
    name_ar VARCHAR(100) NOT NULL,
    icon_name VARCHAR(48) NOT NULL,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, slug)
);

CREATE TABLE menu_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    sku_code VARCHAR(32) NOT NULL,
    name_en VARCHAR(140) NOT NULL,
    name_ar VARCHAR(140) NOT NULL,
    description_en TEXT,
    price_kwd NUMERIC(10,3) NOT NULL CHECK (price_kwd >= 0),
    cost_kwd NUMERIC(10,3) NOT NULL DEFAULT 0.000,
    requires_customization BOOLEAN DEFAULT FALSE,
    prep_time_mins INT DEFAULT 8,
    badge_text VARCHAR(48),
    image_gradient VARCHAR(120),
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, sku_code)
);

CREATE TABLE modifier_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    code VARCHAR(48) NOT NULL,
    name_en VARCHAR(100) NOT NULL,
    name_ar VARCHAR(100) NOT NULL,
    is_required BOOLEAN DEFAULT TRUE,
    allow_multiple BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE modifier_options (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES modifier_groups(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name_en VARCHAR(100) NOT NULL,
    name_ar VARCHAR(100) NOT NULL,
    price_delta_kwd NUMERIC(10,3) NOT NULL DEFAULT 0.000,
    is_default BOOLEAN DEFAULT FALSE,
    is_available BOOLEAN DEFAULT TRUE
);

-- -------------------------------------------------------------------------------------
-- 4. DYNAMIC COMBO OFFER STUDIO & BUNDLER
-- -------------------------------------------------------------------------------------
CREATE TABLE combo_offers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    code VARCHAR(32) NOT NULL,
    heading_en VARCHAR(140) NOT NULL,
    heading_ar VARCHAR(140) NOT NULL,
    promo_tag VARCHAR(64) NOT NULL,
    original_value_kwd NUMERIC(10,3) NOT NULL CHECK (original_value_kwd >= 0),
    combo_price_kwd NUMERIC(10,3) NOT NULL CHECK (combo_price_kwd >= 0),
    savings_kwd NUMERIC(10,3) GENERATED ALWAYS AS (original_value_kwd - combo_price_kwd) STORED,
    total_cost_kwd NUMERIC(10,3) NOT NULL DEFAULT 0.000,
    is_available BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES staff_users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, code)
);

CREATE TABLE combo_offer_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    combo_id UUID NOT NULL REFERENCES combo_offers(id) ON DELETE CASCADE,
    menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE RESTRICT,
    item_name_snapshot VARCHAR(140) NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_value_kwd NUMERIC(10,3) NOT NULL
);

-- -------------------------------------------------------------------------------------
-- 5. RECIPE (BOM) & RAW INVENTORY ENGINE
-- -------------------------------------------------------------------------------------
CREATE TABLE raw_ingredients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    sku VARCHAR(32) NOT NULL,
    name VARCHAR(120) NOT NULL,
    unit VARCHAR(24) NOT NULL, -- 'pcs', 'kg', 'L', 'tubs', 'boxes', 'cans'
    current_stock NUMERIC(12,3) NOT NULL DEFAULT 0.000,
    reorder_level NUMERIC(12,3) NOT NULL DEFAULT 10.000,
    unit_cost_kwd NUMERIC(10,3) NOT NULL DEFAULT 0.000,
    supplier_name VARCHAR(120),
    last_restocked_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(branch_id, sku)
);

CREATE TABLE recipe_bom_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    raw_ingredient_id UUID NOT NULL REFERENCES raw_ingredients(id) ON DELETE CASCADE,
    qty_per_unit NUMERIC(10,3) NOT NULL CHECK (qty_per_unit > 0),
    UNIQUE(menu_item_id, raw_ingredient_id)
);

CREATE TABLE inventory_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    raw_ingredient_id UUID NOT NULL REFERENCES raw_ingredients(id) ON DELETE CASCADE,
    tx_type VARCHAR(32) NOT NULL, -- 'SALE_DEDUCTION', 'RESTOCK', 'WASTAGE', 'ADJUSTMENT'
    qty_delta NUMERIC(12,3) NOT NULL,
    reference_id VARCHAR(64),
    performed_by UUID REFERENCES staff_users(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------------------------------------------------------------------
-- 6. POS ORDERS, MULTI-TENDER PAYMENTS & MANAGER OVERRIDE LOGS
-- -------------------------------------------------------------------------------------
CREATE TYPE order_channel_type AS ENUM ('dine_in', 'takeaway', 'chikarro_web', 'keeta');
CREATE TYPE order_lifecycle_status AS ENUM ('pending', 'cooking', 'ready', 'out_for_delivery', 'completed', 'voided', 'held');
CREATE TYPE payment_method_type AS ENUM ('cash', 'knet', 'wamd', 'payment_link', 'split', 'aggregator_prepaid');

CREATE TABLE pos_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    invoice_no VARCHAR(32) NOT NULL,
    token_no INT NOT NULL,
    channel order_channel_type NOT NULL,
    status order_lifecycle_status NOT NULL DEFAULT 'completed',
    table_no VARCHAR(16),
    customer_name VARCHAR(120),
    customer_phone VARCHAR(32),
    delivery_address TEXT,
    subtotal_kwd NUMERIC(10,3) NOT NULL DEFAULT 0.000,
    discount_kwd NUMERIC(10,3) NOT NULL DEFAULT 0.000,
    discount_reason TEXT,
    manager_override_by UUID REFERENCES staff_users(id),
    delivery_fee_kwd NUMERIC(10,3) NOT NULL DEFAULT 0.000,
    grand_total_kwd NUMERIC(10,3) NOT NULL DEFAULT 0.000,
    payment_method payment_method_type NOT NULL,
    cash_tendered_kwd NUMERIC(10,3) DEFAULT 0.000,
    knet_tendered_kwd NUMERIC(10,3) DEFAULT 0.000,
    change_due_kwd NUMERIC(10,3) DEFAULT 0.000,
    cashier_id UUID NOT NULL REFERENCES staff_users(id),
    cashier_name VARCHAR(120) NOT NULL,
    void_reason TEXT,
    voided_by UUID REFERENCES staff_users(id),
    web_order_ref VARCHAR(64),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(branch_id, invoice_no)
);

CREATE TABLE pos_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES pos_orders(id) ON DELETE CASCADE,
    item_type VARCHAR(16) NOT NULL CHECK (item_type IN ('ITEM', 'COMBO')),
    ref_id UUID NOT NULL,
    title_en VARCHAR(140) NOT NULL,
    title_ar VARCHAR(140),
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price_kwd NUMERIC(10,3) NOT NULL,
    line_total_kwd NUMERIC(10,3) NOT NULL,
    prep_style VARCHAR(32),
    side_choice VARCHAR(64),
    drink_choice VARCHAR(64),
    addons_json JSONB DEFAULT '[]'::jsonb,
    combo_sub_items_json JSONB DEFAULT '[]'::jsonb,
    kitchen_notes TEXT
);

-- -------------------------------------------------------------------------------------
-- 7. WEBSITE LIVE ORDER SYNC & DELIVERY DISPATCH HUB
-- -------------------------------------------------------------------------------------
CREATE TABLE delivery_riders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(32) NOT NULL,
    vehicle_plate VARCHAR(32),
    status VARCHAR(24) DEFAULT 'available', -- 'available', 'busy', 'offline'
    active_orders_count INT DEFAULT 0
);

CREATE TABLE web_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    web_order_no VARCHAR(32) NOT NULL,
    source_domain VARCHAR(100) DEFAULT 'chikarrasalmiya.com',
    customer_name VARCHAR(120) NOT NULL,
    customer_phone VARCHAR(32) NOT NULL,
    area VARCHAR(64) DEFAULT 'Salmiya',
    block_no VARCHAR(16) NOT NULL,
    street_no VARCHAR(32) NOT NULL,
    building_no VARCHAR(32) NOT NULL,
    floor_apt VARCHAR(32),
    landmark_notes TEXT,
    payment_mode VARCHAR(32) NOT NULL, -- 'K-Net Online', 'Wamd Instant', 'Cash on Delivery'
    is_paid BOOLEAN DEFAULT TRUE,
    subtotal_kwd NUMERIC(10,3) NOT NULL,
    delivery_fee_kwd NUMERIC(10,3) NOT NULL DEFAULT 0.500,
    total_kwd NUMERIC(10,3) NOT NULL,
    items_payload JSONB NOT NULL,
    dispatch_status VARCHAR(32) NOT NULL DEFAULT 'Pending', -- 'Pending', 'Cooking', 'Ready', 'Out for Delivery', 'Delivered'
    assigned_rider_id UUID REFERENCES delivery_riders(id),
    linked_pos_order_id UUID REFERENCES pos_orders(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    accepted_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    UNIQUE(branch_id, web_order_no)
);

-- -------------------------------------------------------------------------------------
-- 8. SHIFT Z-REPORT RECONCILIATION & SHOP EXPENSES
-- -------------------------------------------------------------------------------------
CREATE TABLE shop_expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    category VARCHAR(64) NOT NULL, -- 'Produce & Supplies', 'Packaging', 'Driver Fuel', 'Maintenance', 'Petty Cash'
    description TEXT NOT NULL,
    amount_kwd NUMERIC(10,3) NOT NULL CHECK (amount_kwd > 0),
    paid_via VARCHAR(32) DEFAULT 'Cash Drawer',
    recorded_by UUID REFERENCES staff_users(id),
    recorded_by_name VARCHAR(120) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE shift_z_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    shift_code VARCHAR(32) NOT NULL,
    opened_at TIMESTAMPTZ NOT NULL,
    closed_at TIMESTAMPTZ DEFAULT NOW(),
    closed_by UUID REFERENCES staff_users(id),
    opening_float_kwd NUMERIC(10,3) NOT NULL DEFAULT 50.000,
    cash_sales_kwd NUMERIC(10,3) NOT NULL DEFAULT 0.000,
    knet_sales_kwd NUMERIC(10,3) NOT NULL DEFAULT 0.000,
    wamd_sales_kwd NUMERIC(10,3) NOT NULL DEFAULT 0.000,
    link_sales_kwd NUMERIC(10,3) NOT NULL DEFAULT 0.000,
    aggregator_sales_kwd NUMERIC(10,3) NOT NULL DEFAULT 0.000,
    cash_expenses_kwd NUMERIC(10,3) NOT NULL DEFAULT 0.000,
    expected_cash_kwd NUMERIC(10,3) NOT NULL DEFAULT 0.000,
    actual_cash_counted_kwd NUMERIC(10,3) NOT NULL DEFAULT 0.000,
    variance_kwd NUMERIC(10,3) GENERATED ALWAYS AS (actual_cash_counted_kwd - expected_cash_kwd) STORED,
    voided_orders_count INT DEFAULT 0,
    voided_amount_kwd NUMERIC(10,3) DEFAULT 0.000,
    closing_notes TEXT
);

-- -------------------------------------------------------------------------------------
-- 9. AUTOMATIC BOM INVENTORY DEDUCTION TRIGGER
-- -------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_deduct_bom_inventory_on_order()
RETURNS TRIGGER AS $$
DECLARE
    v_branch_id UUID;
    v_tenant_id UUID;
    v_status order_lifecycle_status;
    r_bom RECORD;
BEGIN
    SELECT branch_id, tenant_id, status INTO v_branch_id, v_tenant_id, v_status
    FROM pos_orders WHERE id = NEW.order_id;

    IF v_status != 'held' AND v_status != 'voided' AND NEW.item_type = 'ITEM' THEN
        FOR r_bom IN
            SELECT raw_ingredient_id, qty_per_unit
            FROM recipe_bom_items
            WHERE menu_item_id = NEW.ref_id
        LOOP
            UPDATE raw_ingredients
            SET current_stock = GREATEST(0, current_stock - (r_bom.qty_per_unit * NEW.quantity))
            WHERE id = r_bom.raw_ingredient_id AND branch_id = v_branch_id;

            INSERT INTO inventory_transactions (
                tenant_id, branch_id, raw_ingredient_id, tx_type, qty_delta, reference_id, notes
            ) VALUES (
                v_tenant_id, v_branch_id, r_bom.raw_ingredient_id, 'SALE_DEDUCTION',
                -(r_bom.qty_per_unit * NEW.quantity), NEW.order_id::text,
                'Auto BOM deduction for POS Order Item ' || NEW.title_en
            );
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_deduct_bom_inventory
AFTER INSERT ON pos_order_items
FOR EACH ROW
EXECUTE FUNCTION fn_deduct_bom_inventory_on_order();

-- -------------------------------------------------------------------------------------
-- 10. ROW-LEVEL SECURITY (RLS) MULTI-TENANT ISOLATION POLICIES
-- -------------------------------------------------------------------------------------
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE combo_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE combo_offer_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE raw_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_bom_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE web_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_z_reports ENABLE ROW LEVEL SECURITY;

-- -------------------------------------------------------------------------------------
-- 11. ROW-LEVEL SECURITY POLICIES (RLS) FOR POS CLOUD MENU & MULTI-TENANT ISOLATION
-- -------------------------------------------------------------------------------------
-- Public Read Access Policies for POS Terminals & Online Menu (Anon / Publishable Key)
CREATE POLICY "Public Read Categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Public Read Menu Items" ON menu_items FOR SELECT USING (true);

-- Tenant isolation policy helper based on JWT claim `app.tenant_id`
CREATE POLICY tenant_isolation_branches ON branches
    USING (tenant_id = COALESCE(NULLIF(current_setting('request.jwt.claim.tenant_id', true), '')::uuid, tenant_id));

CREATE POLICY tenant_isolation_menu_items ON menu_items
    USING (tenant_id = COALESCE(NULLIF(current_setting('request.jwt.claim.tenant_id', true), '')::uuid, tenant_id));

CREATE POLICY tenant_isolation_combo_offers ON combo_offers
    USING (tenant_id = COALESCE(NULLIF(current_setting('request.jwt.claim.tenant_id', true), '')::uuid, tenant_id));

CREATE POLICY tenant_isolation_pos_orders ON pos_orders
    USING (tenant_id = COALESCE(NULLIF(current_setting('request.jwt.claim.tenant_id', true), '')::uuid, tenant_id));

CREATE POLICY tenant_isolation_web_orders ON web_orders
    USING (tenant_id = COALESCE(NULLIF(current_setting('request.jwt.claim.tenant_id', true), '')::uuid, tenant_id));

