import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Brand, StoreAccount, StaffPermission } from '@/types/pos';
import { db, seedDevCoreData } from '@/db/posDb';
import { usePosStore } from './usePosStore';
import { verifyPassword } from '@/utils/cryptoUtils';

interface BrandAuthState {
  isAuthenticated: boolean;
  currentBrand: Brand | null;
  currentAccount: StoreAccount | null;
  currentRole: 'STORE_ADMIN' | 'STORE_STAFF' | 'SUPER_ADMIN' | null;
  permissions: StaffPermission[];
  isLoading: boolean;
  loginError: string | null;

  login: (
    username: string,
    password: string
  ) => Promise<{ success: boolean; redirectUrl?: string; role?: string; error?: string }>;
  logout: () => void;
  checkSession: () => Promise<void>;
  switchToRole: (role: 'STORE_ADMIN' | 'STORE_STAFF') => Promise<void>;
  hasPermission: (permission: StaffPermission) => boolean;
}

export const useBrandAuthStore = create<BrandAuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      currentBrand: null,
      currentAccount: null,
      currentRole: null,
      permissions: [],
      isLoading: false,
      loginError: null,

      login: async (username: string, password: string) => {
        set({ isLoading: true, loginError: null });
        const trimmedUser = username.trim().toLowerCase();
        const trimmedPass = password.trim();

        if (!trimmedUser || !trimmedPass) {
          const err = 'Please enter both username and password.';
          set({ isLoading: false, loginError: err });
          return { success: false, error: err };
        }

        // 1. Check Platform Developer / Super Admin credentials
        if (trimmedUser === 'devcore') {
          await seedDevCoreData().catch(() => {});
          const devUser = await db.dev_core_users.where('username').equalsIgnoreCase('devcore').first().catch(() => null);
          if (devUser) {
            const isValid = await verifyPassword(trimmedPass, devUser.passwordHash, devUser.salt);
            if (isValid) {
              set({
                isAuthenticated: true,
                currentRole: 'SUPER_ADMIN',
                permissions: ['all'],
                isLoading: false,
                loginError: null,
              });
              return { success: true, redirectUrl: '/devcore', role: 'SUPER_ADMIN' };
            }
          }
        }

        // 2. Check accounts table for Store Accounts
        const account = await db.accounts
          .where('username')
          .equalsIgnoreCase(trimmedUser)
          .first()
          .catch(() => null);

        if (account) {
          if (account.passwordHash !== trimmedPass) {
            const err = 'Invalid password for account ' + account.username;
            set({ isLoading: false, loginError: err });
            return { success: false, error: err };
          }

          if (!account.isActive) {
            const err = 'This account has been deactivated. Please contact store management.';
            set({ isLoading: false, loginError: err });
            return { success: false, error: err };
          }

          // Fetch matching brand / store
          const store = await db.brands
            .where('brandId')
            .equals(account.storeId)
            .first()
            .catch(() => null);

          const storeSlug = account.storeId;
          usePosStore.getState().setActiveBrand(storeSlug, store?.brandName || 'Oursell Demo Store');
          usePosStore.getState().setCashier({
            id: account.id,
            name: account.name,
            role: account.role === 'STORE_ADMIN' ? 'ADMIN' : 'STAFF',
          });

          set({
            isAuthenticated: true,
            currentAccount: account,
            currentBrand: store || null,
            currentRole: account.role,
            permissions: account.permissions || [],
            isLoading: false,
            loginError: null,
          });

          // Role-based redirection per Master Specification:
          // Store Admin -> /shop/[storeSlug]/admin
          // Store Staff -> /pos/register (original POS system)
          const redirectUrl =
            account.role === 'STORE_ADMIN'
              ? `/shop/${storeSlug}/admin`
              : `/pos/register`;

          return { success: true, redirectUrl, role: account.role };
        }

        // 3. Check brand applications status
        const app = await db.brand_applications
          .where('requestedUsername')
          .equalsIgnoreCase(trimmedUser)
          .first()
          .catch(() => null);

        if (app && app.status === 'PENDING') {
          const err = 'Your brand application is currently under review by Dev Core.';
          set({ isLoading: false, loginError: err });
          return { success: false, error: err };
        }

        if (app && app.status === 'REJECTED') {
          const err = `Your registration was not approved. ${app.rejectionReason ? `Reason: ${app.rejectionReason}` : 'Contact support.'}`;
          set({ isLoading: false, loginError: err });
          return { success: false, error: err };
        }

        // 4. Check active brands table (e.g. centralmart, oursell)
        const brand = await db.brands
          .where('username')
          .equalsIgnoreCase(trimmedUser)
          .first()
          .catch(() => null);

        if (!brand || brand.passwordHash !== trimmedPass) {
          const err = 'Invalid brand username or password.';
          set({ isLoading: false, loginError: err });
          return { success: false, error: err };
        }

        if (brand.status === 'SUSPENDED') {
          const err = 'Your brand account is currently suspended. Contact Dev Core administration.';
          set({ isLoading: false, loginError: err });
          return { success: false, error: err };
        }

        // Brand owner defaults to STORE_ADMIN
        usePosStore.getState().setActiveBrand(brand.brandId, brand.brandName);
        set({
          isAuthenticated: true,
          currentBrand: brand,
          currentAccount: {
            id: `owner-${brand.id}`,
            storeId: brand.brandId,
            username: brand.username,
            name: brand.ownerName,
            passwordHash: brand.passwordHash,
            role: 'STORE_ADMIN',
            permissions: ['all'],
            isActive: true,
            createdAt: brand.createdAt,
          },
          currentRole: 'STORE_ADMIN',
          permissions: ['all'],
          isLoading: false,
          loginError: null,
        });

        const redirectUrl = `/shop/${brand.brandId}/admin`;
        return { success: true, redirectUrl, role: 'STORE_ADMIN' };
      },

      logout: () => {
        set({
          isAuthenticated: false,
          currentBrand: null,
          currentAccount: null,
          currentRole: null,
          permissions: [],
        });
        usePosStore.getState().setCashier({
          id: 'staff-guest',
          name: 'Store Associate',
          role: 'STAFF',
        });
      },

      checkSession: async () => {
        const state = get();
        if (state.isAuthenticated && state.currentBrand && state.currentAccount) {
          usePosStore.getState().setActiveBrand(state.currentBrand.brandId, state.currentBrand.brandName);
          usePosStore.getState().setCashier({
            id: state.currentAccount.id,
            name: state.currentAccount.name,
            role:
              state.currentRole === 'STORE_ADMIN' || state.currentRole === 'SUPER_ADMIN'
                ? 'ADMIN'
                : 'STAFF',
          });
        } else {
          // If unauthenticated or fresh session, reset store auth cleanly (do not auto-inject mock stores)
          usePosStore.getState().setActiveBrand('', '');
          usePosStore.getState().setCashier({
            id: 'staff-guest',
            name: 'Store Associate',
            role: 'STAFF',
          });
          set({
            isAuthenticated: false,
            currentBrand: null,
            currentAccount: null,
            currentRole: null,
            permissions: [],
          });
        }
      },

      switchToRole: async (targetRole: 'STORE_ADMIN' | 'STORE_STAFF') => {
        const state = get();
        const brandId = state.currentBrand?.brandId || 'oursell';

        if (targetRole === 'STORE_ADMIN') {
          let adminAcc = await db.accounts
            .where('storeId')
            .equals(brandId)
            .and((a) => a.role === 'STORE_ADMIN')
            .first()
            .catch(() => null);

          if (!adminAcc) {
            adminAcc = await db.accounts.where('username').equals('oursell@admin').first().catch(() => null);
          }

          if (adminAcc) {
            set({
              isAuthenticated: true,
              currentAccount: adminAcc,
              currentRole: 'STORE_ADMIN',
              permissions: ['all'],
            });
            usePosStore.getState().setCashier({
              id: adminAcc.id,
              name: adminAcc.name,
              role: 'ADMIN',
            });
          } else {
            set({
              isAuthenticated: true,
              currentRole: 'STORE_ADMIN',
              permissions: ['all'],
            });
            usePosStore.getState().setCashier({
              id: 'admin-fallback',
              name: 'Store Administrator',
              role: 'ADMIN',
            });
          }
        } else {
          let staffAcc = await db.accounts
            .where('storeId')
            .equals(brandId)
            .and((a) => a.role === 'STORE_STAFF')
            .first()
            .catch(() => null);

          if (!staffAcc) {
            staffAcc = await db.accounts.where('username').equals('oursell@staff').first().catch(() => null);
          }

          const staffPerms: StaffPermission[] = ['pos_billing', 'customer_manage', 'invoice_print'];
          if (staffAcc) {
            set({
              isAuthenticated: true,
              currentAccount: staffAcc,
              currentRole: 'STORE_STAFF',
              permissions: staffAcc.permissions || staffPerms,
            });
            usePosStore.getState().setCashier({
              id: staffAcc.id,
              name: staffAcc.name,
              role: 'STAFF',
            });
          } else {
            set({
              isAuthenticated: true,
              currentRole: 'STORE_STAFF',
              permissions: staffPerms,
            });
            usePosStore.getState().setCashier({
              id: 'staff-fallback',
              name: 'Store Cashier (Staff)',
              role: 'STAFF',
            });
          }
        }
      },

      hasPermission: (permission: StaffPermission) => {
        const { currentRole, permissions } = get();
        if (currentRole === 'SUPER_ADMIN' || currentRole === 'STORE_ADMIN') return true;
        if (permissions.includes('all')) return true;
        return permissions.includes(permission);
      },
    }),
    {
      name: 'oursell_brand_auth',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        currentBrand: state.currentBrand,
        currentAccount: state.currentAccount,
        currentRole: state.currentRole,
        permissions: state.permissions,
      }),
    }
  )
);
