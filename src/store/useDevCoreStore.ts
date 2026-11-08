import { create } from 'zustand';
import { db, seedInitialData, cleanStoreSubscriptionsTable } from '@/db/posDb';
import { isRealStore } from '@/lib/planAccess';
import {
  DevCoreUser,
  DevCoreRole,
  SupportMessage,
  StoreSubscription,
  StoreStorageQuota,
  PlatformSystemSetting,
  DevCoreAuditLog,
  DevCoreTab,
} from '@/types/devcore';
import { BrandApplication, Brand, BusinessCategory, PlanTier } from '@/types/pos';
import { hashPassword, verifyPassword } from '@/utils/cryptoUtils';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

export interface CreateStoreInput {
  brandName: string;
  legalName?: string;
  businessCategory: BusinessCategory;
  ownerName: string;
  email: string;
  phone?: string;
  username: string;
  password?: string;
  pin?: string;
  planTier?: PlanTier;
  outletCount?: number;
  terminalCount?: number;
  gstin?: string;
  businessAddress?: string;
  currency?: string;
  taxRateDefault?: number;
}

interface TelemetryStats {
  totalGmv: number;
  totalOrders: number;
  totalStores: number;
  totalProducts: number;
  totalStorageMb: number;
  activeSubscriptionsCount: number;
  unreadTicketsCount: number;
  pendingApplicationsCount: number;
  totalInboxCount: number;
}

interface DevCoreState {
  currentUser: DevCoreUser | null;
  isAuthenticated: boolean;
  mustChangePassword: boolean;
  isFirstLoginModalOpen: boolean;
  isCreateStoreModalOpen: boolean;
  theme: 'light' | 'dark';
  activeTab: DevCoreTab;
  isLoading: boolean;
  actionNotice: { message: string; type: 'success' | 'error' | 'info' } | null;

  // Data
  inboxMessages: SupportMessage[];
  activeAccounts: Brand[];
  applications: BrandApplication[];
  roles: DevCoreRole[];
  users: DevCoreUser[];
  subscriptions: StoreSubscription[];
  storageQuotas: StoreStorageQuota[];
  auditLogs: DevCoreAuditLog[];
  systemSettings: PlatformSystemSetting[];
  pricingPlans: import('@/types/pos').PricingPlan[];
  planEnquiries: import('@/types/pos').PlanEnquiry[];
  telemetry: TelemetryStats;

  // Setters & Actions
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  setActiveTab: (tab: DevCoreTab) => void;
  setActionNotice: (notice: { message: string; type: 'success' | 'error' | 'info' } | null) => void;
  openFirstLoginModal: () => void;
  closeFirstLoginModal: () => void;
  openCreateStoreModal: () => void;
  closeCreateStoreModal: () => void;

  // Auth
  login: (user: string, pass: string) => Promise<{ success: boolean; error?: string; mustChangePassword?: boolean }>;
  changePassword: (oldPass: string, newPass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  checkSession: () => Promise<boolean>;

  // Loaders
  loadAllData: () => Promise<void>;

  // Inbox Actions
  replySupportMessage: (messageId: string, replyText: string) => Promise<boolean>;
  updateMessageStatus: (messageId: string, status: SupportMessage['status']) => Promise<boolean>;
  updateMessagePriority: (messageId: string, priority: SupportMessage['priority']) => Promise<boolean>;
  deleteMessage: (messageId: string) => Promise<boolean>;

  // Store Management
  toggleStoreStatus: (brandId: string, reason?: string) => Promise<boolean>;
  acceptApplication: (appId: string) => Promise<{ success: boolean; brandId?: string }>;
  rejectApplication: (appId: string, reason?: string) => Promise<boolean>;
  activateShop: (appId: string) => Promise<{ success: boolean; brandId?: string }>;
  rejectShop: (appId: string, reason?: string) => Promise<boolean>;
  reopenApplication: (appId: string) => Promise<boolean>;
  simulateNewShopApplication: () => Promise<string>;
  createActiveStore: (input: CreateStoreInput) => Promise<{
    success: boolean;
    brandId?: string;
    appId?: string;
    username?: string;
    error?: string;
  }>;
  deleteStore: (brandId: string) => Promise<{ success: boolean; error?: string }>;
  purgeDatabase: () => Promise<void>;

  // Permissions / RBAC
  createRole: (name: string, description: string, permissions: string[]) => Promise<boolean>;
  updateRolePermissions: (roleId: string, permissions: string[]) => Promise<boolean>;
  deleteRole: (roleId: string) => Promise<{ success: boolean; error?: string }>;

  // User Management
  createUser: (userData: {
    name: string;
    username: string;
    email: string;
    role: DevCoreUser['role'];
    password: string;
    requirePasswordChange?: boolean;
    storeId?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  updateUser: (userId: string, data: Partial<DevCoreUser>) => Promise<{ success: boolean; error?: string }>;
  deleteUser: (userId: string) => Promise<{ success: boolean; error?: string }>;
  toggleUserActive: (userId: string) => Promise<{ success: boolean; error?: string }>;

  // Subscriptions & Plans Management
  updateSubscriptionPlan: (subId: string, newPlan: StoreSubscription['plan']) => Promise<boolean>;
  updateSubscriptionStatus: (subId: string, status: StoreSubscription['status']) => Promise<boolean>;
  updatePlanConfiguration: (planId: string, updates: Partial<import('@/types/pos').PricingPlan>) => Promise<boolean>;
  updateEnquiryStatus: (enquiryId: string, status: import('@/types/pos').PlanEnquiry['status']) => Promise<boolean>;
  deletePlanEnquiry: (enquiryId: string) => Promise<boolean>;

  // Storage
  adjustStorageLimit: (storeId: string, newLimitMb: number) => Promise<boolean>;
  backupStoreSnapshot: (storeId: string) => Promise<string>;

  // System Settings
  updateSystemSetting: (key: string, value: string) => Promise<boolean>;

  // Audit Logging
  recordAuditLog: (action: string, targetEntity: string, targetId: string, details: string, severity?: 'INFO' | 'WARNING' | 'CRITICAL') => Promise<void>;
}

export const useDevCoreStore = create<DevCoreState>((set, get) => ({
  currentUser: null,
  isAuthenticated: false,
  mustChangePassword: false,
  isFirstLoginModalOpen: false,
  isCreateStoreModalOpen: false,
  theme: 'light',
  activeTab: 'overview',
  isLoading: false,
  actionNotice: null,

  setTheme: (theme) => set({ theme }),
  toggleTheme: () => set((s) => ({ theme: s.theme === 'light' ? 'dark' : 'light' })),

  inboxMessages: [],
  activeAccounts: [],
  applications: [],
  roles: [],
  users: [],
  subscriptions: [],
  storageQuotas: [],
  auditLogs: [],
  systemSettings: [],
  pricingPlans: [],
  planEnquiries: [],
  telemetry: {
    totalGmv: 0,
    totalOrders: 0,
    totalStores: 0,
    totalProducts: 0,
    totalStorageMb: 0,
    activeSubscriptionsCount: 0,
    unreadTicketsCount: 0,
    pendingApplicationsCount: 0,
    totalInboxCount: 0,
  },

  setActiveTab: (tab) => set({ activeTab: tab }),
  openFirstLoginModal: () => set({ isFirstLoginModalOpen: true }),
  closeFirstLoginModal: () => set({ isFirstLoginModalOpen: false }),
  openCreateStoreModal: () => set({ isCreateStoreModalOpen: true }),
  closeCreateStoreModal: () => set({ isCreateStoreModalOpen: false }),
  setActionNotice: (notice) => {
    set({ actionNotice: notice });
    if (notice) {
      setTimeout(() => {
        if (get().actionNotice?.message === notice.message) {
          set({ actionNotice: null });
        }
      }, 5000);
    }
  },

  // 1. AUTHENTICATION
  login: async (username: string, pass: string) => {
    const trimmedUser = (username || '').trim().toLowerCase();
    const trimmedPass = (pass || '').trim();

    if (!trimmedUser || !trimmedPass) {
      return { success: false, error: 'Username and password are required.' };
    }

    set({ isLoading: true });

    // Step A: Attempt server-side API authentication
    try {
      const res = await fetch('/api/devcore/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: trimmedUser, password: trimmedPass }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          set({
            currentUser: { ...data.user, mustChangePassword: false },
            isAuthenticated: true,
            mustChangePassword: false,
            isFirstLoginModalOpen: false,
            isLoading: false,
          });
          await get().loadAllData();
          return { success: true, mustChangePassword: false };
        }
      }
    } catch {
      console.warn('API login error, trying local secure verification fallback...');
    }

    // Step B: Direct local DB authentication with cryptographic SHA-256 verification
    try {
      await seedInitialData().catch(() => {});

      let user = await db.dev_core_users
        .where('username')
        .equalsIgnoreCase(trimmedUser)
        .first()
        .catch(() => null);

      // Handle bootstrap if first run in browser
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
        set({ isLoading: false });
        return { success: false, error: 'Access Denied: Invalid administrator credentials.' };
      }

      if (!user.isActive) {
        set({ isLoading: false });
        return { success: false, error: 'Account disabled. Contact system root administrator.' };
      }

      // Verify Password Hash
      const isValid = await verifyPassword(trimmedPass, user.passwordHash, user.salt);
      if (!isValid) {
        set({ isLoading: false });
        return { success: false, error: 'Access Denied: Invalid credentials.' };
      }

      set({
        currentUser: { ...user, mustChangePassword: false },
        isAuthenticated: true,
        mustChangePassword: false,
        isFirstLoginModalOpen: false,
        isLoading: false,
      });

      // Record audit log
      await get().recordAuditLog(
        'LOGIN_SUCCESS',
        'ADMIN_USER',
        user.id,
        `Dev Core administrator ${user.name} logged into Admin Control Centre.`
      );

      await get().loadAllData();
      return { success: true, mustChangePassword: false };
    } catch (err: unknown) {
      set({ isLoading: false });
      const errorMsg = err instanceof Error ? err.message : 'Authentication failed';
      return { success: false, error: errorMsg };
    }
  },

  changePassword: async (oldPass: string, newPass: string) => {
    const user = get().currentUser;
    if (!user) return { success: false, error: 'Not authenticated' };

    if (!newPass || newPass.trim().length < 6) {
      return { success: false, error: 'New password must be at least 6 characters.' };
    }

    try {
      // API call first
      try {
        const res = await fetch('/api/devcore/auth/change-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: user.username,
            currentPassword: oldPass,
            newPassword: newPass,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            set((state) => ({
              mustChangePassword: false,
              isFirstLoginModalOpen: false,
              currentUser: state.currentUser ? { ...state.currentUser, mustChangePassword: false } : null,
            }));
            await get().recordAuditLog('PASSWORD_CHANGED', 'USER', user.id, 'Password changed successfully.');
            return { success: true };
          }
        }
      } catch {
        // Fallback to local
      }

      // Local DB update
      const dbUser = await db.dev_core_users.get(user.id);
      if (!dbUser) return { success: false, error: 'User not found in database.' };

      const isOldValid = await verifyPassword(oldPass, dbUser.passwordHash, dbUser.salt);
      if (!isOldValid) {
        return { success: false, error: 'Current password verification failed.' };
      }

      const { hash: newHash, salt: newSalt } = await hashPassword(newPass);
      await db.dev_core_users.update(user.id, {
        passwordHash: newHash,
        salt: newSalt,
        mustChangePassword: false,
      });

      // Update accounts mirror
      const acc = await db.accounts.where('username').equals(user.username).first().catch(() => null);
      if (acc) {
        await db.accounts.update(acc.id, { passwordHash: newHash, pin: newPass }).catch(() => {});
      }

      set((state) => ({
        mustChangePassword: false,
        isFirstLoginModalOpen: false,
        currentUser: state.currentUser ? { ...state.currentUser, mustChangePassword: false } : null,
      }));

      await get().recordAuditLog(
        'PASSWORD_CHANGED',
        'USER',
        user.id,
        'Initial administrator password changed successfully with cryptographic SHA-256 hash.'
      );

      return { success: true };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Password change failed';
      return { success: false, error: errorMsg };
    }
  },

  logout: async () => {
    try {
      await fetch('/api/devcore/auth/logout', { method: 'POST' }).catch(() => {});
    } catch {}
    set({
      currentUser: null,
      isAuthenticated: false,
      mustChangePassword: false,
      isFirstLoginModalOpen: false,
    });
  },

  checkSession: async () => {
    try {
      const res = await fetch('/api/devcore/auth/session');
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          set({
            currentUser: { ...data.user, mustChangePassword: false },
            isAuthenticated: true,
            mustChangePassword: false,
            isFirstLoginModalOpen: false,
          });
          await get().loadAllData();
          return true;
        }
      }
    } catch {}
    return false;
  },

  // 2. DATA LOADER FOR ALL 8 SECTIONS
  loadAllData: async () => {
    set({ isLoading: true });
    try {
      await seedInitialData().catch(() => {});
      await cleanStoreSubscriptionsTable().catch(() => {});

      const [
        inbox,
        brands,
        apps,
        roles,
        users,
        subs,
        storage,
        logs,
        settings,
        orders,
        prods,
        plans,
        enqs,
      ] = await Promise.all([
        db.support_inbox.reverse().sortBy('createdAt').catch(() => []),
        db.brands.toArray().catch(() => []),
        db.brand_applications.toArray().catch(() => []),
        db.roles_matrix.toArray().catch(() => []),
        db.dev_core_users.toArray().catch(() => []),
        db.store_subscriptions.toArray().catch(() => []),
        db.store_storage.toArray().catch(() => []),
        db.dev_core_audit_logs.reverse().sortBy('timestamp').catch(() => []),
        db.system_settings.toArray().catch(() => []),
        db.orders.toArray().catch(() => []),
        db.products.count().catch(() => 0),
        db.pricing_plans.orderBy('sortOrder').toArray().catch(() => []),
        db.plan_enquiries.reverse().sortBy('createdAt').catch(() => []),
      ]);

      // Sync latest plans from API/Supabase if available
      let latestPlans = plans;
      try {
        const pRes = await fetch('/api/plans?all=true').then((r) => r.json()).catch(() => null);
        if (pRes?.success && Array.isArray(pRes.plans) && pRes.plans.length > 0) {
          if (!pRes.isFallback || plans.length === 0) {
            latestPlans = pRes.plans;
            await db.pricing_plans.bulkPut(pRes.plans).catch(() => {});
          }
        }
      } catch {}

      // Sync latest enquiries from API/Supabase if available
      let latestEnquiries = enqs;
      try {
        const eRes = await fetch('/api/plans/enquiry').then((r) => r.json()).catch(() => null);
        if (eRes?.success && Array.isArray(eRes.enquiries)) {
          latestEnquiries = eRes.enquiries;
          await db.plan_enquiries.bulkPut(eRes.enquiries).catch(() => {});
        }
      } catch {}

      // Sync authoritative store subscriptions from API if available
      let verifiedSubs = subs;
      try {
        const sRes = await fetch('/api/devcore/subscriptions').then((r) => r.json()).catch(() => null);
        if (sRes?.success && Array.isArray(sRes.subscriptions) && sRes.subscriptions.length > 0) {
          for (const s of sRes.subscriptions) {
            if (isRealStore(s)) {
              const canonicalId = `sub-${(s.storeId || '').toLowerCase()}`;
              await db.store_subscriptions.put({
                id: canonicalId,
                storeId: s.storeId,
                storeName: s.storeName,
                plan: s.plan,
                planId: s.planId,
                status: s.status,
                billingCycle: s.billingCycle,
                amount: s.monthlyPrice,
                annualPrice: s.annualPrice,
                currency: '₹',
                startDate: new Date().toISOString(),
                nextBillingDate: s.currentPeriodEnd || new Date(Date.now() + 30 * 86400000).toISOString(),
                paymentMethod: 'Prepaid Cloud',
                autoRenew: true,
                staffLimit: s.staffLimit,
                outletLimit: s.outletLimit,
                terminalLimit: s.terminalLimit,
                productLimit: s.productLimit,
              }).catch(() => {});
            }
          }
          verifiedSubs = await db.store_subscriptions.toArray().catch(() => subs);
        }
      } catch {}

      const clientStores = brands.filter((b) => b.brandId !== 'devcore');

      // Build deduplicated map of real store subscriptions
      const realSubsMap = new Map<string, StoreSubscription>();
      for (const s of verifiedSubs) {
        if (!isRealStore(s)) continue;
        const key = (s.storeId || '').trim().toLowerCase();
        if (!key) continue;
        const existing = realSubsMap.get(key);
        if (!existing) {
          realSubsMap.set(key, s);
        } else if (existing.status !== 'ACTIVE' && s.status === 'ACTIVE') {
          realSubsMap.set(key, s);
        } else if (
          existing.status === s.status &&
          (s.plan === 'Enterprise' || (s.amount || 0) > (existing.amount || 0))
        ) {
          realSubsMap.set(key, s);
        }
      }

      // Ensure every real store in clientStores is reflected in subscriptions
      for (const store of clientStores) {
        if (!isRealStore(store)) continue;
        const key = store.brandId.trim().toLowerCase();
        if (!realSubsMap.has(key)) {
          const planTier = store.planTier || 'Enterprise';
          const defaultSub: StoreSubscription = {
            id: `sub-${key}`,
            storeId: store.brandId,
            storeName: store.brandName,
            plan: planTier as any,
            planId: planTier.toLowerCase(),
            billingCycle: 'MONTHLY',
            amount: planTier === 'Enterprise' ? 3299 : planTier === 'Professional' ? 799 : 0,
            annualPrice: planTier === 'Enterprise' ? 32990 : planTier === 'Professional' ? 7990 : 0,
            currency: '₹',
            status: 'ACTIVE',
            startDate: store.createdAt || new Date().toISOString(),
            nextBillingDate: new Date(Date.now() + 30 * 86400000).toISOString(),
            paymentMethod: 'Prepaid Cloud',
            autoRenew: true,
            staffLimit: planTier === 'Enterprise' ? 5 : planTier === 'Professional' ? 3 : 1,
            outletLimit: store.outletCount || 1,
            terminalLimit: store.terminalCount || 2,
            productLimit: planTier === 'Enterprise' ? null : 1000,
          };
          realSubsMap.set(key, defaultSub);
          await db.store_subscriptions.put(defaultSub).catch(() => {});
        }
      }

      const cleanSubs = Array.from(realSubsMap.values());
      const gmv = orders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);
      const totalStorageUsed = storage.reduce((sum, s) => sum + (s.storageUsedMb || 0), 0);
      const activeSubsCount = cleanSubs.filter((s) => s.status === 'ACTIVE').length;
      const unreadTickets = inbox.filter((m) => m.status === 'UNREAD').length;
      const pendingApps = apps.filter((a) => a.status === 'PENDING').length;

      set({
        inboxMessages: inbox,
        activeAccounts: clientStores,
        applications: apps,
        roles,
        users,
        subscriptions: cleanSubs,
        storageQuotas: storage,
        auditLogs: logs,
        systemSettings: settings,
        pricingPlans: latestPlans,
        planEnquiries: latestEnquiries,
        telemetry: {
          totalGmv: gmv,
          totalOrders: orders.length,
          totalStores: clientStores.filter(isRealStore).length,
          totalProducts: prods,
          totalStorageMb: totalStorageUsed,
          activeSubscriptionsCount: activeSubsCount,
          unreadTicketsCount: unreadTickets,
          pendingApplicationsCount: pendingApps,
          totalInboxCount: pendingApps + unreadTickets,
        },
        isLoading: false,
      });
    } catch (e) {
      console.warn('Error loading DevCore dashboard datasets:', e);
      set({ isLoading: false });
    }
  },

  // 3. INBOX ACTIONS
  replySupportMessage: async (messageId: string, replyText: string) => {
    if (!replyText.trim()) return false;
    const msg = await db.support_inbox.get(messageId);
    if (!msg) return false;

    const user = get().currentUser;
    const newReply = {
      id: `rep-${Date.now()}`,
      sender: user?.name || 'Dev Core Administration',
      senderRole: user?.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin Support',
      message: replyText.trim(),
      createdAt: new Date().toISOString(),
    };

    const updatedReplies = [...(msg.replies || []), newReply];
    await db.support_inbox.update(messageId, {
      replies: updatedReplies,
      status: 'REPLIED',
      updatedAt: new Date().toISOString(),
    });

    await get().recordAuditLog(
      'INBOX_REPLY_SENT',
      'SUPPORT_TICKET',
      messageId,
      `Replied to ticket "${msg.subject}" from store ${msg.storeName}.`
    );

    await get().loadAllData();
    return true;
  },

  updateMessageStatus: async (messageId: string, status: SupportMessage['status']) => {
    await db.support_inbox.update(messageId, { status, updatedAt: new Date().toISOString() });
    await get().loadAllData();
    return true;
  },

  updateMessagePriority: async (messageId: string, priority: SupportMessage['priority']) => {
    await db.support_inbox.update(messageId, { priority, updatedAt: new Date().toISOString() });
    await get().loadAllData();
    return true;
  },

  deleteMessage: async (messageId: string) => {
    await db.support_inbox.delete(messageId);
    await get().loadAllData();
    return true;
  },

  // 4. ACTIVE ACCOUNTS ACTIONS
  toggleStoreStatus: async (brandId: string, reason?: string) => {
    if (brandId === 'devcore') {
      get().setActionNotice({
        message: 'System core account cannot be suspended.',
        type: 'error',
      });
      return false;
    }

    const brand = await db.brands.where('brandId').equals(brandId).first();
    if (!brand) return false;

    const newStatus = brand.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    await db.brands.update(brand.id, { status: newStatus });

    await get().recordAuditLog(
      newStatus === 'SUSPENDED' ? 'ACCOUNT_SUSPENDED' : 'ACCOUNT_REACTIVATED',
      'STORE_ACCOUNT',
      brand.brandId,
      `Store "${brand.brandName}" status changed to ${newStatus}.${reason ? ` Reason: ${reason}` : ''}`,
      newStatus === 'SUSPENDED' ? 'WARNING' : 'INFO'
    );

    get().setActionNotice({
      message: `Store ${brand.brandName} is now ${newStatus}.`,
      type: 'success',
    });

    await get().loadAllData();
    return true;
  },

  acceptApplication: async (appId: string) => {
    const app = await db.brand_applications.get(appId);
    if (!app) return { success: false };

    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const newBrandId = app.brandId || `BRD-${randomDigits}`;

    const newBrand: Brand = {
      id: `brand-${Date.now()}`,
      brandId: newBrandId,
      brandName: app.brandName,
      businessCategory: app.businessCategory,
      ownerName: app.ownerName,
      email: app.email,
      phone: app.phone,
      username: app.requestedUsername,
      passwordHash: app.passwordHash,
      status: 'ACTIVE',
      planTier: 'Starter',
      createdAt: new Date().toISOString(),
      outletCount: app.outletCount || 1,
      terminalCount: app.terminalCount || 1,
      currency: '₹',
      taxRateDefault: 5,
    };

    await db.brands.put(newBrand);

    // Create the Store Admin Account so merchant can immediately log in
    await db.accounts.put({
      id: `acc-${newBrandId}-${Date.now()}`,
      storeId: newBrandId,
      username: app.requestedUsername,
      email: app.email,
      name: app.ownerName,
      role: 'STORE_ADMIN',
      permissions: ['all'],
      passwordHash: app.passwordHash,
      pin: '1234',
      isActive: true,
      createdAt: new Date().toISOString(),
    });

    await db.brand_applications.update(appId, {
      status: 'APPROVED',
      brandId: newBrandId,
      reviewedAt: new Date().toISOString(),
      reviewedBy: get().currentUser?.name || 'Dev Core Admin',
    });

    // Mirror newly approved business to Supabase Cloud if online
    try {
      const supabase = getSupabaseBrowserClient();
      if (supabase) {
        const { data: bData } = await supabase
          .from('businesses')
          .insert({
            slug: newBrandId.toLowerCase(),
            name: app.brandName,
            business_category: app.businessCategory,
            owner_name: app.ownerName,
            contact_email: app.email,
            contact_phone: app.phone || null,
            currency: '₹',
            tax_rate_default: 5.0,
            outlet_count: app.outletCount || 1,
            terminal_count: app.terminalCount || 1,
            is_active: true,
            registration_status: 'ACTIVE',
          })
          .select('id')
          .maybeSingle();

        if (bData) {
          await supabase.from('subscriptions').insert({
            business_id: bData.id,
            plan_tier: 'Starter',
            plan_id: 'starter',
            status: 'ACTIVE',
            billing_cycle: 'MONTHLY',
            monthly_price: 0,
            staff_limit: 3,
            outlet_limit: app.outletCount || 1,
            terminal_limit: app.terminalCount || 2,
            product_limit: 1000,
          });
        }

        await supabase
          .from('brand_applications')
          .update({
            status: 'APPROVED',
            reviewed_at: new Date().toISOString(),
            reviewed_by: get().currentUser?.name || 'Dev Core Admin',
          })
          .eq('requested_username', app.requestedUsername.toLowerCase());
      }
    } catch (cloudErr) {
      console.warn('Could not mirror approved brand to Supabase:', cloudErr);
    }

    // Seed canonical subscription & storage quota for the approved real store
    const canonicalSubId = `sub-${newBrandId.toLowerCase()}`;
    await db.store_subscriptions.put({
      id: canonicalSubId,
      storeId: newBrandId,
      storeName: app.brandName,
      plan: 'Starter',
      billingCycle: 'MONTHLY',
      amount: 0,
      currency: '₹',
      status: 'ACTIVE',
      startDate: new Date().toISOString(),
      nextBillingDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
      paymentMethod: 'Prepaid Cloud',
      autoRenew: true,
      staffLimit: 3,
      outletLimit: app.outletCount || 1,
      terminalLimit: app.terminalCount || 2,
      productLimit: 1000,
    });

    const existingStorage = await db.store_storage.where('storeId').equals(newBrandId).first().catch(() => null);
    if (!existingStorage) {
      await db.store_storage.add({
        id: `stor-${Date.now()}`,
        storeId: newBrandId,
        storeName: app.brandName,
        storageUsedMb: 1.0,
        storageLimitMb: 250,
        productCount: 0,
        ordersCount: 0,
        barcodesCount: 0,
        customersCount: 0,
        lastBackupAt: new Date().toISOString(),
        backupStatus: 'HEALTHY',
      });
    }

    // Update related inbox ticket if present
    const relatedTicket = await db.support_inbox.where('storeId').equals(appId).first().catch(() => null);
    if (relatedTicket) {
      const reply = {
        id: `rep-${Date.now()}`,
        sender: get().currentUser?.name || 'Dev Core Administration',
        senderRole: 'Super Admin',
        message: `🎉 Shop registration has been APPROVED & ACTIVATED! Assigned Store ID: ${newBrandId}. Store admin login username: "${app.requestedUsername}". Store workspace is now live at /shop/${newBrandId}.`,
        createdAt: new Date().toISOString(),
      };
      await db.support_inbox.update(relatedTicket.id, {
        status: 'REPLIED',
        replies: [...(relatedTicket.replies || []), reply],
        updatedAt: new Date().toISOString(),
      });
    }

    await get().recordAuditLog(
      'STORE_APPLICATION_APPROVED',
      'STORE_ONBOARDING',
      newBrandId,
      `Approved and activated store "${app.brandName}". Assigned store handle: ${newBrandId}. Admin username: ${app.requestedUsername}.`
    );

    get().setActionNotice({
      message: `Shop "${app.brandName}" is now ACTIVE! Assigned Store ID: ${newBrandId}.`,
      type: 'success',
    });

    await get().loadAllData();
    return { success: true, brandId: newBrandId };
  },

  rejectApplication: async (appId: string, reason?: string) => {
    const app = await db.brand_applications.get(appId);
    const rejectionReason = reason || 'Application verification failed.';

    await db.brand_applications.update(appId, {
      status: 'REJECTED',
      rejectionReason,
      reviewedAt: new Date().toISOString(),
      reviewedBy: get().currentUser?.name || 'Dev Core Admin',
    });

    // Update related inbox ticket if present
    const relatedTicket = await db.support_inbox.where('storeId').equals(appId).first().catch(() => null);
    if (relatedTicket) {
      const reply = {
        id: `rep-${Date.now()}`,
        sender: get().currentUser?.name || 'Dev Core Administration',
        senderRole: 'Super Admin',
        message: `❌ Shop registration was REJECTED. Reason: ${rejectionReason}.`,
        createdAt: new Date().toISOString(),
      };
      await db.support_inbox.update(relatedTicket.id, {
        status: 'CLOSED',
        replies: [...(relatedTicket.replies || []), reply],
        updatedAt: new Date().toISOString(),
      });
    }

    await get().recordAuditLog(
      'STORE_APPLICATION_REJECTED',
      'STORE_ONBOARDING',
      appId,
      `Rejected store application for "${app?.brandName || appId}". Reason: ${rejectionReason}.`,
      'WARNING'
    );

    get().setActionNotice({
      message: `Shop registration for "${app?.brandName || appId}" rejected.`,
      type: 'error',
    });

    await get().loadAllData();
    return true;
  },

  activateShop: async (appId: string) => {
    return get().acceptApplication(appId);
  },

  rejectShop: async (appId: string, reason?: string) => {
    return get().rejectApplication(appId, reason);
  },

  reopenApplication: async (appId: string) => {
    const app = await db.brand_applications.get(appId);
    if (!app) return false;
    await db.brand_applications.update(appId, {
      status: 'PENDING',
      rejectionReason: undefined,
    });
    await get().recordAuditLog(
      'STORE_APPLICATION_REOPENED',
      'STORE_ONBOARDING',
      appId,
      `Reopened store application for "${app.brandName}" back to Pending Review.`
    );
    get().setActionNotice({
      message: `Shop "${app.brandName}" moved back to Pending Review in Dev Core Inbox.`,
      type: 'info',
    });
    await get().loadAllData();
    return true;
  },

  simulateNewShopApplication: async () => {
    const randomNum = Math.floor(100 + Math.random() * 900);
    const mockShops = [
      { name: 'Apex Electronics & Gadgets', category: 'Electronics' as const, owner: 'Kiran Verma' },
      { name: 'Bloom Organic Supermarket', category: 'Grocery' as const, owner: 'Sara Abraham' },
      { name: 'Urban Chic Boutique', category: 'Fashion' as const, owner: 'Pooja Nair' },
      { name: 'HealthFirst Care Pharmacy', category: 'Pharmacy' as const, owner: 'Dr. Joseph Kurian' },
      { name: 'Artisan Sourdough Bakery', category: 'Bakery' as const, owner: 'Faizal Khan' },
      { name: 'Green Valley Hypermarket', category: 'Supermarket' as const, owner: 'Mansoor Ali' },
    ];
    const picked = mockShops[Math.floor(Math.random() * mockShops.length)];
    const username = picked.name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10) + randomNum;
    const appId = `APP-${Math.floor(100000 + Math.random() * 900000)}`;

    const newApp: BrandApplication = {
      id: appId,
      brandName: picked.name,
      legalName: `${picked.name} Private Limited`,
      businessCategory: picked.category,
      ownerName: picked.owner,
      email: `${username}@retailnet.in`,
      phone: `+91 98${Math.floor(10000000 + Math.random() * 90000000)}`,
      requestedUsername: username,
      passwordHash: 'shop@123',
      terminalCount: 2,
      outletCount: 1,
      gstin: `32ABCDE${randomNum}F1Z5`,
      businessAddress: `Tech Park Avenue, Sector ${randomNum % 10 + 1}, Kochi, Kerala`,
      status: 'PENDING',
      appliedAt: new Date().toISOString(),
    };

    await db.brand_applications.add(newApp);

    await db.support_inbox.add({
      id: `ticket-${appId}`,
      storeId: appId,
      storeName: picked.name,
      senderName: picked.owner,
      senderEmail: `${username}@retailnet.in`,
      subject: `[New Shop Registration] Activation Request: ${picked.name}`,
      message: `New retail store onboarding request submitted via "Get Started" portal.\n\n` +
        `• Brand: ${picked.name} (${picked.category})\n` +
        `• Owner: ${picked.owner}\n` +
        `• Requested Username: ${username}\n` +
        `• Outlets: 1 | Terminals: 2\n\n` +
        `Please review application in Dev Core Inbox to Activate or Reject this shop.`,
      status: 'UNREAD',
      priority: 'HIGH',
      replies: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    get().setActionNotice({
      message: `New shop "${picked.name}" registered and routed to Dev Core Inbox!`,
      type: 'success',
    });

    await get().loadAllData();
    return appId;
  },

  createActiveStore: async (input: CreateStoreInput) => {
    const brandName = input.brandName.trim();
    if (!brandName) {
      return { success: false, error: 'Store brand name is required.' };
    }

    const username = input.username.trim().toLowerCase();
    if (!username) {
      return { success: false, error: 'Admin username is required.' };
    }

    // Check duplicate username across brands and applications
    const existingBrand = await db.brands.where('username').equalsIgnoreCase(username).first().catch(() => null);
    const existingApp = await db.brand_applications.where('requestedUsername').equalsIgnoreCase(username).first().catch(() => null);
    if (existingBrand || existingApp) {
      return { success: false, error: `The username "${username}" is already in use by another store.` };
    }

    // Generate unique Brand ID
    let randomDigits = Math.floor(1000 + Math.random() * 9000);
    let newBrandId = `BRD-${randomDigits}`;
    let isDupe = await db.brands.where('brandId').equals(newBrandId).first().catch(() => null);
    while (isDupe) {
      randomDigits = Math.floor(1000 + Math.random() * 9000);
      newBrandId = `BRD-${randomDigits}`;
      isDupe = await db.brands.where('brandId').equals(newBrandId).first().catch(() => null);
    }

    const appId = `APP-${Math.floor(100000 + Math.random() * 900000)}`;
    const pass = input.password?.trim() || 'shop@123';
    const pin = input.pin?.trim() || '1234';
    const plan = input.planTier || 'Starter';
    const outletCount = Math.max(1, Number(input.outletCount) || 1);
    const terminalCount = Math.max(1, Number(input.terminalCount) || 1);
    const currency = input.currency || '₹';
    const taxRate = input.taxRateDefault ?? 5;
    const nowIso = new Date().toISOString();

    // 1. Save Brand (Auto-Active!)
    const newBrand: Brand = {
      id: `brand-${Date.now()}`,
      brandId: newBrandId,
      brandName,
      businessCategory: input.businessCategory,
      ownerName: input.ownerName.trim(),
      email: input.email.trim().toLowerCase(),
      phone: input.phone?.trim() || '',
      username,
      passwordHash: pass,
      status: 'ACTIVE',
      planTier: plan,
      createdAt: nowIso,
      outletCount,
      terminalCount,
      currency,
      taxRateDefault: taxRate,
    };
    await db.brands.put(newBrand);

    // 2. Save Application (Marked directly as APPROVED because maker is Dev Core)
    const newApp: BrandApplication = {
      id: appId,
      brandName,
      legalName: input.legalName?.trim() || brandName,
      businessCategory: input.businessCategory,
      ownerName: input.ownerName.trim(),
      email: input.email.trim().toLowerCase(),
      phone: input.phone?.trim() || '',
      requestedUsername: username,
      passwordHash: pass,
      terminalCount,
      outletCount,
      gstin: input.gstin?.trim() || undefined,
      businessAddress: input.businessAddress?.trim() || undefined,
      status: 'APPROVED',
      brandId: newBrandId,
      appliedAt: nowIso,
      reviewedAt: nowIso,
      reviewedBy: get().currentUser?.name || 'Dev Core Super Admin',
    };
    await db.brand_applications.add(newApp);

    // 3. Create Store Admin Account in db.accounts
    await db.accounts.put({
      id: `acc-${newBrandId}-${Date.now()}`,
      storeId: newBrandId,
      username,
      email: input.email.trim().toLowerCase(),
      name: input.ownerName.trim(),
      role: 'STORE_ADMIN',
      permissions: ['all'],
      passwordHash: pass,
      pin,
      isActive: true,
      createdAt: nowIso,
    });

    // 4. Seed Subscription Quota
    const subscriptionPlan: 'Starter' | 'Professional' | 'Enterprise' =
      plan === 'Multi-Chain Enterprise' ? 'Enterprise' : plan;
    const planPrice = plan === 'Enterprise' || plan === 'Multi-Chain Enterprise' ? 4999 : plan === 'Professional' ? 1999 : 999;
    await db.store_subscriptions.put({
      id: `sub-${newBrandId.toLowerCase()}`,
      storeId: newBrandId,
      storeName: brandName,
      plan: subscriptionPlan,
      billingCycle: 'MONTHLY',
      amount: planPrice,
      currency,
      status: 'ACTIVE',
      startDate: nowIso,
      nextBillingDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
      paymentMethod: 'Dev Core Provisioned',
      autoRenew: true,
      staffLimit: plan === 'Enterprise' || plan === 'Multi-Chain Enterprise' ? 15 : plan === 'Professional' ? 6 : 3,
      outletLimit: outletCount,
      terminalLimit: terminalCount,
      productLimit: plan === 'Enterprise' || plan === 'Multi-Chain Enterprise' ? null : 1000,
    });

    // 5. Seed Storage Quota
    const storageLimitMb = plan === 'Enterprise' ? 2000 : plan === 'Professional' ? 750 : 250;
    await db.store_storage.add({
      id: `stor-${Date.now()}`,
      storeId: newBrandId,
      storeName: brandName,
      storageUsedMb: 1.0,
      storageLimitMb,
      productCount: 0,
      ordersCount: 0,
      barcodesCount: 0,
      customersCount: 0,
      lastBackupAt: nowIso,
      backupStatus: 'HEALTHY',
    });

    // 6. Record Support Ticket (Resolved / Auto-active)
    await db.support_inbox.add({
      id: `ticket-${appId}`,
      storeId: newBrandId,
      storeName: brandName,
      senderName: input.ownerName.trim(),
      senderEmail: input.email.trim().toLowerCase(),
      subject: `[Dev Core Auto-Activated] New Store Provisioned: ${brandName}`,
      message: `Direct Store Creation executed by Dev Core Super Admin.\n\n` +
        `• Store Name: ${brandName} (${input.businessCategory})\n` +
        `• Store ID: ${newBrandId}\n` +
        `• Admin Username: ${username}\n` +
        `• Plan: ${plan}\n` +
        `• Status: ACTIVE & LIVE\n` +
        `• Outlets: ${outletCount} | Terminals: ${terminalCount}\n\n` +
        `The store is automatically active and ready for immediate POS access.`,
      status: 'REPLIED',
      priority: 'MEDIUM',
      replies: [
        {
          id: `rep-${Date.now()}`,
          sender: get().currentUser?.name || 'Dev Core Super Admin',
          senderRole: 'Super Admin',
          message: `⚡ Auto-activated upon creation by Dev Core maker. Store ID: ${newBrandId}. Store workspace: /shop/${newBrandId}`,
          createdAt: nowIso,
        },
      ],
      createdAt: nowIso,
      updatedAt: nowIso,
    });

    // 7. Mirror to Supabase Cloud if online
    try {
      const supabase = getSupabaseBrowserClient();
      if (supabase) {
        const { data: bData } = await supabase
          .from('businesses')
          .insert({
            slug: newBrandId.toLowerCase(),
            name: brandName,
            business_category: input.businessCategory,
            owner_name: input.ownerName.trim(),
            contact_email: input.email.trim().toLowerCase(),
            contact_phone: input.phone?.trim() || null,
            currency,
            tax_rate_default: taxRate,
            outlet_count: outletCount,
            terminal_count: terminalCount,
            is_active: true,
            registration_status: 'ACTIVE',
          })
          .select('id')
          .maybeSingle();

        if (bData) {
          await supabase.from('subscriptions').insert({
            business_id: bData.id,
            plan_tier: plan,
            plan_id: plan.toLowerCase(),
            status: 'ACTIVE',
            billing_cycle: 'MONTHLY',
            monthly_price: planPrice,
            staff_limit: plan === 'Enterprise' ? 15 : plan === 'Professional' ? 6 : 3,
            outlet_limit: outletCount,
            terminal_limit: terminalCount,
            product_limit: plan === 'Enterprise' ? null : 1000,
          });
        }

        await supabase.from('brand_applications').insert({
          brand_name: brandName,
          requested_username: username,
          owner_name: input.ownerName.trim(),
          email: input.email.trim().toLowerCase(),
          phone: input.phone?.trim() || null,
          business_category: input.businessCategory,
          status: 'APPROVED',
          reviewed_at: nowIso,
          reviewed_by: get().currentUser?.name || 'Dev Core Super Admin',
        });
      }
    } catch (cloudErr) {
      console.warn('Could not mirror direct store to Supabase:', cloudErr);
    }

    // 8. Record Dev Core audit log
    await get().recordAuditLog(
      'STORE_APPLICATION_APPROVED',
      'STORE_MANAGEMENT',
      newBrandId,
      `Directly created and AUTO-ACTIVATED store "${brandName}". Assigned Store ID: ${newBrandId}. Admin username: ${username}. Maker: Dev Core.`
    );

    get().setActionNotice({
      message: `🚀 Store "${brandName}" created & AUTO-ACTIVATED! Store ID: ${newBrandId}`,
      type: 'success',
    });

    await get().loadAllData();
    return { success: true, brandId: newBrandId, appId, username };
  },

  // 5. PERMISSIONS & RBAC
  createRole: async (name: string, description: string, permissions: string[]) => {
    const id = `role-${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
    await db.roles_matrix.add({
      id,
      name,
      description,
      isSystem: false,
      permissions,
      userCount: 0,
      createdAt: new Date().toISOString(),
    });

    await get().recordAuditLog('ROLE_CREATED', 'ROLE_MATRIX', id, `Created role "${name}" with ${permissions.length} permissions.`);
    await get().loadAllData();
    return true;
  },

  updateRolePermissions: async (roleId: string, permissions: string[]) => {
    await db.roles_matrix.update(roleId, { permissions });
    await get().recordAuditLog('ROLE_PERMISSIONS_UPDATED', 'ROLE_MATRIX', roleId, `Updated permission set for role: ${roleId}.`);
    await get().loadAllData();
    return true;
  },

  deleteRole: async (roleId: string) => {
    const role = await db.roles_matrix.get(roleId);
    if (!role) return { success: false, error: 'Role not found.' };
    if (role.isSystem) {
      return { success: false, error: 'Cannot delete built-in system roles.' };
    }

    await db.roles_matrix.delete(roleId);
    await get().recordAuditLog('ROLE_DELETED', 'ROLE_MATRIX', roleId, `Deleted custom role: ${role.name}.`);
    await get().loadAllData();
    return { success: true };
  },

  // 6. USER MANAGEMENT
  createUser: async (userData) => {
    const trimmedUser = userData.username.trim().toLowerCase();
    const existing = await db.dev_core_users.where('username').equalsIgnoreCase(trimmedUser).first();
    if (existing) {
      return { success: false, error: `Username "${trimmedUser}" is already taken.` };
    }

    const { hash, salt } = await hashPassword(userData.password);
    const id = `user-${Date.now()}`;

    const newUser: DevCoreUser = {
      id,
      name: userData.name,
      username: trimmedUser,
      email: userData.email,
      passwordHash: hash,
      salt,
      role: userData.role,
      permissions: userData.role === 'SUPER_ADMIN' ? ['all'] : ['manage_stores', 'view_inbox'],
      mustChangePassword: Boolean(userData.requirePasswordChange),
      isPermanent: false,
      isActive: true,
      storeId: userData.storeId,
      createdAt: new Date().toISOString(),
    };

    await db.dev_core_users.add(newUser);
    await get().recordAuditLog('USER_CREATED', 'PLATFORM_USER', id, `Created platform administrator user ${newUser.name} (${newUser.username}) with role ${newUser.role}.`);
    await get().loadAllData();
    return { success: true };
  },

  updateUser: async (userId: string, data: Partial<DevCoreUser>) => {
    const user = await db.dev_core_users.get(userId);
    if (!user) return { success: false, error: 'User not found.' };

    if (user.isPermanent && (data.isActive === false || (data.role && data.role !== 'SUPER_ADMIN'))) {
      return { success: false, error: 'Permanent Dev Core account cannot be deactivated or have Super Admin privileges altered.' };
    }

    await db.dev_core_users.update(userId, data);
    await get().recordAuditLog('USER_UPDATED', 'PLATFORM_USER', userId, `Updated details for user: ${user.username}.`);
    await get().loadAllData();
    return { success: true };
  },

  deleteUser: async (userId: string) => {
    const user = await db.dev_core_users.get(userId);
    if (!user) return { success: false, error: 'User not found.' };

    if (user.isPermanent || user.username === 'devcore') {
      return { success: false, error: 'Permanent system administrator account "devcore" cannot be deleted.' };
    }

    await db.dev_core_users.delete(userId);
    await get().recordAuditLog('USER_DELETED', 'PLATFORM_USER', userId, `Deleted user account: ${user.username}.`, 'WARNING');
    await get().loadAllData();
    return { success: true };
  },

  toggleUserActive: async (userId: string) => {
    const user = await db.dev_core_users.get(userId);
    if (!user) return { success: false, error: 'User not found.' };

    if (user.isPermanent || user.username === 'devcore') {
      return { success: false, error: 'Permanent system administrator account "devcore" cannot be suspended.' };
    }

    const newActive = !user.isActive;
    await db.dev_core_users.update(userId, { isActive: newActive });
    await get().recordAuditLog('USER_STATUS_TOGGLED', 'PLATFORM_USER', userId, `Account ${user.username} is now ${newActive ? 'ACTIVE' : 'DISABLED'}.`);
    await get().loadAllData();
    return { success: true };
  },

  // 7. SUBSCRIPTIONS & PLANS MANAGEMENT
  updateSubscriptionPlan: async (subId: string, newPlan: StoreSubscription['plan']) => {
    const plans = get().pricingPlans;
    const planConfig = plans.find(
      (p) =>
        p.name.toLowerCase().includes(newPlan.toLowerCase()) ||
        p.id.toLowerCase() === newPlan.toLowerCase()
    );

    const price = planConfig
      ? planConfig.monthlyPrice
      : newPlan === 'Enterprise'
      ? 3299
      : newPlan === 'Professional'
      ? 799
      : 0;

    const staffLimit = planConfig
      ? planConfig.staffLimit
      : newPlan === 'Enterprise'
      ? 5
      : newPlan === 'Professional'
      ? 3
      : 1;

    const outletLimit = planConfig ? planConfig.outletLimit : newPlan === 'Starter' ? 1 : newPlan === 'Professional' ? 3 : null;
    const terminalLimit = planConfig ? planConfig.terminalLimit : newPlan === 'Starter' ? 2 : newPlan === 'Professional' ? 6 : null;
    const productLimit = planConfig ? planConfig.productLimit : newPlan === 'Starter' ? 1000 : null;
    const planId = planConfig?.id || newPlan.toLowerCase();

    const sub = await db.store_subscriptions.get(subId);

    await db.store_subscriptions.update(subId, {
      plan: newPlan,
      planId,
      amount: price,
      staffLimit,
      outletLimit,
      terminalLimit,
      productLimit,
    });

    if (sub?.storeId) {
      // Sync store brand planTier
      const brand = await db.brands.where('brandId').equals(sub.storeId).first();
      if (brand) {
        await db.brands.update(brand.id, { planTier: newPlan });
      }

      // Sync Supabase backend and audit trail
      try {
        await fetch('/api/store/subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            storeId: sub.storeId,
            targetPlanId: newPlan.toLowerCase(),
            actorName: get().currentUser?.name || 'Super Admin',
            reason: `Dev Core Super Admin manually changed plan to ${newPlan}`,
          }),
        });
      } catch (err) {
        console.warn('Backend subscription sync:', err);
      }
    }

    await get().recordAuditLog(
      'SUBSCRIPTION_PLAN_CHANGED',
      'STORE_SUBSCRIPTION',
      subId,
      `Changed store subscription to ${newPlan} (₹${price}/mo, Staff Limit: ${staffLimit}).`
    );
    await get().loadAllData();
    return true;
  },

  updateSubscriptionStatus: async (subId: string, status: StoreSubscription['status']) => {
    await db.store_subscriptions.update(subId, { status });
    await get().recordAuditLog('SUBSCRIPTION_STATUS_CHANGED', 'STORE_SUBSCRIPTION', subId, `Subscription status updated to: ${status}.`);
    await get().loadAllData();
    return true;
  },

  updatePlanConfiguration: async (planId: string, updates: Partial<import('@/types/pos').PricingPlan>) => {
    try {
      // 1. Update remote API / Supabase
      const res = await fetch(`/api/plans/${planId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      const resData = await res.json().catch(() => null);
      if (!res.ok || resData?.success === false) {
        throw new Error(resData?.error || `Server responded with status ${res.status}`);
      }

      // 2. Update local Dexie database
      const existing = await db.pricing_plans.get(planId);
      const updatedPlanRecord = {
        ...(existing || {}),
        ...updates,
        id: planId,
        updatedAt: new Date().toISOString(),
      };
      await db.pricing_plans.put(updatedPlanRecord as any);

      // 3. Update existing active store subscriptions matching this plan
      if (updates.staffLimit !== undefined || updates.monthlyPrice !== undefined) {
        const matchingSubs = await db.store_subscriptions.toArray();
        for (const sub of matchingSubs) {
          if (sub.planId === planId || sub.plan.toLowerCase() === planId.toLowerCase()) {
            await db.store_subscriptions.update(sub.id, {
              ...(updates.staffLimit !== undefined ? { staffLimit: updates.staffLimit } : {}),
              ...(updates.monthlyPrice !== undefined ? { amount: updates.monthlyPrice } : {}),
              ...(updates.annualPrice !== undefined ? { annualPrice: updates.annualPrice } : {}),
              ...(updates.outletLimit !== undefined ? { outletLimit: updates.outletLimit } : {}),
              ...(updates.terminalLimit !== undefined ? { terminalLimit: updates.terminalLimit } : {}),
              ...(updates.productLimit !== undefined ? { productLimit: updates.productLimit } : {}),
            });
          }
        }
      }

      await get().recordAuditLog(
        'PLAN_CONFIGURATION_UPDATED',
        'PRICING_PLAN',
        planId,
        `Updated configuration for plan ${planId}: Monthly ₹${updates.monthlyPrice ?? 'unchanged'}, Staff Limit: ${updates.staffLimit ?? 'unchanged'}.`
      );

      get().setActionNotice({
        message: `Plan "${updates.name || planId}" updated successfully across platform.`,
        type: 'success',
      });

      await get().loadAllData();
      return true;
    } catch (err: any) {
      get().setActionNotice({
        message: `Failed to update plan: ${err.message}`,
        type: 'error',
      });
      return false;
    }
  },

  updateEnquiryStatus: async (enquiryId: string, status: import('@/types/pos').PlanEnquiry['status']) => {
    try {
      await fetch(`/api/plans/enquiries/${enquiryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      await db.plan_enquiries.update(enquiryId, { status });
      await get().recordAuditLog('PLAN_ENQUIRY_STATUS_UPDATED', 'PLAN_ENQUIRY', enquiryId, `Enquiry marked as ${status}.`);
      await get().loadAllData();
      return true;
    } catch (e) {
      return false;
    }
  },

  deletePlanEnquiry: async (enquiryId: string) => {
    try {
      await fetch(`/api/plans/enquiries/${enquiryId}`, {
        method: 'DELETE',
      });
      await db.plan_enquiries.delete(enquiryId);
      await get().recordAuditLog('PLAN_ENQUIRY_DELETED', 'PLAN_ENQUIRY', enquiryId, `Deleted plan enquiry lead.`);
      await get().loadAllData();
      return true;
    } catch (e) {
      return false;
    }
  },

  // 8. STORAGE MANAGEMENT
  adjustStorageLimit: async (storeId: string, newLimitMb: number) => {
    const stor = await db.store_storage.where('storeId').equals(storeId).first();
    if (stor) {
      await db.store_storage.update(stor.id, { storageLimitMb: newLimitMb });
      await get().recordAuditLog('STORAGE_LIMIT_ADJUSTED', 'STORE_STORAGE', storeId, `Adjusted storage limit for store ${storeId} to ${newLimitMb} MB.`);
      await get().loadAllData();
      return true;
    }
    return false;
  },

  backupStoreSnapshot: async (storeId: string) => {
    const brand = await db.brands.where('brandId').equals(storeId).first();
    const prods = await db.products.where('brandId').equals(storeId).toArray();
    const orders = await db.orders.where('brandId').equals(storeId).toArray();
    const bars = await db.barcodes.where('brandId').equals(storeId).toArray();

    const snapshot = {
      exportVersion: 'OURSELL-OS-3.0',
      exportedAt: new Date().toISOString(),
      store: brand,
      metrics: {
        productsCount: prods.length,
        ordersCount: orders.length,
        barcodesCount: bars.length,
      },
      data: {
        products: prods,
        orders,
        barcodes: bars,
      },
    };

    // Update last backup timestamp
    const stor = await db.store_storage.where('storeId').equals(storeId).first();
    if (stor) {
      await db.store_storage.update(stor.id, { lastBackupAt: new Date().toISOString(), backupStatus: 'HEALTHY' });
    }

    await get().recordAuditLog('STORE_BACKUP_GENERATED', 'DATABASE_BACKUP', storeId, `Generated database backup snapshot for store: ${storeId}.`);
    return JSON.stringify(snapshot, null, 2);
  },

  // 9. SYSTEM SETTINGS
  updateSystemSetting: async (key: string, value: string) => {
    const user = get().currentUser;
    const setting = await db.system_settings.where('key').equals(key).first();
    if (setting) {
      await db.system_settings.update(setting.id, {
        value,
        updatedAt: new Date().toISOString(),
        updatedBy: user?.username || 'devcore',
      });
    } else {
      await db.system_settings.add({
        id: `set-${Date.now()}`,
        key,
        value,
        category: 'GENERAL',
        label: key.replace(/_/g, ' ').toUpperCase(),
        description: 'System setting',
        updatedAt: new Date().toISOString(),
        updatedBy: user?.username || 'devcore',
      });
    }

    await get().recordAuditLog('SETTING_MODIFIED', 'SYSTEM_CONFIG', key, `Modified setting "${key}" to "${value}".`);
    await get().loadAllData();
    return true;
  },

  deleteStore: async (brandId: string) => {
    if (brandId === 'devcore') {
      return { success: false, error: 'Cannot delete Dev Core permanent root node.' };
    }
    await Promise.all([
      db.brands.where('brandId').equals(brandId).delete().catch(() => {}),
      db.accounts.where('storeId').equals(brandId).delete().catch(() => {}),
      db.products.where('brandId').equals(brandId).delete().catch(() => {}),
      db.orders.where('brandId').equals(brandId).delete().catch(() => {}),
      db.shifts.where('brandId').equals(brandId).delete().catch(() => {}),
      db.store_subscriptions.where('storeId').equals(brandId).delete().catch(() => {}),
      db.store_storage.where('storeId').equals(brandId).delete().catch(() => {}),
      db.support_inbox.where('storeId').equals(brandId).delete().catch(() => {}),
    ]);
    await get().recordAuditLog('STORE_DELETED', 'STORE', brandId, `Deleted store node ${brandId}`, 'WARNING');
    await get().loadAllData();
    return { success: true };
  },

  purgeDatabase: async () => {
    set({ isLoading: true });
    const { purgeDatabaseKeepDevCoreOnly } = await import('@/db/posDb');
    await purgeDatabaseKeepDevCoreOnly();
    await get().loadAllData();
    set({
      isLoading: false,
      actionNotice: {
        message: 'Database cleared successfully. All stores & history wiped. Dev Core permanent core maintained.',
        type: 'success',
      },
    });
  },

  // 10. AUDIT LOGGING
  recordAuditLog: async (action, targetEntity, targetId, details, severity = 'INFO') => {
    const user = get().currentUser;
    await db.dev_core_audit_logs.add({
      id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      actor: user?.username || 'devcore',
      actorRole: user?.role === 'SUPER_ADMIN' ? 'Super Admin' : (user?.role || 'SYSTEM'),
      action,
      targetEntity,
      targetId,
      details,
      ipAddress: '127.0.0.1 (Internal Admin Network)',
      severity,
      timestamp: new Date().toISOString(),
    }).catch(() => {});
  },
}));
