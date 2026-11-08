import { NextRequest, NextResponse } from 'next/server';
import { discoverStoreNode } from '@/lib/auth/authService';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug') || '';

  const result = await discoverStoreNode(slug);
  return NextResponse.json(result, { status: result.exists ? 200 : 404 });
}
