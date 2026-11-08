import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/posDb';

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('devcore_session')?.value;
    if (!sessionCookie) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const parsed = JSON.parse(sessionCookie);
    const user = await db.dev_core_users
      .where('username')
      .equalsIgnoreCase(parsed.username)
      .first()
      .catch(() => null);

    if (!user || !user.isActive) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
        mustChangePassword: Boolean(user.mustChangePassword),
        isPermanent: Boolean(user.isPermanent),
      },
    });
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
