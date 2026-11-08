import { db } from '@/db/posDb';
import { StaffUser, StoreAccount, StaffPermission } from '@/types/pos';

/**
 * Normalizes string for fuzzy staff matching
 */
function normalizeKey(str: string): string {
  return (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Converts a StoreAccount (from db.accounts) to StaffUser (for db.staff_users)
 */
export function accountToStaffUser(account: StoreAccount, fallbackBrandId?: string): StaffUser {
  const isSuper = account.role === 'STORE_ADMIN';
  const hasDiscountPerm = account.permissions?.includes('discount_approve') || account.permissions?.includes('all');
  const hasManagerPerm = account.permissions?.includes('inventory_edit') || account.permissions?.includes('supplier_manage');

  const role: 'ADMIN' | 'MANAGER' | 'CASHIER' = isSuper
    ? 'ADMIN'
    : hasManagerPerm
    ? 'MANAGER'
    : 'CASHIER';

  return {
    id: account.id,
    brandId: account.storeId || fallbackBrandId || 'oursell',
    name: account.name || account.username || 'Staff Member',
    pin: account.pin || (account.passwordHash ? account.passwordHash.slice(-4) : '1111'),
    role,
    commissionRate: 0.02,
    totalSalesGenerated: 0,
    canGiveDiscount: isSuper || hasDiscountPerm,
    isActive: account.isActive !== false,
  };
}

/**
 * Converts a StaffUser (from db.staff_users) to StoreAccount (for db.accounts)
 */
export function staffUserToAccount(staff: StaffUser, fallbackStoreId?: string): StoreAccount {
  const isAdmin = staff.role === 'ADMIN';
  const basePerms: StaffPermission[] = isAdmin
    ? ['all']
    : [
        'pos_billing',
        'customer_manage',
        'invoice_print',
        'inventory_view',
        ...(staff.canGiveDiscount ? ['discount_approve' as StaffPermission] : []),
        ...(staff.role === 'MANAGER' ? ['inventory_edit' as StaffPermission, 'supplier_manage' as StaffPermission] : []),
      ];

  const username = normalizeKey(staff.name) || `staff_${staff.pin || '1111'}`;

  return {
    id: staff.id,
    storeId: staff.brandId || fallbackStoreId || 'oursell',
    username,
    name: staff.name,
    passwordHash: staff.pin || '1111',
    pin: staff.pin || '1111',
    role: isAdmin ? 'STORE_ADMIN' : 'STORE_STAFF',
    permissions: basePerms,
    isActive: staff.isActive !== false,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Bi-directionally synchronizes db.accounts and db.staff_users for a given store.
 * Ensures that if a staff account exists in one table, it is reflected in the other.
 */
export async function syncStaffBetweenTables(targetStoreId?: string): Promise<{ accounts: StoreAccount[]; staffUsers: StaffUser[] }> {
  try {
    const storeId = targetStoreId || 'oursell';

    // 1. Fetch all accounts and staff users
    const [allAccounts, allStaff] = await Promise.all([
      db.accounts.toArray(),
      db.staff_users.toArray(),
    ]);

    // Filter by store if provided (or include all if storeId is generic / match either slug or brandId)
    const storeAccounts = allAccounts.filter(
      (a) => !targetStoreId || a.storeId === targetStoreId || normalizeKey(a.storeId) === normalizeKey(storeId) || a.storeId === 'oursell'
    );
    const storeStaff = allStaff.filter(
      (s) => !targetStoreId || s.brandId === targetStoreId || normalizeKey(s.brandId) === normalizeKey(storeId) || s.brandId === 'oursell'
    );

    // 2. Sync any missing account into db.staff_users
    for (const acc of storeAccounts) {
      // DevCore root or system users can be skipped if desired, but store accounts should be synced
      if (acc.username === 'devcore') continue;

      const existsInStaff = allStaff.find(
        (s) =>
          s.id === acc.id ||
          normalizeKey(s.name) === normalizeKey(acc.name) ||
          (acc.pin && s.pin === acc.pin) ||
          normalizeKey(s.name) === normalizeKey(acc.username)
      );

      if (!existsInStaff) {
        const newStaff = accountToStaffUser(acc, storeId);
        await db.staff_users.put(newStaff);
        allStaff.push(newStaff);
      } else {
        // Sync active status or PIN if they differ
        let changed = false;
        if (existsInStaff.isActive !== acc.isActive) {
          existsInStaff.isActive = acc.isActive;
          changed = true;
        }
        if (acc.pin && existsInStaff.pin !== acc.pin) {
          existsInStaff.pin = acc.pin;
          changed = true;
        }
        if (changed) {
          await db.staff_users.put(existsInStaff);
        }
      }
    }

    // 3. Sync any missing staff_user into db.accounts
    for (const st of storeStaff) {
      const existsInAcc = allAccounts.find(
        (a) =>
          a.id === st.id ||
          normalizeKey(a.name) === normalizeKey(st.name) ||
          (st.pin && a.pin === st.pin) ||
          normalizeKey(a.username) === normalizeKey(st.name)
      );

      if (!existsInAcc) {
        const newAcc = staffUserToAccount(st, storeId);
        await db.accounts.put(newAcc);
        allAccounts.push(newAcc);
      } else {
        let changed = false;
        if (existsInAcc.isActive !== st.isActive) {
          existsInAcc.isActive = st.isActive;
          changed = true;
        }
        if (st.pin && existsInAcc.pin !== st.pin) {
          existsInAcc.pin = st.pin;
          existsInAcc.passwordHash = st.pin;
          changed = true;
        }
        if (changed) {
          await db.accounts.put(existsInAcc);
        }
      }
    }

    // Return fresh consolidated lists
    const [finalAccounts, finalStaff] = await Promise.all([
      db.accounts.toArray(),
      db.staff_users.toArray(),
    ]);

    return {
      accounts: finalAccounts.filter(
        (a) => !targetStoreId || a.storeId === targetStoreId || normalizeKey(a.storeId) === normalizeKey(storeId) || a.storeId === 'oursell'
      ),
      staffUsers: finalStaff.filter(
        (s) => !targetStoreId || s.brandId === targetStoreId || normalizeKey(s.brandId) === normalizeKey(storeId) || s.brandId === 'oursell'
      ),
    };
  } catch (err) {
    console.warn('Error during staff bi-directional sync:', err);
    return { accounts: [], staffUsers: [] };
  }
}

/**
 * Creates or saves a staff member simultaneously in both tables and optionally syncs with backend.
 */
export async function saveUnifiedStaff(data: {
  id?: string;
  storeId: string;
  name: string;
  username?: string;
  pin: string;
  password?: string;
  role: 'STORE_ADMIN' | 'STORE_STAFF' | 'ADMIN' | 'MANAGER' | 'CASHIER';
  permissions?: StaffPermission[];
  canGiveDiscount?: boolean;
  commissionRate?: number;
  isActive?: boolean;
}): Promise<{ account: StoreAccount; staffUser: StaffUser }> {
  const id = data.id || `staff-${Date.now()}`;
  const storeId = data.storeId || 'oursell';
  const name = data.name.trim();
  const pin = data.pin.trim();
  const isActive = data.isActive !== false;

  const isAdmin = data.role === 'STORE_ADMIN' || data.role === 'ADMIN';
  const isManager = data.role === 'MANAGER';

  const staffRole: 'ADMIN' | 'MANAGER' | 'CASHIER' = isAdmin ? 'ADMIN' : isManager ? 'MANAGER' : 'CASHIER';
  const accountRole: 'STORE_ADMIN' | 'STORE_STAFF' = isAdmin ? 'STORE_ADMIN' : 'STORE_STAFF';

  const canGiveDiscount = data.canGiveDiscount !== undefined ? data.canGiveDiscount : (isAdmin || false);

  const permissions: StaffPermission[] = data.permissions || (
    isAdmin
      ? ['all']
      : [
          'pos_billing',
          'customer_manage',
          'invoice_print',
          'inventory_view',
          ...(canGiveDiscount ? ['discount_approve' as StaffPermission] : []),
          ...(isManager ? ['inventory_edit' as StaffPermission, 'supplier_manage' as StaffPermission] : []),
        ]
  );

  const username = data.username?.trim().toLowerCase() || normalizeKey(name) || `staff_${pin}`;

  // 1. StaffUser record
  const staffUser: StaffUser = {
    id,
    brandId: storeId,
    name,
    pin,
    role: staffRole,
    commissionRate: data.commissionRate !== undefined ? Number(data.commissionRate) : 0.02,
    totalSalesGenerated: 0,
    canGiveDiscount,
    isActive,
  };

  // 2. StoreAccount record
  const account: StoreAccount = {
    id,
    storeId,
    username,
    name,
    passwordHash: data.password?.trim() || pin,
    pin,
    role: accountRole,
    permissions,
    isActive,
    createdAt: new Date().toISOString(),
  };

  // Persist both in parallel
  await Promise.all([
    db.staff_users.put(staffUser),
    db.accounts.put(account),
  ]);

  // Optional backend cloud sync
  try {
    fetch('/api/store/staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        storeId,
        name,
        pin,
        email: `${username}@oursell.internal`,
        employeeId: username.toUpperCase(),
        role: accountRole,
        permissions,
        canGiveDiscount,
      }),
    }).catch(() => {});
  } catch (e) {
    // ignore background network error
  }

  return { account, staffUser };
}

export interface UnifiedStaffUpdates {
  name?: string;
  username?: string;
  pin?: string;
  password?: string;
  role?: 'ADMIN' | 'MANAGER' | 'CASHIER' | 'STORE_ADMIN' | 'STORE_STAFF';
  commissionRate?: number;
  canGiveDiscount?: boolean;
  permissions?: StaffPermission[];
  isActive?: boolean;
}

/**
 * Updates a staff member in both tables simultaneously.
 */
export async function updateUnifiedStaff(
  id: string,
  updates: UnifiedStaffUpdates
): Promise<void> {
  const [existingStaff, existingAccount] = await Promise.all([
    db.staff_users.get(id),
    db.accounts.get(id),
  ]);

  if (existingStaff) {
    const updatedStaff: StaffUser = {
      ...existingStaff,
      ...(updates.name && { name: updates.name.trim() }),
      ...(updates.pin && { pin: updates.pin.trim() }),
      ...(updates.role && {
        role: updates.role === 'STORE_ADMIN' ? 'ADMIN' : updates.role === 'STORE_STAFF' ? 'CASHIER' : updates.role,
      }),
      ...(updates.commissionRate !== undefined && { commissionRate: Number(updates.commissionRate) }),
      ...(updates.canGiveDiscount !== undefined && { canGiveDiscount: updates.canGiveDiscount }),
      ...(updates.isActive !== undefined && { isActive: updates.isActive }),
    };
    await db.staff_users.put(updatedStaff);
  }

  if (existingAccount) {
    const updatedAccount: StoreAccount = {
      ...existingAccount,
      ...(updates.name && { name: updates.name.trim() }),
      ...(updates.username && { username: updates.username.trim().toLowerCase() }),
      ...(updates.pin && { pin: updates.pin.trim() }),
      ...(updates.password && { passwordHash: updates.password.trim() }),
      ...(updates.role && {
        role: updates.role === 'ADMIN' ? 'STORE_ADMIN' : updates.role === 'CASHIER' || updates.role === 'MANAGER' ? 'STORE_STAFF' : updates.role,
      }),
      ...(updates.permissions && { permissions: updates.permissions }),
      ...(updates.isActive !== undefined && { isActive: updates.isActive }),
    };
    await db.accounts.put(updatedAccount);
  }
}

/**
 * Toggles active status in both tables simultaneously.
 */
export async function toggleActiveUnifiedStaff(id: string, newStatus: boolean): Promise<void> {
  await Promise.all([
    db.staff_users.update(id, { isActive: newStatus }).catch(() => {}),
    db.accounts.update(id, { isActive: newStatus }).catch(() => {}),
  ]);
}

/**
 * Deletes a staff member from both tables simultaneously.
 */
export async function deleteUnifiedStaff(id: string): Promise<void> {
  await Promise.all([
    db.staff_users.delete(id).catch(() => {}),
    db.accounts.delete(id).catch(() => {}),
  ]);
}
