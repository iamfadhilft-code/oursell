-- ==============================================================================
-- OURSELL RETAIL OS: FULL ECOSYSTEM SCHEMA (Migration 02)
-- Adding: brand_applications, customer_credit_ledger, suppliers, purchase_orders,
-- shifts, store_expenses, promotions, held_carts, dev_core_users, support_inbox,
-- system_settings, dev_core_audit_logs + Foreign Key Indexes & RLS Optimizations.
-- ==============================================================================

-- 1. FOREIGN KEY INDEXES (Addressing Advisor recommendations)
CREATE INDEX IF NOT EXISTS idx_barcode_records_product ON public.barcode_records(product_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_product ON public.invoice_items(product_id);
CREATE INDEX IF NOT EXISTS idx_invoices_customer ON public.invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON public.payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_store_memberships_user ON public.store_memberships(user_id);

-- 2. BRAND APPLICATIONS TABLE (Store Node Onboarding Requests)
CREATE TABLE IF NOT EXISTS public.brand_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_name VARCHAR(255) NOT NULL,
    requested_username VARCHAR(64) UNIQUE NOT NULL,
    owner_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    business_category VARCHAR(100) DEFAULT 'General Retail',
    notes TEXT,
    status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    rejection_reason TEXT,
    applied_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_brand_applications_status ON public.brand_applications(status);

-- 3. CUSTOMER CREDIT LEDGER (Khata Transactions)
CREATE TABLE IF NOT EXISTS public.customer_credit_ledger (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('CREDIT_GIVEN', 'PAYMENT_COLLECTED', 'ADJUSTMENT')),
    amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    order_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
    balance_after NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    payment_mode VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ccl_business_customer ON public.customer_credit_ledger(business_id, customer_id);
CREATE INDEX IF NOT EXISTS idx_ccl_order ON public.customer_credit_ledger(order_id);

-- 4. SUPPLIERS TABLE
CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    company_name VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255),
    address TEXT,
    gstin VARCHAR(50),
    outstanding_balance NUMERIC(10, 2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_suppliers_business ON public.suppliers(business_id);

-- 5. PURCHASE ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.purchase_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    po_number VARCHAR(100) NOT NULL,
    supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
    items JSONB DEFAULT '[]'::JSONB,
    total_cost NUMERIC(10, 2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'ORDERED', 'RECEIVED', 'CANCELLED')),
    expected_delivery DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_business_po UNIQUE (business_id, po_number)
);

CREATE INDEX IF NOT EXISTS idx_po_business ON public.purchase_orders(business_id);
CREATE INDEX IF NOT EXISTS idx_po_supplier ON public.purchase_orders(supplier_id);

-- 6. SHIFTS TABLE (Cash Register Sessions)
CREATE TABLE IF NOT EXISTS public.shifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    terminal_id VARCHAR(100) DEFAULT 'MAIN-01',
    cashier_id VARCHAR(100) NOT NULL,
    cashier_name VARCHAR(255) NOT NULL,
    opening_cash NUMERIC(10, 2) DEFAULT 0.00,
    closing_cash NUMERIC(10, 2),
    expected_cash NUMERIC(10, 2) DEFAULT 0.00,
    cash_difference NUMERIC(10, 2) DEFAULT 0.00,
    total_sales NUMERIC(10, 2) DEFAULT 0.00,
    cash_sales NUMERIC(10, 2) DEFAULT 0.00,
    card_sales NUMERIC(10, 2) DEFAULT 0.00,
    upi_sales NUMERIC(10, 2) DEFAULT 0.00,
    khata_sales NUMERIC(10, 2) DEFAULT 0.00,
    expenses_total NUMERIC(10, 2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'CLOSED')),
    opened_at TIMESTAMPTZ DEFAULT NOW(),
    closed_at TIMESTAMPTZ,
    notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_shifts_business ON public.shifts(business_id);

-- 7. STORE EXPENSES TABLE
CREATE TABLE IF NOT EXISTS public.store_expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    shift_id UUID REFERENCES public.shifts(id) ON DELETE SET NULL,
    category VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    payment_method VARCHAR(50) DEFAULT 'CASH',
    paid_to VARCHAR(255),
    notes TEXT,
    recorded_by VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expenses_business ON public.store_expenses(business_id);
CREATE INDEX IF NOT EXISTS idx_expenses_shift ON public.store_expenses(shift_id);

-- 8. PROMOTIONS TABLE
CREATE TABLE IF NOT EXISTS public.promotions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    promo_type VARCHAR(50) NOT NULL CHECK (promo_type IN ('PERCENTAGE', 'FLAT_CART', 'BOGO', 'ITEM_DISCOUNT')),
    discount_value NUMERIC(10, 2) DEFAULT 0.00,
    min_cart_value NUMERIC(10, 2) DEFAULT 0.00,
    buy_qty INTEGER,
    get_qty INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    starts_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_business_promo UNIQUE (business_id, code)
);

CREATE INDEX IF NOT EXISTS idx_promos_business ON public.promotions(business_id);

-- 9. HELD CARTS TABLE
CREATE TABLE IF NOT EXISTS public.held_carts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    held_number VARCHAR(50) NOT NULL,
    cashier_id VARCHAR(100),
    customer_name VARCHAR(255),
    items JSONB NOT NULL DEFAULT '[]'::JSONB,
    subtotal NUMERIC(10, 2) DEFAULT 0.00,
    discount NUMERIC(10, 2) DEFAULT 0.00,
    tax NUMERIC(10, 2) DEFAULT 0.00,
    total NUMERIC(10, 2) DEFAULT 0.00,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_held_carts_business ON public.held_carts(business_id);

-- 10. DEV CORE USERS (Platform Super Administrators)
CREATE TABLE IF NOT EXISTS public.dev_core_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(64) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    role VARCHAR(50) DEFAULT 'SUPER_ADMIN',
    permissions JSONB DEFAULT '["all"]'::JSONB,
    is_permanent BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed Dev Core Root Super Admin
INSERT INTO public.dev_core_users (
    id, username, email, name, password_hash, salt, role, permissions, is_permanent, is_active
) VALUES (
    'c0000000-0000-0000-0000-000000000001'::UUID,
    'devcore',
    'devcore@oursell.internal',
    'Dev Core Admin',
    '077eee4d64f151dc462e86983fe8fcf256a373c2a0b3d4103336003d02194940',
    'dc_salt_6001_seed',
    'SUPER_ADMIN',
    '["all"]'::JSONB,
    TRUE,
    TRUE
) ON CONFLICT (username) DO NOTHING;

-- 11. SUPPORT INBOX
CREATE TABLE IF NOT EXISTS public.support_inbox (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
    store_name VARCHAR(255),
    sender_email VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    priority VARCHAR(50) DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    status VARCHAR(50) DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. SYSTEM SETTINGS
CREATE TABLE IF NOT EXISTS public.system_settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. DEV CORE AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.dev_core_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor VARCHAR(255) NOT NULL,
    actor_role VARCHAR(100) NOT NULL,
    action VARCHAR(100) NOT NULL,
    target_entity VARCHAR(100) NOT NULL,
    details JSONB DEFAULT '{}'::JSONB,
    ip_address VARCHAR(50),
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 14. ROW LEVEL SECURITY (RLS) FOR NEW TABLES
ALTER TABLE public.brand_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_credit_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.held_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dev_core_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_inbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dev_core_audit_logs ENABLE ROW LEVEL SECURITY;

-- 14a. BRAND APPLICATIONS: Public can submit; Dev Core can read/update
CREATE POLICY "Public can submit brand applications"
    ON public.brand_applications FOR INSERT
    WITH CHECK (TRUE);

CREATE POLICY "Public can check application status by username"
    ON public.brand_applications FOR SELECT
    USING (TRUE);

-- 14b. CUSTOMER CREDIT LEDGER: Staff and Admin access
CREATE POLICY "Store staff and admins can view credit ledger"
    ON public.customer_credit_ledger FOR SELECT TO authenticated
    USING (business_id IN (SELECT business_id FROM public.store_memberships WHERE user_id = (SELECT auth.uid()) AND is_active = TRUE));

CREATE POLICY "Store staff and admins can record credit ledger entries"
    ON public.customer_credit_ledger FOR INSERT TO authenticated
    WITH CHECK (business_id IN (SELECT business_id FROM public.store_memberships WHERE user_id = (SELECT auth.uid()) AND is_active = TRUE));

-- 14c. SUPPLIERS & PURCHASE ORDERS: Store Admin access
CREATE POLICY "Store staff and admins can view suppliers"
    ON public.suppliers FOR SELECT TO authenticated
    USING (business_id IN (SELECT business_id FROM public.store_memberships WHERE user_id = (SELECT auth.uid()) AND is_active = TRUE));

CREATE POLICY "Store admins can manage suppliers"
    ON public.suppliers FOR INSERT TO authenticated
    WITH CHECK (business_id IN (SELECT business_id FROM public.store_memberships WHERE user_id = (SELECT auth.uid()) AND role = 'STORE_ADMIN' AND is_active = TRUE));

CREATE POLICY "Store admins can update suppliers"
    ON public.suppliers FOR UPDATE TO authenticated
    USING (business_id IN (SELECT business_id FROM public.store_memberships WHERE user_id = (SELECT auth.uid()) AND role = 'STORE_ADMIN' AND is_active = TRUE))
    WITH CHECK (business_id IN (SELECT business_id FROM public.store_memberships WHERE user_id = (SELECT auth.uid()) AND role = 'STORE_ADMIN' AND is_active = TRUE));

CREATE POLICY "Store admins can delete suppliers"
    ON public.suppliers FOR DELETE TO authenticated
    USING (business_id IN (SELECT business_id FROM public.store_memberships WHERE user_id = (SELECT auth.uid()) AND role = 'STORE_ADMIN' AND is_active = TRUE));

CREATE POLICY "Store staff and admins can view purchase orders"
    ON public.purchase_orders FOR SELECT TO authenticated
    USING (business_id IN (SELECT business_id FROM public.store_memberships WHERE user_id = (SELECT auth.uid()) AND is_active = TRUE));

CREATE POLICY "Store admins can manage purchase orders"
    ON public.purchase_orders FOR ALL TO authenticated
    USING (business_id IN (SELECT business_id FROM public.store_memberships WHERE user_id = (SELECT auth.uid()) AND role = 'STORE_ADMIN' AND is_active = TRUE));

-- 14d. SHIFTS & EXPENSES:
CREATE POLICY "Store staff and admins can view and record shifts"
    ON public.shifts FOR ALL TO authenticated
    USING (business_id IN (SELECT business_id FROM public.store_memberships WHERE user_id = (SELECT auth.uid()) AND is_active = TRUE));

CREATE POLICY "Store staff and admins can view and record expenses"
    ON public.store_expenses FOR ALL TO authenticated
    USING (business_id IN (SELECT business_id FROM public.store_memberships WHERE user_id = (SELECT auth.uid()) AND is_active = TRUE));

-- 14e. PROMOTIONS & HELD CARTS:
CREATE POLICY "Store staff and admins can view promotions"
    ON public.promotions FOR SELECT TO authenticated
    USING (business_id IN (SELECT business_id FROM public.store_memberships WHERE user_id = (SELECT auth.uid()) AND is_active = TRUE));

CREATE POLICY "Store admins can manage promotions"
    ON public.promotions FOR ALL TO authenticated
    USING (business_id IN (SELECT business_id FROM public.store_memberships WHERE user_id = (SELECT auth.uid()) AND role = 'STORE_ADMIN' AND is_active = TRUE));

CREATE POLICY "Store staff and admins can manage held carts"
    ON public.held_carts FOR ALL TO authenticated
    USING (business_id IN (SELECT business_id FROM public.store_memberships WHERE user_id = (SELECT auth.uid()) AND is_active = TRUE));
