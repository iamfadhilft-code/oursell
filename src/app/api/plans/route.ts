import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { PricingPlan } from '@/types/pos';

// Fallback default plans if database is initializing
const DEFAULT_PLANS: PricingPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'Perfect for small stores and startups.',
    monthlyPrice: 0,
    annualPrice: 0,
    staffLimit: 1,
    outletLimit: 1,
    terminalLimit: 2,
    productLimit: 1000,
    features: [
      '1 Staff Account',
      '1 Store Outlet',
      '2 POS Terminals',
      'Full POS Billing',
      'Offline Billing',
      'Barcode Studio',
      '80mm Thermal Receipts',
      'Up to 1,000 Products',
    ],
    isActive: true,
    sortOrder: 1,
  },
  {
    id: 'professional',
    name: 'Professional',
    badge: 'MOST POPULAR',
    description: 'Ideal for supermarkets, restaurants and multi-counter outlets.',
    monthlyPrice: 799,
    annualPrice: 7990,
    staffLimit: 3,
    outletLimit: 3,
    terminalLimit: 6,
    productLimit: null,
    features: [
      'Up to 3 Staff Accounts',
      'Up to 3 Store Outlets',
      '6 POS Terminals',
      'Unlimited Products',
      'Customer Khata & Credit Ledger',
      'Purchase Orders',
      'Supplier Management',
      'Advanced Inventory & Reports',
      'English, Malayalam & Arabic Support',
    ],
    isActive: true,
    sortOrder: 2,
  },
  {
    id: 'enterprise',
    name: 'Multi-Chain Enterprise',
    description: 'For retail chains, franchises and regional networks.',
    monthlyPrice: 3299,
    annualPrice: 32990,
    staffLimit: 5,
    outletLimit: null,
    terminalLimit: null,
    productLimit: null,
    features: [
      'Up to 5 Staff Accounts',
      'Unlimited Store Outlets',
      'Unlimited POS Terminals',
      'Unlimited Products',
      'Centralized Fleet Management',
      'Dedicated Database Isolation',
      'Custom Domain',
      'Advanced Permissions',
      '24/7 Priority Support',
    ],
    isActive: true,
    sortOrder: 3,
  },
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const includeAll = searchParams.get('all') === 'true';

  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      let query = supabase.from('pricing_plans').select('*');
      if (!includeAll) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query.order('sort_order', { ascending: true });

      if (!error && data && data.length > 0) {
        const plans: PricingPlan[] = data.map((p: any) => ({
          id: p.id,
          name: p.name,
          badge: p.badge || undefined,
          description: p.description,
          monthlyPrice: Number(p.monthly_price),
          annualPrice: Number(p.annual_price),
          staffLimit: Number(p.staff_limit),
          outletLimit: p.outlet_limit === null ? null : Number(p.outlet_limit),
          terminalLimit: p.terminal_limit === null ? null : Number(p.terminal_limit),
          productLimit: p.product_limit === null ? null : Number(p.product_limit),
          features: Array.isArray(p.features) ? p.features : JSON.parse(p.features || '[]'),
          isActive: p.is_active,
          sortOrder: p.sort_order,
          updatedAt: p.updated_at,
        }));
        return NextResponse.json({ success: true, plans, isFallback: false });
      }
    } catch (e) {
      console.warn('Supabase fetch pricing_plans failed, using default:', e);
    }
  }

  return NextResponse.json({ success: true, plans: DEFAULT_PLANS, isFallback: true });
}
