import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();

  const { searchParams } = new URL(request.url);
  const storeId = searchParams.get('storeId') || searchParams.get('storeSlug') || 'oursell';

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

  const sampleInventory = [
    {
      sku: 'MILK-100',
      name: 'Whole Milk 1L',
      stock_on_hand: 142,
      reorder_level: 25,
      status: 'OPTIMAL',
    },
    {
      sku: 'BREAD-400',
      name: 'Whole Wheat Bread 400g',
      stock_on_hand: 12,
      reorder_level: 20,
      status: 'LOW_STOCK',
    },
    {
      sku: 'COFFEE-250',
      name: 'Arabica Coffee Beans 250g',
      stock_on_hand: 56,
      reorder_level: 15,
      status: 'OPTIMAL',
    },
  ];

  return NextResponse.json({
    status: 'success',
    timestamp: new Date().toISOString(),
    latency_ms: Date.now() - startTime,
    store_id: storeId,
    endpoint: '/api/v1/inventory',
    total_items: sampleInventory.length,
    data: sampleInventory,
  });
}
