import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import {
  normalizePlanId,
  getPlanDisplayName,
  DEFAULT_PLAN_LIMITS,
  hasFeatureAccess,
  FEATURE_REGISTRY,
  FeatureKey,
} from '@/lib/planAccess';
import { isUuid } from '@/lib/supabase/storeResolver';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId') || searchParams.get('storeSlug') || 'oursell';
    const storeSlugParam = searchParams.get('storeSlug');

    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Database unavailable' }, { status: 503 });
    }

    const clean = storeId.trim();

    // 1. Resolve business safely without triggering 22P02 UUID errors
    let business: any = null;
    let query = (supabase as any).from('businesses').select('id, slug, name, logo_url, business_category, owner_name, contact_email, contact_phone, currency, outlet_count, terminal_count');
    if (isUuid(clean)) {
      const { data } = await query.eq('id', clean).maybeSingle();
      business = data;
    } else {
      const { data } = await query.ilike('slug', clean.toLowerCase()).maybeSingle();
      business = data;
    }

    // Try fallback slug if provided
    if (!business && storeSlugParam && storeSlugParam.toLowerCase() !== clean.toLowerCase()) {
      const { data } = await (supabase as any)
        .from('businesses')
        .select('id, slug, name, logo_url, business_category, owner_name, contact_email, contact_phone, currency, outlet_count, terminal_count')
        .ilike('slug', storeSlugParam.trim().toLowerCase())
        .maybeSingle();
      business = data;
    }

    // Fallback for brand codes
    if (!business && clean.toLowerCase().startsWith('brd-')) {
      const { data } = await (supabase as any)
        .from('businesses')
        .select('id, slug, name, logo_url, business_category, owner_name, contact_email, contact_phone, currency, outlet_count, terminal_count')
        .ilike('slug', 'oursell')
        .maybeSingle();
      business = data;
    }

    if (!business) {
      return NextResponse.json({ success: false, error: `Store "${storeId}" not found` }, { status: 404 });
    }

    // 2. Resolve active subscription
    const { data: sub } = await (supabase as any)
      .from('subscriptions')
      .select('*')
      .eq('business_id', business.id)
      .eq('status', 'ACTIVE')
      .maybeSingle();

    const planId = normalizePlanId(sub?.plan_id || sub?.plan_tier);
    const defaultLimits = DEFAULT_PLAN_LIMITS[planId];

    // Determine final limits (subscription overrides take precedence, then default)
    const staffLimit = sub?.staff_limit ?? defaultLimits.staff;
    const outletLimit = sub?.outlet_limit !== undefined ? sub.outlet_limit : defaultLimits.outlets;
    const terminalLimit = sub?.terminal_limit !== undefined ? sub.terminal_limit : defaultLimits.terminals;
    const productLimit = sub?.product_limit !== undefined ? sub.product_limit : defaultLimits.products;

    // 3. Count live resource usage
    const [staffRes, outletRes, terminalRes, productRes] = await Promise.all([
      (supabase as any)
        .from('staff_records')
        .select('id', { count: 'exact', head: true })
        .eq('business_id', business.id)
        .eq('is_active', true),
      (supabase as any)
        .from('outlets')
        .select('id', { count: 'exact', head: true })
        .eq('business_id', business.id)
        .eq('is_active', true),
      (supabase as any)
        .from('pos_terminals')
        .select('id', { count: 'exact', head: true })
        .eq('business_id', business.id)
        .eq('is_active', true),
      (supabase as any)
        .from('products')
        .select('id', { count: 'exact', head: true })
        .eq('business_id', business.id)
        .eq('is_active', true),
    ]);

    const staffUsed = staffRes.count ?? 0;
    const outletUsed = outletRes.count ?? 0;
    const terminalUsed = terminalRes.count ?? 0;
    const productUsed = productRes.count ?? 0;

    // 4. Fetch dynamic plan features if configured in DB
    const { data: dbFeatures } = await (supabase as any)
      .from('plan_features')
      .select('feature_key, is_enabled')
      .eq('plan_id', planId);

    const dynamicOverrides: Record<string, boolean> = {};
    if (dbFeatures && Array.isArray(dbFeatures)) {
      dbFeatures.forEach((f: any) => {
        dynamicOverrides[f.feature_key] = f.is_enabled;
      });
    }

    // Build features capability map
    const featuresAccess: Record<string, boolean> = {};
    Object.keys(FEATURE_REGISTRY).forEach((k) => {
      featuresAccess[k] = hasFeatureAccess(planId, k as FeatureKey, dynamicOverrides);
    });

    return NextResponse.json({
      success: true,
      store: {
        id: business.id,
        slug: business.slug,
        name: business.name,
        category: business.business_category,
        currency: business.currency || '₹',
      },
      plan: {
        id: planId,
        tier: getPlanDisplayName(planId),
        status: sub?.status || 'ACTIVE',
        billingCycle: sub?.billing_cycle || 'MONTHLY',
        monthlyPrice: sub?.monthly_price ? Number(sub.monthly_price) : planId === 'enterprise' ? 3299 : planId === 'professional' ? 799 : 0,
        annualPrice: sub?.annual_price ? Number(sub.annual_price) : planId === 'enterprise' ? 32990 : planId === 'professional' ? 7990 : 0,
        currentPeriodEnd: sub?.current_period_end || null,
        limits: {
          staff: staffLimit,
          outlets: outletLimit,
          terminals: terminalLimit,
          products: productLimit,
        },
      },
      usage: {
        staff: {
          used: staffUsed,
          limit: staffLimit,
          remaining: Math.max(0, staffLimit - staffUsed),
          isExceeded: staffUsed >= staffLimit,
        },
        outlets: {
          used: outletUsed,
          limit: outletLimit,
          remaining: outletLimit === null ? null : Math.max(0, outletLimit - outletUsed),
          isExceeded: outletLimit === null ? false : outletUsed >= outletLimit,
        },
        terminals: {
          used: terminalUsed,
          limit: terminalLimit,
          remaining: terminalLimit === null ? null : Math.max(0, terminalLimit - terminalUsed),
          isExceeded: terminalLimit === null ? false : terminalUsed >= terminalLimit,
        },
        products: {
          used: productUsed,
          limit: productLimit,
          remaining: productLimit === null ? null : Math.max(0, productLimit - productUsed),
          isExceeded: productLimit === null ? false : productUsed >= productLimit,
        },
      },
      features: featuresAccess,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
