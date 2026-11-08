import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const sessionCookie = request.cookies.get('oursell_session');
  if (!sessionCookie?.value) {
    return NextResponse.json({ authenticated: false, session: null }, { status: 401 });
  }

  try {
    const session = JSON.parse(sessionCookie.value);
    if (!session || !session.expiresAt || session.expiresAt < Date.now()) {
      const res = NextResponse.json({ authenticated: false, session: null, error: 'Session expired' }, { status: 401 });
      res.cookies.delete('oursell_session');
      return res;
    }

    return NextResponse.json({ authenticated: true, session });
  } catch (err) {
    const res = NextResponse.json({ authenticated: false, session: null }, { status: 401 });
    res.cookies.delete('oursell_session');
    return res;
  }
}
