-- ==============================================================================
-- OURSELL RETAIL OS: FULL MULTI-TENANT POS DATA SCHEMA & RLS POLICIES
-- Completes Phase 8: Products, Categories, Inventory, Customers, Orders,
-- Payments, Barcodes, and Subscriptions with strict tenant isolation.
-- ==============================================================================

-- 1. PRODUCT CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_business_category UNIQUE (business_id, name)
);

CREATE INDEX IF NOT EXISTS idx_categories_business ON public.categories(business_id);

-- 2. PRODUCTS & INVENTORY TABLE
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    category_name VARCHAR(100) DEFAULT 'General',
    barcode VARCHAR(100) NOT NULL,
    sku VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    brand_name VARCHAR(100),
    unit VARCHAR(50) DEFAULT 'Pcs',
    cost_price NUMERIC(10, 2) DEFAULT 0.00,
    mrp NUMERIC(10, 2) DEFAULT 0.00,
    selling_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    tax_rate NUMERIC(5, 2) DEFAULT 5.00,
    stock INTEGER NOT NULL DEFAULT 0,
    low_stock_threshold INTEGER DEFAULT 10,
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_business_barcode UNIQUE (business_id, barcode),
    CONSTRAINT uq_business_sku UNIQUE (business_id, sku)
);

CREATE INDEX IF NOT EXISTS idx_products_business ON public.products(business_id);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON public.products(business_id, barcode);
CREATE INDEX IF NOT EXISTS idx_products_stock ON public.products(business_id, stock);

-- 3. CUSTOMERS & KHATA CREDIT DIRECTORY
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255),
    address TEXT,
    credit_limit NUMERIC(10, 2) DEFAULT 5000.00,
    current_balance NUMERIC(10, 2) DEFAULT 0.00,
    loyalty_points INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_business_phone UNIQUE (business_id, phone)
);

CREATE INDEX IF NOT EXISTS idx_customers_business ON public.customers(business_id);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers(business_id, phone);

-- 4. INVOICES / ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    invoice_number VARCHAR(100) NOT NULL,
    cashier_id VARCHAR(100),
    cashier_name VARCHAR(255),
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    customer_name VARCHAR(255),
    customer_phone VARCHAR(50),
    subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    discount_amount NUMERIC(10, 2) DEFAULT 0.00,
    tax_amount NUMERIC(10, 2) DEFAULT 0.00,
    donation_amount NUMERIC(10, 2) DEFAULT 0.00,
    grand_total NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    payment_method VARCHAR(50) DEFAULT 'CASH',
    payment_status VARCHAR(50) DEFAULT 'PAID',
    order_status VARCHAR(50) DEFAULT 'COMPLETED',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_business_invoice UNIQUE (business_id, invoice_number)
);

CREATE INDEX IF NOT EXISTS idx_invoices_business ON public.invoices(business_id);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON public.invoices(business_id, created_at);

-- 5. INVOICE LINE ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_title VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    discount NUMERIC(10, 2) DEFAULT 0.00,
    tax_rate NUMERIC(5, 2) DEFAULT 5.00,
    line_total NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON public.invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_business ON public.invoice_items(business_id);

-- 6. PAYMENTS LEDGER TABLE
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
    payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('CASH', 'CARD', 'UPI', 'KHATA', 'SPLIT')),
    amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    reference_id VARCHAR(100),
    status VARCHAR(50) DEFAULT 'SUCCESS',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_business ON public.payments(business_id);

-- 7. BARCODE RECORDS TABLE
CREATE TABLE IF NOT EXISTS public.barcode_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL,
    product_sku VARCHAR(100) NOT NULL,
    selling_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    barcode_value VARCHAR(100) NOT NULL,
    barcode_type VARCHAR(50) NOT NULL CHECK (barcode_type IN ('EAN13', 'EAN8', 'UPCA', 'CODE128', 'CODE39', 'QRCODE')),
    label_size VARCHAR(50) DEFAULT '50x25mm',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_business_barcode_val UNIQUE (business_id, barcode_value)
);

CREATE INDEX IF NOT EXISTS idx_barcode_records_business ON public.barcode_records(business_id);

-- 8. SUBSCRIPTIONS TABLE
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    plan_tier VARCHAR(50) NOT NULL DEFAULT 'Professional' CHECK (plan_tier IN ('Starter', 'Professional', 'Enterprise')),
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'TRIAL', 'PAST_DUE', 'CANCELLED')),
    billing_cycle VARCHAR(50) DEFAULT 'MONTHLY',
    monthly_price NUMERIC(10, 2) DEFAULT 49.00,
    current_period_start TIMESTAMPTZ DEFAULT NOW(),
    current_period_end TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_business_subscription UNIQUE (business_id)
);

-- 9. ROW LEVEL SECURITY (RLS) FOR MULTI-TENANT ISOLATION
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barcode_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Helper RLS condition macro: Member of business
-- Store Staff and Admins can view and operate strictly within their authenticated business

CREATE POLICY "Store staff and admins can view categories in their business"
    ON public.categories FOR SELECT TO authenticated
    USING (business_id IN (SELECT business_id FROM public.store_memberships WHERE user_id = auth.uid() AND is_active = TRUE));

CREATE POLICY "Store admins can manage categories in their business"
    ON public.categories FOR ALL TO authenticated
    USING (business_id IN (SELECT business_id FROM public.store_memberships WHERE user_id = auth.uid() AND role = 'STORE_ADMIN' AND is_active = TRUE));

CREATE POLICY "Store staff and admins can view products in their business"
    ON public.products FOR SELECT TO authenticated
    USING (business_id IN (SELECT business_id FROM public.store_memberships WHERE user_id = auth.uid() AND is_active = TRUE));

CREATE POLICY "Store admins can manage products in their business"
    ON public.products FOR ALL TO authenticated
    USING (business_id IN (SELECT business_id FROM public.store_memberships WHERE user_id = auth.uid() AND role = 'STORE_ADMIN' AND is_active = TRUE));

CREATE POLICY "Store staff and admins can view customers in their business"
    ON public.customers FOR SELECT TO authenticated
    USING (business_id IN (SELECT business_id FROM public.store_memberships WHERE user_id = auth.uid() AND is_active = TRUE));

CREATE POLICY "Store staff and admins can manage customers in their business"
    ON public.customers FOR ALL TO authenticated
    USING (business_id IN (SELECT business_id FROM public.store_memberships WHERE user_id = auth.uid() AND is_active = TRUE));

CREATE POLICY "Store staff and admins can view invoices in their business"
    ON public.invoices FOR SELECT TO authenticated
    USING (business_id IN (SELECT business_id FROM public.store_memberships WHERE user_id = auth.uid() AND is_active = TRUE));

CREATE POLICY "Store staff and admins can insert invoices in their business"
    ON public.invoices FOR INSERT TO authenticated
    WITH CHECK (business_id IN (SELECT business_id FROM public.store_memberships WHERE user_id = auth.uid() AND is_active = TRUE));

CREATE POLICY "Store staff and admins can view invoice items in their business"
    ON public.invoice_items FOR SELECT TO authenticated
    USING (business_id IN (SELECT business_id FROM public.store_memberships WHERE user_id = auth.uid() AND is_active = TRUE));

CREATE POLICY "Store staff and admins can insert invoice items in their business"
    ON public.invoice_items FOR INSERT TO authenticated
    WITH CHECK (business_id IN (SELECT business_id FROM public.store_memberships WHERE user_id = auth.uid() AND is_active = TRUE));

CREATE POLICY "Store staff and admins can view and record payments in their business"
    ON public.payments FOR ALL TO authenticated
    USING (business_id IN (SELECT business_id FROM public.store_memberships WHERE user_id = auth.uid() AND is_active = TRUE));

CREATE POLICY "Store staff and admins can view barcodes in their business"
    ON public.barcode_records FOR SELECT TO authenticated
    USING (business_id IN (SELECT business_id FROM public.store_memberships WHERE user_id = auth.uid() AND is_active = TRUE));

CREATE POLICY "Store admins can manage barcodes in their business"
    ON public.barcode_records FOR ALL TO authenticated
    USING (business_id IN (SELECT business_id FROM public.store_memberships WHERE user_id = auth.uid() AND role = 'STORE_ADMIN' AND is_active = TRUE));

CREATE POLICY "Store admins can view subscription status"
    ON public.subscriptions FOR SELECT TO authenticated
    USING (business_id IN (SELECT business_id FROM public.store_memberships WHERE user_id = auth.uid() AND role = 'STORE_ADMIN' AND is_active = TRUE));
