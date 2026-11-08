-- ==============================================================================
-- OURSELL RETAIL OS: COMPLETE PLAN-BASED FEATURE ACCESS & RESOURCE ENGINE
-- Migration 04: Centralized Plan Architecture, Outlets, POS Terminals,
-- Subscription Events, Plan Features, and Backend Resource Limit Triggers.
-- ==============================================================================

-- 1. FIX ADVISOR INDEXES & FUNCTION SEARCH PATHS
CREATE INDEX IF NOT EXISTS idx_ccl_customer ON public.customer_credit_ledger(customer_id);
CREATE INDEX IF NOT EXISTS idx_plan_enquiries_plan ON public.plan_enquiries(plan_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan ON public.subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_support_inbox_business ON public.support_inbox(business_id);

ALTER FUNCTION public.check_store_staff_limit() SET search_path = public;

-- 2. ENSURE PRICING PLANS HAVE PRECISE LIMITS
-- Starter: 1 staff, 1 outlet, 2 terminals, 1000 products
-- Professional: 3 staff, 3 outlets, 6 terminals, unlimited products
-- Enterprise: 5 staff (CRITICAL!), unlimited outlets, unlimited terminals, unlimited products
INSERT INTO public.pricing_plans (
    id, name, badge, description, monthly_price, annual_price, staff_limit, outlet_limit, terminal_limit, product_limit, features, is_active, sort_order
) VALUES 
(
    'starter',
    'Starter',
    NULL,
    'Perfect for small stores, single counters and retail startups.',
    0.00,
    0.00,
    1,
    1,
    2,
    1000,
    '[
        "1 Staff Account",
        "1 Store Outlet",
        "2 POS Terminals",
        "Full POS Billing",
        "Offline Billing Mode",
        "Barcode Studio",
        "80mm Thermal Receipts",
        "Product Management",
        "Basic Inventory & Stock Tracking",
        "Customer Directory",
        "Basic Daily Sales Reports",
        "English Interface Only"
    ]'::JSONB,
    TRUE,
    1
),
(
    'professional',
    'Professional',
    'MOST POPULAR',
    'Ideal for supermarkets, high-traffic retailers and multi-counter outlets.',
    799.00,
    7990.00,
    3,
    3,
    6,
    NULL,
    '[
        "Up to 3 Staff Accounts",
        "Up to 3 Store Outlets",
        "6 POS Terminals",
        "Unlimited Products",
        "Customer Khata & Credit Ledger",
        "Purchase Orders & Restock Automation",
        "Supplier Management",
        "Store Expense Tracking",
        "Advanced Sales Reports & Analytics",
        "Multi-Outlet Switching & Consolidated Reports",
        "Advanced Staff Permissions",
        "English, Malayalam & Arabic Language Support",
        "Priority Email & Chat Support"
    ]'::JSONB,
    TRUE,
    2
),
(
    'enterprise',
    'Multi-Chain Enterprise',
    'ENTERPRISE',
    'Built for retail chains, franchises, regional fleet operations and supermarkets.',
    3299.00,
    32990.00,
    5,
    NULL,
    NULL,
    NULL,
    '[
        "Up to 5 Staff Accounts (Strict Limit)",
        "Unlimited Store Outlets",
        "Unlimited POS Terminals",
        "Unlimited Products",
        "Centralized Fleet Management",
        "Franchise Operations & Royalty Tracking",
        "Enterprise Fleet Analytics & Consolidated Dashboard",
        "Dedicated Database Isolation",
        "Custom Domain Mapping",
        "Enterprise REST API & Custom Integrations",
        "24/7 Priority SLA & On-Premise Support",
        "All Professional Features Included"
    ]'::JSONB,
    TRUE,
    3
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    badge = EXCLUDED.badge,
    description = EXCLUDED.description,
    monthly_price = EXCLUDED.monthly_price,
    annual_price = EXCLUDED.annual_price,
    staff_limit = EXCLUDED.staff_limit,
    outlet_limit = EXCLUDED.outlet_limit,
    terminal_limit = EXCLUDED.terminal_limit,
    product_limit = EXCLUDED.product_limit,
    features = EXCLUDED.features,
    is_active = EXCLUDED.is_active,
    sort_order = EXCLUDED.sort_order,
    updated_at = NOW();

-- 3. PLAN FEATURES TABLE (Granular Feature Keys for Engine)
CREATE TABLE IF NOT EXISTS public.plan_features (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id VARCHAR(50) NOT NULL REFERENCES public.pricing_plans(id) ON DELETE CASCADE,
    feature_key VARCHAR(100) NOT NULL,
    feature_name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_plan_feature UNIQUE(plan_id, feature_key)
);

CREATE INDEX IF NOT EXISTS idx_plan_features_plan ON public.plan_features(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_features_key ON public.plan_features(feature_key);

-- Seed Granular Feature Capabilities per Plan
INSERT INTO public.plan_features (plan_id, feature_key, feature_name, category, is_enabled) VALUES
-- Starter Features
('starter', 'pos_billing', 'POS Billing & Register', 'Checkout', TRUE),
('starter', 'offline_billing', 'Offline POS Mode', 'Checkout', TRUE),
('starter', 'barcode_studio', 'Barcode Generation & Printing', 'Inventory', TRUE),
('starter', 'thermal_receipts', '80mm Thermal Receipt Printing', 'Billing', TRUE),
('starter', 'product_management', 'Product Catalog (1,000 max)', 'Inventory', TRUE),
('starter', 'basic_inventory', 'Basic Stock Tracking', 'Inventory', TRUE),
('starter', 'customer_management', 'Customer Directory', 'CRM', TRUE),
('starter', 'basic_reports', 'Basic Daily Sales Reports', 'Reports', TRUE),
('starter', 'basic_dashboard', 'Store Dashboard Overview', 'Operations', TRUE),
('starter', 'basic_staff', 'Staff Account (1 user)', 'Staff', TRUE),
('starter', 'language_en', 'English Language', 'Localization', TRUE),
('starter', 'customer_khata', 'Customer Khata & Credit Ledger', 'CRM', FALSE),
('starter', 'purchase_orders', 'Purchase Orders', 'Purchasing', FALSE),
('starter', 'supplier_management', 'Advanced Supplier Management', 'Purchasing', FALSE),
('starter', 'expense_management', 'Expense Tracking', 'Finance', FALSE),
('starter', 'advanced_analytics', 'Advanced Analytics & Margins', 'Reports', FALSE),
('starter', 'multi_outlet', 'Multi-Outlet Management', 'Outlets', FALSE),
('starter', 'languages_ml_ar', 'Malayalam & Arabic Languages', 'Localization', FALSE),
('starter', 'fleet_management', 'Centralized Fleet Management', 'Enterprise', FALSE),
('starter', 'franchise_management', 'Franchise Operations', 'Enterprise', FALSE),
('starter', 'dedicated_db', 'Dedicated Database Isolation', 'Enterprise', FALSE),
('starter', 'custom_domain', 'Custom Domain', 'Enterprise', FALSE),
('starter', 'enterprise_api', 'Enterprise API Access', 'Enterprise', FALSE),

-- Professional Features
('professional', 'pos_billing', 'POS Billing & Register', 'Checkout', TRUE),
('professional', 'offline_billing', 'Offline POS Mode', 'Checkout', TRUE),
('professional', 'barcode_studio', 'Barcode Generation & Printing', 'Inventory', TRUE),
('professional', 'thermal_receipts', '80mm Thermal Receipt Printing', 'Billing', TRUE),
('professional', 'product_management', 'Unlimited Products', 'Inventory', TRUE),
('professional', 'basic_inventory', 'Basic Stock Tracking', 'Inventory', TRUE),
('professional', 'advanced_inventory', 'Advanced Stock Management', 'Inventory', TRUE),
('professional', 'customer_management', 'Customer Directory', 'CRM', TRUE),
('professional', 'customer_khata', 'Customer Khata & Credit Ledger', 'CRM', TRUE),
('professional', 'purchase_orders', 'Purchase Orders', 'Purchasing', TRUE),
('professional', 'supplier_management', 'Supplier Management', 'Purchasing', TRUE),
('professional', 'expense_management', 'Expense Tracking', 'Finance', TRUE),
('professional', 'basic_reports', 'Basic Sales Reports', 'Reports', TRUE),
('professional', 'advanced_analytics', 'Advanced Analytics & Margins', 'Reports', TRUE),
('professional', 'multi_outlet', 'Multi-Outlet Management (up to 3)', 'Outlets', TRUE),
('professional', 'basic_staff', 'Staff Management (up to 3)', 'Staff', TRUE),
('professional', 'advanced_permissions', 'Granular Role Permissions', 'Staff', TRUE),
('professional', 'language_en', 'English Language', 'Localization', TRUE),
('professional', 'languages_ml_ar', 'Malayalam & Arabic Languages', 'Localization', TRUE),
('professional', 'priority_support', 'Priority Support', 'Support', TRUE),
('professional', 'fleet_management', 'Centralized Fleet Management', 'Enterprise', FALSE),
('professional', 'franchise_management', 'Franchise Operations', 'Enterprise', FALSE),
('professional', 'dedicated_db', 'Dedicated Database Isolation', 'Enterprise', FALSE),
('professional', 'custom_domain', 'Custom Domain', 'Enterprise', FALSE),
('professional', 'enterprise_api', 'Enterprise API Access', 'Enterprise', FALSE),

-- Enterprise Features
('enterprise', 'pos_billing', 'POS Billing & Register', 'Checkout', TRUE),
('enterprise', 'offline_billing', 'Offline POS Mode', 'Checkout', TRUE),
('enterprise', 'barcode_studio', 'Barcode Generation & Printing', 'Inventory', TRUE),
('enterprise', 'thermal_receipts', '80mm Thermal Receipt Printing', 'Billing', TRUE),
('enterprise', 'product_management', 'Unlimited Products', 'Inventory', TRUE),
('enterprise', 'basic_inventory', 'Basic Stock Tracking', 'Inventory', TRUE),
('enterprise', 'advanced_inventory', 'Advanced Stock Management', 'Inventory', TRUE),
('enterprise', 'customer_management', 'Customer Directory', 'CRM', TRUE),
('enterprise', 'customer_khata', 'Customer Khata & Credit Ledger', 'CRM', TRUE),
('enterprise', 'purchase_orders', 'Purchase Orders', 'Purchasing', TRUE),
('enterprise', 'supplier_management', 'Supplier Management', 'Purchasing', TRUE),
('enterprise', 'expense_management', 'Expense Tracking', 'Finance', TRUE),
('enterprise', 'basic_reports', 'Basic Sales Reports', 'Reports', TRUE),
('enterprise', 'advanced_analytics', 'Advanced Analytics & Margins', 'Reports', TRUE),
('enterprise', 'multi_outlet', 'Unlimited Outlets', 'Outlets', TRUE),
('enterprise', 'basic_staff', 'Staff Accounts (up to 5)', 'Staff', TRUE),
('enterprise', 'advanced_permissions', 'Enterprise Staff Permissions', 'Staff', TRUE),
('enterprise', 'language_en', 'English Language', 'Localization', TRUE),
('enterprise', 'languages_ml_ar', 'Malayalam & Arabic Languages', 'Localization', TRUE),
('enterprise', 'priority_support', '24/7 Priority Support', 'Support', TRUE),
('enterprise', 'fleet_management', 'Centralized Fleet Management', 'Enterprise', TRUE),
('enterprise', 'franchise_management', 'Franchise Operations', 'Enterprise', TRUE),
('enterprise', 'dedicated_db', 'Dedicated Database Isolation', 'Enterprise', TRUE),
('enterprise', 'custom_domain', 'Custom Domain Mapping', 'Enterprise', TRUE),
('enterprise', 'enterprise_api', 'Enterprise REST API Access', 'Enterprise', TRUE),
('enterprise', 'custom_integrations', 'Custom Integrations', 'Enterprise', TRUE),
('enterprise', 'on_premise_support', 'On-Premise Deployment Support', 'Enterprise', TRUE)
ON CONFLICT (plan_id, feature_key) DO UPDATE SET
    feature_name = EXCLUDED.feature_name,
    category = EXCLUDED.category,
    is_enabled = EXCLUDED.is_enabled;

-- 4. OUTLETS TABLE
CREATE TABLE IF NOT EXISTS public.outlets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    address TEXT,
    phone VARCHAR(50),
    manager_name VARCHAR(255),
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_business_outlet_code UNIQUE(business_id, code)
);

CREATE INDEX IF NOT EXISTS idx_outlets_business ON public.outlets(business_id);
CREATE INDEX IF NOT EXISTS idx_outlets_status ON public.outlets(business_id, is_active);

-- 5. POS TERMINALS TABLE
CREATE TABLE IF NOT EXISTS public.pos_terminals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    outlet_id UUID REFERENCES public.outlets(id) ON DELETE SET NULL,
    terminal_code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    device_fingerprint TEXT,
    ip_address VARCHAR(50),
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'LOCKED')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_ping_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_business_terminal_code UNIQUE(business_id, terminal_code)
);

CREATE INDEX IF NOT EXISTS idx_terminals_business ON public.pos_terminals(business_id);
CREATE INDEX IF NOT EXISTS idx_terminals_outlet ON public.pos_terminals(outlet_id);
CREATE INDEX IF NOT EXISTS idx_terminals_status ON public.pos_terminals(business_id, is_active);

-- 6. SUBSCRIPTION EVENTS AUDIT TABLE
CREATE TABLE IF NOT EXISTS public.subscription_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL, -- 'PLAN_CHANGE', 'LIMIT_CHANGE', 'MANUAL_OVERRIDE', 'RENEWAL'
    old_plan_id VARCHAR(50),
    new_plan_id VARCHAR(50) NOT NULL,
    actor VARCHAR(255) NOT NULL,
    actor_role VARCHAR(100) NOT NULL,
    reason TEXT,
    metadata JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sub_events_business ON public.subscription_events(business_id);
CREATE INDEX IF NOT EXISTS idx_sub_events_created ON public.subscription_events(created_at DESC);

-- 7. BACKEND RESOURCE ENFORCEMENT TRIGGERS

-- 7a. OUTLET LIMIT TRIGGER
CREATE OR REPLACE FUNCTION public.check_store_outlet_limit()
RETURNS TRIGGER AS $$
DECLARE
    v_outlet_limit INTEGER;
    v_current_count INTEGER;
    v_plan_name VARCHAR(100);
BEGIN
    IF NEW.is_active = TRUE THEN
        SELECT 
            COALESCE(s.outlet_limit, p.outlet_limit),
            COALESCE(p.name, s.plan_tier, 'Starter')
        INTO v_outlet_limit, v_plan_name
        FROM public.businesses b
        LEFT JOIN public.subscriptions s ON s.business_id = b.id AND s.status = 'ACTIVE'
        LEFT JOIN public.pricing_plans p ON (p.id = s.plan_id OR LOWER(p.name) = LOWER(s.plan_tier))
        WHERE b.id = NEW.business_id
        LIMIT 1;

        -- If outlet limit is defined (NOT NULL, e.g. 1 for Starter, 3 for Pro)
        IF v_outlet_limit IS NOT NULL THEN
            SELECT COUNT(*)
            INTO v_current_count
            FROM public.outlets
            WHERE business_id = NEW.business_id 
              AND is_active = TRUE
              AND (TG_OP = 'INSERT' OR id != NEW.id);

            IF v_current_count >= v_outlet_limit THEN
                RAISE EXCEPTION 'Outlet limit reached for current % plan (% store outlets maximum). Upgrade your plan to add more outlets.',
                    v_plan_name, v_outlet_limit
                    USING ERRCODE = 'check_violation';
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trg_check_store_outlet_limit ON public.outlets;
CREATE TRIGGER trg_check_store_outlet_limit
    BEFORE INSERT OR UPDATE OF is_active
    ON public.outlets
    FOR EACH ROW
    EXECUTE FUNCTION public.check_store_outlet_limit();

-- 7b. POS TERMINAL LIMIT TRIGGER
CREATE OR REPLACE FUNCTION public.check_store_terminal_limit()
RETURNS TRIGGER AS $$
DECLARE
    v_terminal_limit INTEGER;
    v_current_count INTEGER;
    v_plan_name VARCHAR(100);
BEGIN
    IF NEW.is_active = TRUE THEN
        SELECT 
            COALESCE(s.terminal_limit, p.terminal_limit),
            COALESCE(p.name, s.plan_tier, 'Starter')
        INTO v_terminal_limit, v_plan_name
        FROM public.businesses b
        LEFT JOIN public.subscriptions s ON s.business_id = b.id AND s.status = 'ACTIVE'
        LEFT JOIN public.pricing_plans p ON (p.id = s.plan_id OR LOWER(p.name) = LOWER(s.plan_tier))
        WHERE b.id = NEW.business_id
        LIMIT 1;

        -- If terminal limit is defined (e.g. 2 for Starter, 6 for Pro)
        IF v_terminal_limit IS NOT NULL THEN
            SELECT COUNT(*)
            INTO v_current_count
            FROM public.pos_terminals
            WHERE business_id = NEW.business_id 
              AND is_active = TRUE
              AND (TG_OP = 'INSERT' OR id != NEW.id);

            IF v_current_count >= v_terminal_limit THEN
                RAISE EXCEPTION 'POS Terminal limit reached for current % plan (% terminals maximum). Upgrade your plan to add more POS terminals.',
                    v_plan_name, v_terminal_limit
                    USING ERRCODE = 'check_violation';
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trg_check_store_terminal_limit ON public.pos_terminals;
CREATE TRIGGER trg_check_store_terminal_limit
    BEFORE INSERT OR UPDATE OF is_active
    ON public.pos_terminals
    FOR EACH ROW
    EXECUTE FUNCTION public.check_store_terminal_limit();

-- 7c. PRODUCT LIMIT TRIGGER (1,000 for Starter, Unlimited for Pro/Enterprise)
CREATE OR REPLACE FUNCTION public.check_store_product_limit()
RETURNS TRIGGER AS $$
DECLARE
    v_product_limit INTEGER;
    v_current_count INTEGER;
    v_plan_name VARCHAR(100);
BEGIN
    IF NEW.is_active = TRUE THEN
        SELECT 
            COALESCE(s.product_limit, p.product_limit),
            COALESCE(p.name, s.plan_tier, 'Starter')
        INTO v_product_limit, v_plan_name
        FROM public.businesses b
        LEFT JOIN public.subscriptions s ON s.business_id = b.id AND s.status = 'ACTIVE'
        LEFT JOIN public.pricing_plans p ON (p.id = s.plan_id OR LOWER(p.name) = LOWER(s.plan_tier))
        WHERE b.id = NEW.business_id
        LIMIT 1;

        -- If product limit is defined (e.g. 1000 for Starter)
        IF v_product_limit IS NOT NULL THEN
            SELECT COUNT(*)
            INTO v_current_count
            FROM public.products
            WHERE business_id = NEW.business_id 
              AND is_active = TRUE
              AND (TG_OP = 'INSERT' OR id != NEW.id);

            IF v_current_count >= v_product_limit THEN
                RAISE EXCEPTION 'Product catalog limit reached for current % plan (% products maximum). Upgrade your plan for unlimited catalog products.',
                    v_plan_name, v_product_limit
                    USING ERRCODE = 'check_violation';
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trg_check_store_product_limit ON public.products;
CREATE TRIGGER trg_check_store_product_limit
    BEFORE INSERT OR UPDATE OF is_active
    ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.check_store_product_limit();

-- 8. ROW LEVEL SECURITY (RLS) FOR NEW TABLES
ALTER TABLE public.plan_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outlets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_terminals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_events ENABLE ROW LEVEL SECURITY;

-- 8a. Plan Features: Public can read active plan features
DROP POLICY IF EXISTS "Public can view active plan features" ON public.plan_features;
CREATE POLICY "Public can view active plan features"
    ON public.plan_features FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.pricing_plans p 
            WHERE p.id = plan_features.plan_id AND p.is_active = TRUE
        )
    );

-- Dev Core can manage plan features
DROP POLICY IF EXISTS "Dev Core can manage plan features" ON public.plan_features;
CREATE POLICY "Dev Core can manage plan features"
    ON public.plan_features FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.dev_core_users
            WHERE id = (SELECT auth.uid()) OR role = 'SUPER_ADMIN'
        )
    );

-- 8b. Outlets RLS
DROP POLICY IF EXISTS "Store staff and admins can view outlets in their business" ON public.outlets;
CREATE POLICY "Store staff and admins can view outlets in their business"
    ON public.outlets FOR SELECT
    TO authenticated
    USING (
        business_id IN (
            SELECT business_id FROM public.store_memberships
            WHERE user_id = (SELECT auth.uid()) AND is_active = TRUE
        )
    );

DROP POLICY IF EXISTS "Store admins can manage outlets in their business" ON public.outlets;
CREATE POLICY "Store admins can manage outlets in their business"
    ON public.outlets FOR ALL
    TO authenticated
    USING (
        business_id IN (
            SELECT business_id FROM public.store_memberships
            WHERE user_id = (SELECT auth.uid()) AND role = 'STORE_ADMIN' AND is_active = TRUE
        )
    )
    WITH CHECK (
        business_id IN (
            SELECT business_id FROM public.store_memberships
            WHERE user_id = (SELECT auth.uid()) AND role = 'STORE_ADMIN' AND is_active = TRUE
        )
    );

-- 8c. POS Terminals RLS
DROP POLICY IF EXISTS "Store staff and admins can view terminals in their business" ON public.pos_terminals;
CREATE POLICY "Store staff and admins can view terminals in their business"
    ON public.pos_terminals FOR SELECT
    TO authenticated
    USING (
        business_id IN (
            SELECT business_id FROM public.store_memberships
            WHERE user_id = (SELECT auth.uid()) AND is_active = TRUE
        )
    );

DROP POLICY IF EXISTS "Store admins can manage terminals in their business" ON public.pos_terminals;
CREATE POLICY "Store admins can manage terminals in their business"
    ON public.pos_terminals FOR ALL
    TO authenticated
    USING (
        business_id IN (
            SELECT business_id FROM public.store_memberships
            WHERE user_id = (SELECT auth.uid()) AND role = 'STORE_ADMIN' AND is_active = TRUE
        )
    )
    WITH CHECK (
        business_id IN (
            SELECT business_id FROM public.store_memberships
            WHERE user_id = (SELECT auth.uid()) AND role = 'STORE_ADMIN' AND is_active = TRUE
        )
    );

-- 8d. Subscription Events RLS
DROP POLICY IF EXISTS "Store admins can view their subscription events" ON public.subscription_events;
CREATE POLICY "Store admins can view their subscription events"
    ON public.subscription_events FOR SELECT
    TO authenticated
    USING (
        business_id IN (
            SELECT business_id FROM public.store_memberships
            WHERE user_id = (SELECT auth.uid()) AND role = 'STORE_ADMIN' AND is_active = TRUE
        )
    );

DROP POLICY IF EXISTS "Dev Core can manage subscription events" ON public.subscription_events;
CREATE POLICY "Dev Core can manage subscription events"
    ON public.subscription_events FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.dev_core_users
            WHERE id = (SELECT auth.uid()) OR role = 'SUPER_ADMIN'
        )
    );

-- 9. SEED ENTERPRISE STORE & TEST STORES DATA
DO $$
DECLARE
    v_ent_biz_id UUID := 'a0000000-0000-0000-0000-000000000003'::UUID;
    v_pro_biz_id UUID := 'a0000000-0000-0000-0000-000000000001'::UUID;
    v_str_biz_id UUID := 'a0000000-0000-0000-0000-000000000002'::UUID;
    v_out1_id UUID;
    v_out2_id UUID;
    v_out3_id UUID;
BEGIN
    -- 9a. Seed CentralMart Enterprise Store
    INSERT INTO public.businesses (
        id, slug, name, logo_url, business_category, owner_name, 
        contact_email, contact_phone, currency, tax_rate_default, 
        outlet_count, terminal_count, is_active, registration_status
    ) VALUES (
        v_ent_biz_id,
        'centralmart',
        'CentralMart Hypermarket Chain',
        '/logo.png',
        'Supermarket',
        'Rajesh Kumar (Group CEO)',
        'enterprise@centralmart.com',
        '+91 98450 11223',
        '₹',
        5.00,
        12,
        35,
        TRUE,
        'ACTIVE'
    )
    ON CONFLICT (slug) DO UPDATE SET
        name = EXCLUDED.name,
        is_active = TRUE,
        registration_status = 'ACTIVE';

    -- Seed CentralMart Subscription (Enterprise)
    INSERT INTO public.subscriptions (
        business_id, plan_tier, plan_id, status, billing_cycle,
        monthly_price, annual_price, staff_limit, outlet_limit, terminal_limit, product_limit
    ) VALUES (
        v_ent_biz_id,
        'Multi-Chain Enterprise',
        'enterprise',
        'ACTIVE',
        'ANNUAL',
        3299.00,
        32990.00,
        5,    -- Enterprise staff limit is 5
        NULL, -- Unlimited outlets
        NULL, -- Unlimited terminals
        NULL  -- Unlimited products
    )
    ON CONFLICT (business_id) DO UPDATE SET
        plan_tier = 'Multi-Chain Enterprise',
        plan_id = 'enterprise',
        staff_limit = 5,
        outlet_limit = NULL,
        terminal_limit = NULL,
        product_limit = NULL,
        monthly_price = 3299.00,
        annual_price = 32990.00,
        status = 'ACTIVE';

    -- Seed CentralMart Admin Staff Record
    INSERT INTO public.staff_records (
        id, business_id, employee_id, name, email, role,
        pin_hash, password_hash, permissions, can_give_discount, is_active
    ) VALUES (
        'b0000000-0000-0000-0000-000000000005'::UUID,
        v_ent_biz_id,
        'CENTRAL-ADMIN',
        'CentralMart Enterprise Director',
        'director@centralmart.com',
        'STORE_ADMIN',
        crypt('9999', gen_salt('bf')),
        crypt('9999', gen_salt('bf')),
        '["all"]'::JSONB,
        TRUE,
        TRUE
    )
    ON CONFLICT (business_id, employee_id) DO NOTHING;

    -- Ensure Oursell is Professional with exact limits
    UPDATE public.subscriptions SET
        plan_tier = 'Professional',
        plan_id = 'professional',
        staff_limit = 3,
        outlet_limit = 3,
        terminal_limit = 6,
        product_limit = NULL,
        monthly_price = 799.00,
        annual_price = 7990.00,
        status = 'ACTIVE'
    WHERE business_id = v_pro_biz_id;

    -- Ensure Resell is Starter with exact limits
    UPDATE public.subscriptions SET
        plan_tier = 'Starter',
        plan_id = 'starter',
        staff_limit = 1,
        outlet_limit = 1,
        terminal_limit = 2,
        product_limit = 1000,
        monthly_price = 0.00,
        annual_price = 0.00,
        status = 'ACTIVE'
    WHERE business_id = v_str_biz_id;

    -- 9b. Seed Outlets for stores
    -- Resell: 1 outlet (Starter max)
    INSERT INTO public.outlets (business_id, name, code, address, phone, is_primary)
    VALUES (v_str_biz_id, 'Resell Fashion Boutique', 'OUT-RESELL-01', 'Commercial Street, Bangalore', '+91 98765 00001', TRUE)
    ON CONFLICT (business_id, code) DO NOTHING;

    -- Oursell: 2 outlets (Pro allows up to 3)
    INSERT INTO public.outlets (business_id, name, code, address, phone, is_primary)
    VALUES 
        (v_pro_biz_id, 'Oursell Flagship - Indiranagar', 'OUT-OUR-01', '100ft Road, Indiranagar, Bangalore', '+91 98765 00002', TRUE),
        (v_pro_biz_id, 'Oursell Express - Koramangala', 'OUT-OUR-02', '5th Block, Koramangala, Bangalore', '+91 98765 00003', FALSE)
    ON CONFLICT (business_id, code) DO NOTHING;

    -- CentralMart: 4 outlets (Enterprise unlimited)
    INSERT INTO public.outlets (business_id, name, code, address, phone, is_primary)
    VALUES 
        (v_ent_biz_id, 'CentralMart Mega Hub - MG Road', 'OUT-CM-01', 'MG Road, Bangalore', '+91 98450 11001', TRUE),
        (v_ent_biz_id, 'CentralMart Mall Counter - Whitefield', 'OUT-CM-02', 'Phoenix Marketcity, Whitefield', '+91 98450 11002', FALSE),
        (v_ent_biz_id, 'CentralMart City Center - Jayanagar', 'OUT-CM-03', '4th Block, Jayanagar', '+91 98450 11003', FALSE),
        (v_ent_biz_id, 'CentralMart Suburban - Yelahanka', 'OUT-CM-04', 'BB Road, Yelahanka', '+91 98450 11004', FALSE)
    ON CONFLICT (business_id, code) DO NOTHING;

    -- 9c. Seed POS Terminals
    -- Resell: 1 terminal (Starter max 2)
    SELECT id INTO v_out1_id FROM public.outlets WHERE business_id = v_str_biz_id LIMIT 1;
    INSERT INTO public.pos_terminals (business_id, outlet_id, terminal_code, name, status)
    VALUES (v_str_biz_id, v_out1_id, 'TERM-RES-01', 'Front Counter POS', 'ACTIVE')
    ON CONFLICT (business_id, terminal_code) DO NOTHING;

    -- Oursell: 2 terminals (Pro max 6)
    SELECT id INTO v_out2_id FROM public.outlets WHERE business_id = v_pro_biz_id LIMIT 1;
    INSERT INTO public.pos_terminals (business_id, outlet_id, terminal_code, name, status)
    VALUES 
        (v_pro_biz_id, v_out2_id, 'TERM-OUR-01', 'Main Billing Counter 1', 'ACTIVE'),
        (v_pro_biz_id, v_out2_id, 'TERM-OUR-02', 'Express Checkout Counter 2', 'ACTIVE')
    ON CONFLICT (business_id, terminal_code) DO NOTHING;

    -- CentralMart: 4 terminals (Enterprise unlimited)
    SELECT id INTO v_out3_id FROM public.outlets WHERE business_id = v_ent_biz_id LIMIT 1;
    INSERT INTO public.pos_terminals (business_id, outlet_id, terminal_code, name, status)
    VALUES 
        (v_ent_biz_id, v_out3_id, 'TERM-CM-01', 'Hypermarket Terminal #1', 'ACTIVE'),
        (v_ent_biz_id, v_out3_id, 'TERM-CM-02', 'Hypermarket Terminal #2', 'ACTIVE'),
        (v_ent_biz_id, v_out3_id, 'TERM-CM-03', 'Self-Checkout Kiosk #1', 'ACTIVE'),
        (v_ent_biz_id, v_out3_id, 'TERM-CM-04', 'Customer Service Counter', 'ACTIVE')
    ON CONFLICT (business_id, terminal_code) DO NOTHING;

END $$;
