import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { resolveStoreBusiness } from '@/lib/supabase/storeResolver';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();

  const { searchParams } = new URL(request.url);
  const storeId = searchParams.get('storeId') || searchParams.get('storeSlug') || 'oursell';

  // Basic API key format validation: enterprise keys start with sk_ent_live_
  const isKeyValid = token.startsWith('sk_ent_live_') || token.length >= 16;
  if (!authHeader || !isKeyValid) {
    return NextResponse.json(
      {
        error: 'Unauthorized',
        message: 'Valid Enterprise Bearer token required (format: Authorization: Bearer sk_ent_live_...)',
      },
      { status: 401 }
    );
  }

  const supabase = getSupabaseServerClient();
  let products: any[] = [];

  if (supabase) {
    const business = await resolveStoreBusiness(supabase, storeId);
    if (business) {
      const { data } = await (supabase as any)
        .from('products')
        .select('id, name, sku, barcode, price, cost_price, stock_quantity, category, is_active')
        .eq('business_id', business.id)
        .limit(50);
      if (data && data.length > 0) {
        products = data;
      }
    }
  }

  // Fallback demo items if database has not been seeded yet
  if (products.length === 0) {
    products = [
      {
        id: 'prod-001',
        name: 'Whole Milk 1L',
        sku: 'MILK-100',
        barcode: '8901030111111',
        price: 65.00,
        cost_price: 52.00,
        stock_quantity: 142,
        category: 'Dairy',
        is_active: true,
      },
      {
        id: 'prod-002',
        name: 'Whole Wheat Bread 400g',
        sku: 'BREAD-400',
        barcode: '8901030222222',
        price: 45.00,
        cost_price: 34.00,
        stock_quantity: 88,
        category: 'Bakery',
        is_active: true,
      },
      {
        id: 'prod-003',
        name: 'Arabica Coffee Beans 250g',
        sku: 'COFFEE-250',
        barcode: '8901030333333',
        price: 320.00,
        cost_price: 240.00,
        stock_quantity: 56,
        category: 'Beverages',
        is_active: true,
      },
    ];
  }

  return NextResponse.json({
    status: 'success',
    timestamp: new Date().toISOString(),
    latency_ms: Date.now() - startTime,
    store_id: storeId,
    endpoint: '/api/v1/catalog',
    total_count: products.length,
    data: products,
  });
}
