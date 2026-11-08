import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/posDb';
import { hashPassword, verifyPassword } from '@/utils/cryptoUtils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, currentPassword, newPassword } = body;

    const trimmedUser = (username || '').trim().toLowerCase();
    const trimmedCurrent = (currentPassword || '').trim();
    const trimmedNew = (newPassword || '').trim();

    if (!trimmedUser || !trimmedCurrent || !trimmedNew) {
      return NextResponse.json(
        { success: false, error: 'All fields are required.' },
        { status: 400 }
      );
    }

    if (trimmedNew.length < 6) {
      return NextResponse.json(
        { success: false, error: 'New password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    // Find Dev Core User
    const user = await db.dev_core_users
      .where('username')
      .equalsIgnoreCase(trimmedUser)
      .first()
      .catch(() => null);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Administrator user not found.' },
        { status: 404 }
      );
    }

    // Verify current password
    const isCurrentValid = await verifyPassword(trimmedCurrent, user.passwordHash, user.salt);
    if (!isCurrentValid) {
      return NextResponse.json(
        { success: false, error: 'Current password verification failed.' },
        { status: 401 }
      );
    }

    // Hash new password securely with new salt
    const { hash: newHash, salt: newSalt } = await hashPassword(trimmedNew);

    // Update DB
    await db.dev_core_users.update(user.id, {
      passwordHash: newHash,
      salt: newSalt,
      mustChangePassword: false,
    });

    // Mirror update to accounts table if present
    const acc = await db.accounts.where('username').equals(trimmedUser).first().catch(() => null);
    if (acc) {
      await db.accounts.update(acc.id, {
        passwordHash: newHash,
        pin: trimmedNew,
      }).catch(() => {});
    }

    // Audit Log
    await db.dev_core_audit_logs.add({
      id: `audit-${Date.now()}`,
      actor: user.username,
      actorRole: user.role,
      action: 'PASSWORD_CHANGED',
      targetEntity: 'USER',
      targetId: user.id,
      details: `Password securely updated with fresh SHA-256 hash. First-login password requirement cleared.`,
      ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
      severity: 'INFO',
      timestamp: new Date().toISOString(),
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully.',
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to change password';
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 }
    );
  }
}
