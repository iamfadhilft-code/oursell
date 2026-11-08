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

  const sampleOrders = [
    {
      order_id: 'ORD-9896-001',
      date: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      customer: 'Walk-in Customer',
      items_count: 4,
      total_amount: 430.00,
      payment_method: 'UPI',
      status: 'COMPLETED',
      terminal: 'POS-01',
    },
    {
      order_id: 'ORD-9896-002',
      date: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      customer: 'VIP Member #1042',
      items_count: 2,
      total_amount: 110.00,
      payment_method: 'CASH',
      status: 'COMPLETED',
      terminal: 'POS-02',
    },
  ];

  return NextResponse.json({
    status: 'success',
    timestamp: new Date().toISOString(),
    latency_ms: Date.now() - startTime,
    store_id: storeId,
    endpoint: '/api/v1/orders',
    total_count: sampleOrders.length,
    data: sampleOrders,
  });
}
