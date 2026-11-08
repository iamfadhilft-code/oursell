import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { normalizePlanId, DEFAULT_PLAN_LIMITS, getPlanDisplayName } from '@/lib/planAccess';
import { resolveStoreBusiness } from '@/lib/supabase/storeResolver';

async function resolveStore(supabase: ReturnType<typeof getSupabaseServerClient>, storeId: string, fallbackSlug?: string) {
  if (!supabase || !storeId) return null;

  const business = await resolveStoreBusiness(supabase, storeId, fallbackSlug);
  if (!business) return null;

  const { data: sub } = await (supabase as any)
    .from('subscriptions')
    .select('plan_id, plan_tier, product_limit, status')
    .eq('business_id', business.id)
    .eq('status', 'ACTIVE')
    .maybeSingle();

  const planId = normalizePlanId(sub?.plan_id || sub?.plan_tier);
  const productLimit = sub?.product_limit !== undefined ? sub.product_limit : DEFAULT_PLAN_LIMITS[planId].products;

  return {
    businessId: business.id,
    storeSlug: business.slug,
    planId,
    planName: getPlanDisplayName(planId),
    productLimit,
  };
}

/**
 * GET: Get product count and plan catalog limit
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId') || searchParams.get('storeSlug') || 'oursell';
    const storeSlugParam = searchParams.get('storeSlug') || undefined;

    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Database unavailable' }, { status: 503 });
    }

    const storeInfo = await resolveStore(supabase, storeId, storeSlugParam);
    if (!storeInfo) {
      return NextResponse.json({ success: false, error: `Store "${storeId}" not found` }, { status: 404 });
    }

    const { count, error } = await (supabase as any)
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', storeInfo.businessId)
      .eq('is_active', true);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const currentCount = count || 0;
    const isLimitReached = storeInfo.productLimit !== null && currentCount >= storeInfo.productLimit;

    return NextResponse.json({
      success: true,
      storeId: storeInfo.storeSlug,
      planName: storeInfo.planName,
      productLimit: storeInfo.productLimit,
      currentCount,
      isLimitReached,
      remaining: storeInfo.productLimit === null ? null : Math.max(0, storeInfo.productLimit - currentCount),
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

/**
 * POST: Create product with strict catalog limit enforcement
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      storeId,
      storeSlug,
      barcode,
      sku,
      title,
      categoryName = 'General',
      sellingPrice = 0,
      costPrice = 0,
      mrp = 0,
      taxRate = 5,
      stock = 0,
      lowStockThreshold = 10,
      unit = 'Pcs',
    } = body;

    if (!storeId || !title || !barcode) {
      return NextResponse.json({ success: false, error: 'Store ID, title, and barcode are required.' }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Database unavailable' }, { status: 503 });
    }

    const storeInfo = await resolveStore(supabase, storeId, storeSlug);
    if (!storeInfo) {
      return NextResponse.json({ success: false, error: `Store "${storeId}" not found` }, { status: 404 });
    }

    const { businessId, productLimit, planName } = storeInfo;

    // 1. Check current product count vs limit
    const { count, error: countErr } = await (supabase as any)
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', businessId)
      .eq('is_active', true);

    if (countErr) {
      return NextResponse.json({ success: false, error: countErr.message }, { status: 500 });
    }

    const currentCount = count || 0;

    if (productLimit !== null && currentCount >= productLimit) {
      return NextResponse.json(
        {
          success: false,
          error: `Product catalog limit reached for current ${planName} plan (${productLimit} products maximum). Upgrade your plan for unlimited catalog products.`,
          code: 'PRODUCT_LIMIT_EXCEEDED',
          currentCount,
          productLimit,
          planName,
        },
        { status: 403 }
      );
    }

    // 2. Insert into products (guarded also by Postgres trigger)
    const { data: newProd, error: insertErr } = await (supabase as any)
      .from('products')
      .insert({
        business_id: businessId,
        barcode: barcode.trim(),
        sku: (sku || `SKU-${Date.now().toString().slice(-4)}`).trim(),
        title: title.trim(),
        category_name: categoryName,
        selling_price: Number(sellingPrice),
        cost_price: Number(costPrice),
        mrp: Number(mrp),
        tax_rate: Number(taxRate),
        stock: Number(stock),
        low_stock_threshold: Number(lowStockThreshold),
        unit,
        is_active: true,
      })
      .select()
      .single();

    if (insertErr) {
      if (insertErr.message?.includes('Product catalog limit reached') || insertErr.code === '23514') {
        return NextResponse.json(
          {
            success: false,
            error: insertErr.message,
            code: 'PRODUCT_LIMIT_EXCEEDED',
            currentCount,
            productLimit,
          },
          { status: 403 }
        );
      }
      return NextResponse.json({ success: false, error: insertErr.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `Product "${newProd.title}" created successfully.`,
      product: newProd,
      currentCount: currentCount + 1,
      productLimit,
    }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
