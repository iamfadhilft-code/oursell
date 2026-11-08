import { NextRequest, NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true, message: 'Terminal session cleared' });
  response.cookies.delete('oursell_session');
  return response;
}
