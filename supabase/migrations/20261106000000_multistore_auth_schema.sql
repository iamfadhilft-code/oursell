-- ==============================================================================
-- OURSELL RETAIL OS: MULTI-STORE TENANT & POS AUTHENTICATION SCHEMA
-- Production-ready schema with Row Level Security (RLS) and Tenant Data Isolation
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. BUSINESSES TABLE (Store Nodes)
CREATE TABLE IF NOT EXISTS public.businesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(64) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    logo_url TEXT,
    business_category VARCHAR(100) DEFAULT 'General Retail',
    owner_name VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(50),
    currency VARCHAR(10) DEFAULT '₹',
    tax_rate_default NUMERIC(5, 2) DEFAULT 5.00,
    outlet_count INTEGER DEFAULT 1,
    terminal_count INTEGER DEFAULT 2,
    is_active BOOLEAN DEFAULT TRUE,
    registration_status VARCHAR(50) DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_businesses_slug ON public.businesses(slug);
CREATE INDEX IF NOT EXISTS idx_businesses_status ON public.businesses(is_active, registration_status);

-- 3. PROFILES TABLE (Associated with Supabase Auth users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    phone VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. STORE MEMBERSHIPS TABLE (Multi-tenant User-Store associations)
CREATE TABLE IF NOT EXISTS public.store_memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL CHECK (role IN ('STORE_ADMIN', 'STORE_STAFF', 'SUPER_ADMIN')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_business_user UNIQUE (business_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_memberships_business_user ON public.store_memberships(business_id, user_id);

-- 5. STAFF RECORDS TABLE (In-store POS Cashiers, Managers & Staff Pins)
CREATE TABLE IF NOT EXISTS public.staff_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    employee_id VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    role VARCHAR(50) NOT NULL CHECK (role IN ('STORE_ADMIN', 'STORE_STAFF')),
    pin_hash TEXT NOT NULL,
    password_hash TEXT,
    permissions JSONB DEFAULT '["pos_billing", "customer_manage", "invoice_print"]'::JSONB,
    can_give_discount BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_business_employee UNIQUE (business_id, employee_id)
);

CREATE INDEX IF NOT EXISTS idx_staff_business_employee ON public.staff_records(business_id, employee_id);
CREATE INDEX IF NOT EXISTS idx_staff_business_email ON public.staff_records(business_id, email);

-- 6. PERMISSIONS CATALOG TABLE
CREATE TABLE IF NOT EXISTS public.permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    permission_key VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT
);

-- 7. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;

-- 7a. BUSINESSES RLS:
-- Public discovery allows querying active store slug, name, logo, and active status without exposing sensitive financials.
CREATE POLICY "Public discovery can query active store identifiers"
    ON public.businesses
    FOR SELECT
    USING (is_active = TRUE AND registration_status = 'ACTIVE');

CREATE POLICY "Store admins can manage their own business"
    ON public.businesses
    FOR ALL
    TO authenticated
    USING (
        id IN (
            SELECT business_id FROM public.store_memberships
            WHERE user_id = auth.uid() AND role = 'STORE_ADMIN' AND is_active = TRUE
        )
    );

-- 7b. PROFILES RLS:
CREATE POLICY "Users can view and update their own profile"
    ON public.profiles
    FOR ALL
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- 7c. STORE MEMBERSHIPS RLS:
CREATE POLICY "Users can view their own store memberships"
    ON public.store_memberships
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- 7d. STAFF RECORDS RLS:
-- Restricted strictly to authenticated members of the respective business
CREATE POLICY "Store admins and staff can view staff within their business"
    ON public.staff_records
    FOR SELECT
    TO authenticated
    USING (
        business_id IN (
            SELECT business_id FROM public.store_memberships
            WHERE user_id = auth.uid() AND is_active = TRUE
        )
    );

CREATE POLICY "Only store admins can insert/update staff records"
    ON public.staff_records
    FOR ALL
    TO authenticated
    USING (
        business_id IN (
            SELECT business_id FROM public.store_memberships
            WHERE user_id = auth.uid() AND role = 'STORE_ADMIN' AND is_active = TRUE
        )
    )
    WITH CHECK (
        business_id IN (
            SELECT business_id FROM public.store_memberships
            WHERE user_id = auth.uid() AND role = 'STORE_ADMIN' AND is_active = TRUE
        )
    );

-- 7e. PERMISSIONS RLS:
CREATE POLICY "Anyone authenticated can view permissions catalog"
    ON public.permissions
    FOR SELECT
    TO authenticated
    USING (TRUE);

-- 8. SEED BASELINE PERMISSIONS
INSERT INTO public.permissions (permission_key, name, category, description)
VALUES 
    ('all', 'Full Management Privilege', 'Administration', 'Full administrative control over store operations'),
    ('pos_billing', 'POS Register Billing', 'Checkout', 'Ability to ring up sales and scan barcodes'),
    ('customer_manage', 'Customer Directory & Khata', 'CRM', 'Access to customer records and credit ledgers'),
    ('invoice_print', 'Print Tax Invoices', 'Billing', 'Print thermal receipts and GST invoices'),
    ('inventory_view', 'View Inventory Stock', 'Inventory', 'View store catalog and real-time stock levels'),
    ('inventory_edit', 'Modify Products & Pricing', 'Inventory', 'Add or update products, prices, and stock counts'),
    ('staff_manage', 'Staff Team Management', 'Staff', 'Create and manage employee accounts and PINs')
ON CONFLICT (permission_key) DO NOTHING;

-- 9. SEED DEMO STORE & ACCOUNTS (oursell)
DO $$
DECLARE
    demo_biz_id UUID := 'a0000000-0000-0000-0000-000000000001'::UUID;
BEGIN
    -- Seed Oursell Demo Business
    INSERT INTO public.businesses (
        id, slug, name, logo_url, business_category, owner_name, 
        contact_email, contact_phone, currency, tax_rate_default, 
        outlet_count, terminal_count, is_active, registration_status
    ) VALUES (
        demo_biz_id,
        'oursell',
        'Oursell Demo Store',
        '/logo.png',
        'General Retail',
        'Oursell Retail Admin',
        'oursell@admin',
        '+91 98765 43210',
        '₹',
        5.00,
        2,
        4,
        TRUE,
        'ACTIVE'
    )
    ON CONFLICT (slug) DO UPDATE SET
        name = EXCLUDED.name,
        is_active = TRUE,
        registration_status = 'ACTIVE';

    -- Seed Staff Record for Admin
    INSERT INTO public.staff_records (
        id, business_id, employee_id, name, email, role,
        pin_hash, password_hash, permissions, can_give_discount, is_active
    ) VALUES (
        'b0000000-0000-0000-0000-000000000001'::UUID,
        demo_biz_id,
        'ADMIN-001',
        'Oursell Store Admin',
        'oursell@admin',
        'STORE_ADMIN',
        crypt('6001', gen_salt('bf')),
        crypt('6001', gen_salt('bf')),
        '["all"]'::JSONB,
        TRUE,
        TRUE
    )
    ON CONFLICT (business_id, employee_id) DO UPDATE SET
        pin_hash = crypt('6001', gen_salt('bf')),
        password_hash = crypt('6001', gen_salt('bf')),
        role = 'STORE_ADMIN';

    -- Seed Staff Record for Cashier (Fatima / EMP-0042)
    INSERT INTO public.staff_records (
        id, business_id, employee_id, name, email, role,
        pin_hash, password_hash, permissions, can_give_discount, is_active
    ) VALUES (
        'b0000000-0000-0000-0000-000000000002'::UUID,
        demo_biz_id,
        'EMP-0042',
        'Cashier Fatima',
        'oursell@staff',
        'STORE_STAFF',
        crypt('1234', gen_salt('bf')),
        crypt('1234', gen_salt('bf')),
        '["pos_billing", "customer_manage", "invoice_print"]'::JSONB,
        FALSE,
        TRUE
    )
    ON CONFLICT (business_id, employee_id) DO UPDATE SET
        pin_hash = crypt('1234', gen_salt('bf')),
        password_hash = crypt('1234', gen_salt('bf')),
        role = 'STORE_STAFF';

END $$;
