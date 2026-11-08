-- ==============================================================================
-- OURSELL RETAIL OS: PRICING PLANS, PLAN ENQUIRIES & STAFF LIMIT ENFORCEMENT
-- Migration 03: Centralized Plan Architecture, Enquiry Management & Database Guardrails
-- ==============================================================================

-- 1. PRICING PLANS TABLE (Centralized Global Configuration)
CREATE TABLE IF NOT EXISTS public.pricing_plans (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    badge VARCHAR(50),
    description TEXT NOT NULL,
    monthly_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    annual_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    staff_limit INTEGER NOT NULL DEFAULT 1,
    outlet_limit INTEGER, -- NULL = Unlimited
    terminal_limit INTEGER, -- NULL = Unlimited
    product_limit INTEGER, -- NULL = Unlimited
    features JSONB NOT NULL DEFAULT '[]'::JSONB,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. SEED DEFAULT 3 PLANS (Starter, Professional, Multi-Chain Enterprise)
INSERT INTO public.pricing_plans (
    id, name, badge, description, monthly_price, annual_price, staff_limit, outlet_limit, terminal_limit, product_limit, features, is_active, sort_order
) VALUES 
(
    'starter',
    'Starter',
    NULL,
    'Perfect for small stores and startups.',
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
        "Offline Billing",
        "Barcode Studio",
        "80mm Thermal Receipts",
        "Up to 1,000 Products"
    ]'::JSONB,
    TRUE,
    1
),
(
    'professional',
    'Professional',
    'MOST POPULAR',
    'Ideal for supermarkets, restaurants and multi-counter outlets.',
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
        "Purchase Orders",
        "Supplier Management",
        "Advanced Inventory & Reports",
        "English, Malayalam & Arabic Support"
    ]'::JSONB,
    TRUE,
    2
),
(
    'enterprise',
    'Multi-Chain Enterprise',
    NULL,
    'For retail chains, franchises and regional networks.',
    3299.00,
    32990.00,
    5,
    NULL,
    NULL,
    NULL,
    '[
        "Up to 5 Staff Accounts",
        "Unlimited Store Outlets",
        "Unlimited POS Terminals",
        "Unlimited Products",
        "Centralized Fleet Management",
        "Dedicated Database Isolation",
        "Custom Domain",
        "Advanced Permissions",
        "24/7 Priority Support"
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

-- 3. PLAN ENQUIRIES TABLE (Contact Us / Plan Inquiry Leads)
CREATE TABLE IF NOT EXISTS public.plan_enquiries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id VARCHAR(50) REFERENCES public.pricing_plans(id) ON DELETE SET NULL,
    plan_name VARCHAR(100) NOT NULL,
    billing_cycle VARCHAR(20) NOT NULL DEFAULT 'MONTHLY',
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50) NOT NULL,
    message TEXT,
    status VARCHAR(50) DEFAULT 'NEW' CHECK (status IN ('NEW', 'CONTACTED', 'CONVERTED', 'CLOSED')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_plan_enquiries_status ON public.plan_enquiries(status);
CREATE INDEX IF NOT EXISTS idx_plan_enquiries_plan_id ON public.plan_enquiries(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_enquiries_created_at ON public.plan_enquiries(created_at DESC);

-- 4. UPDATE SUBSCRIPTIONS TABLE WITH PLAN RELATION & LIMITS
ALTER TABLE public.subscriptions 
    ADD COLUMN IF NOT EXISTS plan_id VARCHAR(50) REFERENCES public.pricing_plans(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS annual_price NUMERIC(10, 2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS staff_limit INTEGER DEFAULT 3,
    ADD COLUMN IF NOT EXISTS outlet_limit INTEGER DEFAULT 3,
    ADD COLUMN IF NOT EXISTS terminal_limit INTEGER DEFAULT 6,
    ADD COLUMN IF NOT EXISTS product_limit INTEGER;

-- 5. FUNCTION: ENFORCE STAFF ACCOUNT LIMIT PER STORE
CREATE OR REPLACE FUNCTION public.check_store_staff_limit()
RETURNS TRIGGER AS $$
DECLARE
    v_staff_limit INTEGER;
    v_current_count INTEGER;
    v_plan_name VARCHAR(100);
BEGIN
    -- Only check on active staff inserts or reactivation
    IF NEW.is_active = TRUE THEN
        -- Find staff limit from subscriptions table or default to Starter plan (limit 1)
        SELECT 
            COALESCE(s.staff_limit, p.staff_limit, 1),
            COALESCE(p.name, s.plan_tier, 'Starter')
        INTO v_staff_limit, v_plan_name
        FROM public.businesses b
        LEFT JOIN public.subscriptions s ON s.business_id = b.id AND s.status = 'ACTIVE'
        LEFT JOIN public.pricing_plans p ON (p.id = s.plan_id OR LOWER(p.name) = LOWER(s.plan_tier))
        WHERE b.id = NEW.business_id
        LIMIT 1;

        IF v_staff_limit IS NULL THEN
            v_staff_limit := 1;
            v_plan_name := 'Starter';
        END IF;

        -- Count existing active staff records for this store (excluding current row if updating)
        SELECT COUNT(*)
        INTO v_current_count
        FROM public.staff_records
        WHERE business_id = NEW.business_id 
          AND is_active = TRUE
          AND (TG_OP = 'INSERT' OR id != NEW.id);

        -- If limit reached or exceeded, reject creation
        IF v_current_count >= v_staff_limit THEN
            RAISE EXCEPTION 'Staff limit reached for current % plan (% active staff accounts maximum). Upgrade your plan to add more staff.',
                v_plan_name, v_staff_limit
                USING ERRCODE = 'check_violation';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on staff_records table
DROP TRIGGER IF EXISTS trg_check_store_staff_limit ON public.staff_records;
CREATE TRIGGER trg_check_store_staff_limit
    BEFORE INSERT OR UPDATE OF is_active
    ON public.staff_records
    FOR EACH ROW
    EXECUTE FUNCTION public.check_store_staff_limit();

-- 6. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.pricing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_enquiries ENABLE ROW LEVEL SECURITY;

-- 6a. Pricing Plans: Public can view active plans
DROP POLICY IF EXISTS "Public can view active pricing plans" ON public.pricing_plans;
CREATE POLICY "Public can view active pricing plans"
    ON public.pricing_plans
    FOR SELECT
    USING (is_active = TRUE);

-- Dev Core / Super Admin management policy (via service role or super admin check)
DROP POLICY IF EXISTS "Dev Core can manage pricing plans" ON public.pricing_plans;
CREATE POLICY "Dev Core can manage pricing plans"
    ON public.pricing_plans
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.dev_core_users
            WHERE id = auth.uid() OR role = 'SUPER_ADMIN'
        )
    );

-- 6b. Plan Enquiries: Public can submit enquiries
DROP POLICY IF EXISTS "Public can submit plan enquiries" ON public.plan_enquiries;
CREATE POLICY "Public can submit plan enquiries"
    ON public.plan_enquiries
    FOR INSERT
    WITH CHECK (
        customer_name IS NOT NULL AND 
        customer_email IS NOT NULL AND 
        customer_phone IS NOT NULL
    );

-- Dev Core can view and update plan enquiries
DROP POLICY IF EXISTS "Dev Core can view and manage plan enquiries" ON public.plan_enquiries;
CREATE POLICY "Dev Core can view and manage plan enquiries"
    ON public.plan_enquiries
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.dev_core_users
            WHERE id = auth.uid() OR role = 'SUPER_ADMIN'
        )
    );
