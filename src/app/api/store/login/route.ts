import { NextRequest, NextResponse } from 'next/server';
import { authenticateStoreCredentials } from '@/lib/auth/authService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { storeSlug, identifier, secret, roleIntent, rememberMe } = body;

    const result = await authenticateStoreCredentials(
      storeSlug,
      identifier,
      secret,
      roleIntent,
      Boolean(rememberMe)
    );

    if (!result.success || !result.session) {
      return NextResponse.json(
        { success: false, error: result.error || 'Authentication failed' },
        { status: 401 }
      );
    }

    const response = NextResponse.json(result);

    // Set secure session cookie
    const maxAge = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 12; // 30 days or 12 hours
    response.cookies.set('oursell_session', JSON.stringify(result.session), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge,
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Server authentication error' },
      { status: 500 }
    );
  }
}
