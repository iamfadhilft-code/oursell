import { NextRequest, NextResponse } from 'next/server';
import { db, seedInitialData } from '@/db/posDb';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { verifyPassword } from '@/utils/cryptoUtils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    const trimmedUser = (username || '').trim().toLowerCase();
    const trimmedPass = (password || '').trim();

    if (!trimmedUser || !trimmedPass) {
      return NextResponse.json(
        { success: false, error: 'Username and password are required.' },
        { status: 400 }
      );
    }

    const ipAddress = request.headers.get('x-forwarded-for') || '127.0.0.1';

    // 1. Try Supabase dev_core_users table first
    const supabase = getSupabaseServerClient();
    if (supabase) {
      try {
        const { data: cloudUser, error } = await supabase
          .from('dev_core_users')
          .select('*')
          .eq('username', trimmedUser)
          .maybeSingle();

        if (!error && cloudUser) {
          if (!cloudUser.is_active) {
            return NextResponse.json(
              { success: false, error: 'This administrator account is disabled.' },
              { status: 403 }
            );
          }

          const isValid = await verifyPassword(trimmedPass, cloudUser.password_hash, cloudUser.salt);
          if (!isValid) {
            try {
              await supabase.from('dev_core_audit_logs').insert({
                actor: cloudUser.username,
                actor_role: cloudUser.role || 'SUPER_ADMIN',
                action: 'LOGIN_FAILED_BAD_PASSWORD',
                target_entity: 'SYSTEM',
                details: { error: 'Incorrect password supplied' },
                ip_address: ipAddress,
              });
            } catch {}

            return NextResponse.json(
              { success: false, error: 'Invalid administrator credentials.' },
              { status: 401 }
            );
          }

          // Log success in Supabase
          try {
            await supabase.from('dev_core_audit_logs').insert({
              actor: cloudUser.username,
              actor_role: cloudUser.role || 'SUPER_ADMIN',
              action: 'LOGIN_SUCCESS',
              target_entity: 'SYSTEM',
              details: { name: cloudUser.name, role: cloudUser.role },
              ip_address: ipAddress,
            });
          } catch {}

          const response = NextResponse.json({
            success: true,
            user: {
              id: cloudUser.id,
              name: cloudUser.name,
              username: cloudUser.username,
              email: cloudUser.email,
              role: cloudUser.role,
              permissions: cloudUser.permissions,
              mustChangePassword: false,
              isPermanent: Boolean(cloudUser.is_permanent),
            },
          });

          response.cookies.set('devcore_session', JSON.stringify({
            id: cloudUser.id,
            username: cloudUser.username,
            role: cloudUser.role,
            timestamp: Date.now(),
          }), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 3600 * 12,
          });

          return response;
        }
      } catch (err) {
        console.warn('Supabase devcore auth fallback to local:', err);
      }
    }

    // 2. Offline / Local fallback to Dexie
    await seedInitialData().catch(() => {});
    let user = await db.dev_core_users
      .where('username')
      .equalsIgnoreCase(trimmedUser)
      .first()
      .catch(() => null);

    if (!user && trimmedUser === 'devcore') {
      const initialSeedHash = '077eee4d64f151dc462e86983fe8fcf256a373c2a0b3d4103336003d02194940';
      const initialSalt = 'dc_salt_6001_seed';
      const isValidInitial = await verifyPassword(trimmedPass, initialSeedHash, initialSalt);

      if (isValidInitial) {
        user = {
          id: 'acc-devcore-root',
          name: 'Dev Core',
          username: 'devcore',
          email: 'devcore@oursell.internal',
          passwordHash: initialSeedHash,
          salt: initialSalt,
          role: 'SUPER_ADMIN',
          permissions: ['all'],
          mustChangePassword: false,
          isPermanent: true,
          isActive: true,
          createdAt: new Date().toISOString(),
        };
        await db.dev_core_users.put(user).catch(() => {});
      }
    }

    if (!user) {
      await db.dev_core_audit_logs.add({
        id: `audit-${Date.now()}`,
        actor: trimmedUser,
        actorRole: 'UNKNOWN',
        action: 'LOGIN_FAILED',
        targetEntity: 'SYSTEM',
        targetId: trimmedUser,
        details: `Failed administrative login attempt for username: ${trimmedUser}`,
        ipAddress,
        severity: 'WARNING',
        timestamp: new Date().toISOString(),
      }).catch(() => {});

      return NextResponse.json(
        { success: false, error: 'Invalid administrator credentials.' },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { success: false, error: 'This administrator account is disabled.' },
        { status: 403 }
      );
    }

    const isValid = await verifyPassword(trimmedPass, user.passwordHash, user.salt);
    if (!isValid) {
      await db.dev_core_audit_logs.add({
        id: `audit-${Date.now()}`,
        actor: user.username,
        actorRole: user.role,
        action: 'LOGIN_FAILED_BAD_PASSWORD',
        targetEntity: 'SYSTEM',
        targetId: user.username,
        details: `Incorrect password supplied for admin account: ${user.username}`,
        ipAddress,
        severity: 'WARNING',
        timestamp: new Date().toISOString(),
      }).catch(() => {});

      return NextResponse.json(
        { success: false, error: 'Invalid administrator credentials.' },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
        mustChangePassword: false,
        isPermanent: Boolean(user.isPermanent),
      },
    });

    response.cookies.set('devcore_session', JSON.stringify({
      id: user.id,
      username: user.username,
      role: user.role,
      timestamp: Date.now(),
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 3600 * 12,
    });

    return response;
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown authentication error';
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 }
    );
  }
}
