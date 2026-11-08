import Dexie, { type EntityTable } from 'dexie';
import { isRealStore } from '@/lib/planAccess';
import {
  BrandApplication,
  Brand,
  Product,
  ProductVariant,
  Order,
  OrderItem,
  Customer,
  CustomerCreditLedger,
  Supplier,
  PurchaseOrder,
  ShiftSession,
  StoreExpense,
  Promotion,
  StaffUser,
  TerminalTelemetry,
  HeldCart,
  AuditLog,
} from '@/types/pos';

export class OursellDatabase extends Dexie {
  brand_applications!: EntityTable<BrandApplication, 'id'>;
  brands!: EntityTable<Brand, 'id'>;
  products!: EntityTable<Product, 'id'>;
  variants!: EntityTable<ProductVariant, 'id'>;
  orders!: EntityTable<Order, 'id'>;
  order_items!: EntityTable<OrderItem & { id: string; orderId: string; brandId: string }, 'id'>;
  customers!: EntityTable<Customer, 'id'>;
  customer_credit_ledger!: EntityTable<CustomerCreditLedger, 'id'>;
  suppliers!: EntityTable<Supplier, 'id'>;
  purchase_orders!: EntityTable<PurchaseOrder, 'id'>;
  shifts!: EntityTable<ShiftSession, 'id'>;
  store_expenses!: EntityTable<StoreExpense, 'id'>;
  promotions!: EntityTable<Promotion, 'id'>;
  staff_users!: EntityTable<StaffUser, 'id'>;
  terminal_telemetry!: EntityTable<TerminalTelemetry, 'id'>;
  held_carts!: EntityTable<HeldCart, 'id'>;
  audit_logs!: EntityTable<AuditLog, 'id'>;
  barcodes!: EntityTable<import('@/types/pos').BarcodeRecord, 'id'>;
  barcode_prints!: EntityTable<import('@/types/pos').BarcodePrintLog, 'id'>;
  accounts!: EntityTable<import('@/types/pos').StoreAccount, 'id'>;
  dev_core_users!: EntityTable<import('@/types/devcore').DevCoreUser, 'id'>;
  support_inbox!: EntityTable<import('@/types/devcore').SupportMessage, 'id'>;
  roles_matrix!: EntityTable<import('@/types/devcore').DevCoreRole, 'id'>;
  store_subscriptions!: EntityTable<import('@/types/devcore').StoreSubscription, 'id'>;
  store_storage!: EntityTable<import('@/types/devcore').StoreStorageQuota, 'id'>;
  system_settings!: EntityTable<import('@/types/devcore').PlatformSystemSetting, 'id'>;
  dev_core_audit_logs!: EntityTable<import('@/types/devcore').DevCoreAuditLog, 'id'>;
  pricing_plans!: EntityTable<import('@/types/pos').PricingPlan, 'id'>;
  plan_enquiries!: EntityTable<import('@/types/pos').PlanEnquiry, 'id'>;

  constructor() {
    super('Oursell_POS_DB');
    this.version(4).stores({
      brand_applications: 'id, requestedUsername, email, status, appliedAt',
      brands: 'id, brandId, username, status, planTier',
      products: 'id, brandId, barcode, sku, category, title, stock, isActive',
      variants: 'id, brandId, parentProductId, sku, barcode',
      orders: 'id, brandId, orderNumber, status, customerPhone, cashierId, createdAt',
      order_items: 'id, orderId, productId, brandId',
      customers: 'id, brandId, phone, name',
      customer_credit_ledger: 'id, brandId, customerId, createdAt',
      suppliers: 'id, brandId, phone, name',
      purchase_orders: 'id, brandId, poNumber, supplierId, status, createdAt',
      shifts: 'id, brandId, cashierId, status, openedAt',
      store_expenses: 'id, brandId, shiftId, category, createdAt',
      promotions: 'id, brandId, code, promoType, isActive',
      staff_users: 'id, brandId, pin, role, isActive',
      terminal_telemetry: 'id, brandId, terminalId, lastPing',
      held_carts: 'id, brandId, heldNumber, createdAt',
      audit_logs: 'id, brandId, actor, timestamp',
      barcodes: 'id, brandId, barcodeValue, productId, barcodeType, createdAt',
      barcode_prints: 'id, brandId, barcodeValue, printedAt',
      accounts: 'id, storeId, username, role, isActive',
    });

    this.version(5).stores({
      brand_applications: 'id, requestedUsername, email, status, appliedAt',
      brands: 'id, brandId, username, status, planTier',
      products: 'id, brandId, barcode, sku, category, title, stock, isActive',
      variants: 'id, brandId, parentProductId, sku, barcode',
      orders: 'id, brandId, orderNumber, status, customerPhone, cashierId, createdAt',
      order_items: 'id, orderId, productId, brandId',
      customers: 'id, brandId, phone, name',
      customer_credit_ledger: 'id, brandId, customerId, createdAt',
      suppliers: 'id, brandId, phone, name',
      purchase_orders: 'id, brandId, poNumber, supplierId, status, createdAt',
      shifts: 'id, brandId, cashierId, status, openedAt',
      store_expenses: 'id, brandId, shiftId, category, createdAt',
      promotions: 'id, brandId, code, promoType, isActive',
      staff_users: 'id, brandId, pin, role, isActive',
      terminal_telemetry: 'id, brandId, terminalId, lastPing',
      held_carts: 'id, brandId, heldNumber, createdAt',
      audit_logs: 'id, brandId, actor, timestamp',
      barcodes: 'id, brandId, barcodeValue, productId, barcodeType, createdAt',
      barcode_prints: 'id, brandId, barcodeValue, printedAt',
      accounts: 'id, storeId, username, role, isActive',
      dev_core_users: 'id, username, email, role, isActive, isPermanent',
      support_inbox: 'id, storeId, status, priority, senderEmail, createdAt',
      roles_matrix: 'id, name, isSystem, createdAt',
      store_subscriptions: 'id, storeId, plan, status, nextBillingDate',
      store_storage: 'id, storeId, storageLimitMb, backupStatus',
      system_settings: 'id, key, category, updatedAt',
      dev_core_audit_logs: 'id, actor, action, severity, timestamp',
    });

    this.version(6).stores({
      brand_applications: 'id, requestedUsername, email, status, appliedAt',
      brands: 'id, brandId, username, status, planTier',
      products: 'id, brandId, barcode, sku, category, title, stock, isActive',
      variants: 'id, brandId, parentProductId, sku, barcode',
      orders: 'id, brandId, orderNumber, status, customerPhone, cashierId, createdAt',
      order_items: 'id, orderId, productId, brandId',
      customers: 'id, brandId, phone, name',
      customer_credit_ledger: 'id, brandId, customerId, createdAt',
      suppliers: 'id, brandId, phone, name',
      purchase_orders: 'id, brandId, poNumber, supplierId, status, createdAt',
      shifts: 'id, brandId, cashierId, status, openedAt',
      store_expenses: 'id, brandId, shiftId, category, createdAt',
      promotions: 'id, brandId, code, promoType, isActive',
      staff_users: 'id, brandId, pin, role, isActive',
      terminal_telemetry: 'id, brandId, terminalId, lastPing',
      held_carts: 'id, brandId, heldNumber, createdAt',
      audit_logs: 'id, brandId, actor, timestamp',
      barcodes: 'id, brandId, barcodeValue, productId, barcodeType, createdAt',
      barcode_prints: 'id, brandId, barcodeValue, printedAt',
      accounts: 'id, storeId, username, role, isActive',
      dev_core_users: 'id, username, email, role, isActive, isPermanent',
      support_inbox: 'id, storeId, status, priority, senderEmail, createdAt',
      roles_matrix: 'id, name, isSystem, createdAt',
      store_subscriptions: 'id, storeId, plan, status, nextBillingDate',
      store_storage: 'id, storeId, storageLimitMb, backupStatus',
      system_settings: 'id, key, category, updatedAt',
      dev_core_audit_logs: 'id, actor, action, severity, timestamp',
      pricing_plans: 'id, name, isActive, sortOrder',
      plan_enquiries: 'id, planId, status, customerEmail, createdAt',
    });
  }
}

export async function seedDevCoreData(): Promise<void> {
  try {
    // 1. Permanent Super Admin Account: devcore
    const existingDevCore = await db.dev_core_users.where('username').equals('devcore').first().catch(() => null);
    if (!existingDevCore) {
      await db.dev_core_users.put({
        id: 'acc-devcore-root',
        name: 'Dev Core',
        username: 'devcore',
        email: 'devcore@oursell.internal',
        passwordHash: '077eee4d64f151dc462e86983fe8fcf256a373c2a0b3d4103336003d02194940', // SHA-256 hash of '6001' + 'dc_salt_6001_seed'
        salt: 'dc_salt_6001_seed',
        role: 'SUPER_ADMIN',
        permissions: ['all'],
        mustChangePassword: false,
        isPermanent: true,
        isActive: true,
        createdAt: new Date().toISOString(),
      });
    } else if (existingDevCore.mustChangePassword) {
      await db.dev_core_users.update(existingDevCore.id, { mustChangePassword: false }).catch(() => {});
    }

    // Also mirror to accounts table for system compatibility
    const existingAcc = await db.accounts.where('username').equals('devcore').first().catch(() => null);
    if (!existingAcc) {
      await db.accounts.put({
        id: 'acc-devcore-root',
        storeId: 'devcore',
        username: 'devcore',
        email: 'devcore@oursell.internal',
        name: 'Dev Core',
        role: 'STORE_ADMIN',
        permissions: ['all'],
        passwordHash: '077eee4d64f151dc462e86983fe8fcf256a373c2a0b3d4103336003d02194940',
        pin: '6001',
        isActive: true,
        createdAt: new Date().toISOString(),
      });
    }

    // Also register devcore node in brands table for store discovery
    const existingDevBrand = await db.brands.where('brandId').equals('devcore').first().catch(() => null);
    if (!existingDevBrand) {
      await db.brands.put({
        id: 'brand-devcore-node',
        brandId: 'devcore',
        brandName: 'Dev Core Admin Control Centre',
        businessCategory: 'Administration',
        ownerName: 'Dev Core Root',
        email: 'devcore@oursell.internal',
        phone: '+91 98765 60001',
        username: 'devcore',
        passwordHash: '077eee4d64f151dc462e86983fe8fcf256a373c2a0b3d4103336003d02194940',
        status: 'ACTIVE',
        planTier: 'Enterprise',
        createdAt: new Date().toISOString(),
        outletCount: 1,
        terminalCount: 1,
        currency: '₹',
        taxRateDefault: 0,
      });
    }

    // 2. Roles Matrix
    const roleCount = await db.roles_matrix.count().catch(() => 0);
    if (roleCount === 0) {
      await db.roles_matrix.bulkPut([
        {
          id: 'role-super-admin',
          name: 'Super Admin',
          description: 'Unrestricted system-level control, user management, and security configuration.',
          isSystem: true,
          permissions: ['all'],
          userCount: 1,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'role-platform-admin',
          name: 'Platform Admin',
          description: 'Full operational administration excluding core security root account deletion.',
          isSystem: true,
          permissions: [
            'manage_stores',
            'suspend_stores',
            'view_inbox',
            'reply_inbox',
            'manage_users',
            'manage_subscriptions',
            'view_storage',
            'manage_system_settings',
            'view_audit_logs',
          ],
          userCount: 2,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'role-support-agent',
          name: 'Support Specialist',
          description: 'Store ticket management, dispute resolution, and store connectivity monitoring.',
          isSystem: true,
          permissions: ['view_inbox', 'reply_inbox', 'view_stores', 'view_audit_logs'],
          userCount: 3,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'role-billing-manager',
          name: 'Billing Manager',
          description: 'Subscription tiers, invoices, manual payment verification, and resource quotas.',
          isSystem: true,
          permissions: ['manage_subscriptions', 'view_stores', 'view_revenue', 'adjust_quota'],
          userCount: 1,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'role-auditor',
          name: 'Compliance Auditor',
          description: 'Read-only compliance, system activity inspection, and audit trail review.',
          isSystem: true,
          permissions: ['view_audit_logs', 'view_stores', 'view_storage'],
          userCount: 1,
          createdAt: new Date().toISOString(),
        },
      ]);
    }

    // 3. Support Inbox: Start clean, populated dynamically by store inquiries
    // 4. Store Subscriptions: Start clean, populated dynamically by active store plans
    // 5. Store Storage Quotas: Start clean, populated dynamically by active store nodes

    // 6. System Settings
    const settingsCount = await db.system_settings.count().catch(() => 0);
    if (settingsCount === 0) {
      await db.system_settings.bulkPut([
        {
          id: 'set-001',
          key: 'platform_name',
          value: 'OURSELL Retail Cloud Platform',
          category: 'GENERAL',
          label: 'Platform Name',
          description: 'Public name displayed on POS login consoles and receipts.',
          updatedAt: new Date().toISOString(),
          updatedBy: 'devcore',
        },
        {
          id: 'set-002',
          key: 'maintenance_mode',
          value: 'false',
          category: 'MAINTENANCE',
          label: 'Maintenance Mode',
          description: 'Temporary lock for platform upgrades. Prevents new store shifts.',
          updatedAt: new Date().toISOString(),
          updatedBy: 'devcore',
        },
        {
          id: 'set-003',
          key: 'support_email',
          value: 'support@oursell.internal',
          category: 'GENERAL',
          label: 'Support Contact Email',
          description: 'Official correspondence email shown in store help desks.',
          updatedAt: new Date().toISOString(),
          updatedBy: 'devcore',
        },
        {
          id: 'set-004',
          key: 'session_timeout_minutes',
          value: '60',
          category: 'SECURITY',
          label: 'Admin Session Inactivity Timeout',
          description: 'Automatically log out inactive control centre sessions (minutes).',
          updatedAt: new Date().toISOString(),
          updatedBy: 'devcore',
        },
        {
          id: 'set-005',
          key: 'enforce_first_login_password_change',
          value: 'true',
          category: 'SECURITY',
          label: 'Force Password Change on First Login',
          description: 'Require new users and Dev Core root to update default initial password.',
          updatedAt: new Date().toISOString(),
          updatedBy: 'devcore',
        },
        {
          id: 'set-006',
          key: 'default_starter_quota_mb',
          value: '250',
          category: 'STORAGE',
          label: 'Starter Tier Storage Quota (MB)',
          description: 'Default disk allocation for Starter tier stores.',
          updatedAt: new Date().toISOString(),
          updatedBy: 'devcore',
        },
        {
          id: 'set-007',
          key: 'default_pro_quota_mb',
          value: '500',
          category: 'STORAGE',
          label: 'Professional Tier Storage Quota (MB)',
          description: 'Default disk allocation for Professional tier stores.',
          updatedAt: new Date().toISOString(),
          updatedBy: 'devcore',
        },
        {
          id: 'set-008',
          key: 'default_currency',
          value: '₹',
          category: 'BILLING',
          label: 'Default Currency Symbol',
          description: 'Default financial display symbol.',
          updatedAt: new Date().toISOString(),
          updatedBy: 'devcore',
        },
      ]);
    }

    // 8. Global Pricing Plans & Subscriptions
    const planCount = await db.pricing_plans.count().catch(() => 0);
    if (planCount === 0) {
      await db.pricing_plans.bulkPut([
        {
          id: 'starter',
          name: 'Starter',
          description: 'Perfect for small stores and startups.',
          monthlyPrice: 0,
          annualPrice: 0,
          staffLimit: 1,
          outletLimit: 1,
          terminalLimit: 2,
          productLimit: 1000,
          features: [
            '1 Staff Account',
            '1 Store Outlet',
            '2 POS Terminals',
            'Full POS Billing',
            'Offline Billing',
            'Barcode Studio',
            '80mm Thermal Receipts',
            'Up to 1,000 Products',
          ],
          isActive: true,
          sortOrder: 1,
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'professional',
          name: 'Professional',
          badge: 'MOST POPULAR',
          description: 'Ideal for supermarkets, restaurants and multi-counter outlets.',
          monthlyPrice: 799,
          annualPrice: 7990,
          staffLimit: 3,
          outletLimit: 3,
          terminalLimit: 6,
          productLimit: null,
          features: [
            'Up to 3 Staff Accounts',
            'Up to 3 Store Outlets',
            '6 POS Terminals',
            'Unlimited Products',
            'Customer Khata & Credit Ledger',
            'Purchase Orders',
            'Supplier Management',
            'Advanced Inventory & Reports',
            'English, Malayalam & Arabic Support',
          ],
          isActive: true,
          sortOrder: 2,
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'enterprise',
          name: 'Multi-Chain Enterprise',
          description: 'For retail chains, franchises and regional networks.',
          monthlyPrice: 3299,
          annualPrice: 32990,
          staffLimit: 5, // Strict maximum of 5 staff accounts
          outletLimit: null,
          terminalLimit: null,
          productLimit: null,
          features: [
            'Up to 5 Staff Accounts',
            'Unlimited Store Outlets',
            'Unlimited POS Terminals',
            'Unlimited Products',
            'Centralized Fleet Management',
            'Dedicated Database Isolation',
            'Custom Domain',
            'Advanced Permissions',
            '24/7 Priority Support',
          ],
          isActive: true,
          sortOrder: 3,
          updatedAt: new Date().toISOString(),
        },
      ]);
    }

    // Clean legacy demo store subscriptions and consolidate duplicate entries
    await cleanStoreSubscriptionsTable().catch(() => {});
  } catch (err) {
    console.warn('Error in seedDevCoreData:', err);
  }
}

export const db = new OursellDatabase();

/**
 * Automatically purges legacy demo subscriptions and consolidates duplicate entries
 * for real stores so that each active real store has exactly one canonical subscription.
 */
export async function cleanStoreSubscriptionsTable(): Promise<void> {
  try {
    const allSubs = await db.store_subscriptions.toArray();
    const demoIds: string[] = [];
    const storesMap = new Map<string, (typeof allSubs)[0][]>();

    for (const sub of allSubs) {
      if (!isRealStore(sub)) {
        demoIds.push(sub.id);
        continue;
      }

      const storeIdClean = (sub.storeId || '').trim().toLowerCase();
      if (!storeIdClean) {
        demoIds.push(sub.id);
        continue;
      }

      const list = storesMap.get(storeIdClean) || [];
      list.push(sub);
      storesMap.set(storeIdClean, list);
    }

    // 1. Delete all mock / demo store subscriptions
    if (demoIds.length > 0) {
      await db.store_subscriptions.bulkDelete(demoIds);
    }

    // 2. Deduplicate real stores with multiple records
    for (const [storeIdClean, list] of storesMap.entries()) {
      const canonicalId = `sub-${storeIdClean}`;
      // Sort to keep best record: active status first, highest plan/amount first
      const sorted = [...list].sort((a, b) => {
        if (a.status === 'ACTIVE' && b.status !== 'ACTIVE') return -1;
        if (b.status === 'ACTIVE' && a.status !== 'ACTIVE') return 1;
        const aEnterprise = a.plan?.toLowerCase() === 'enterprise' ? 1 : 0;
        const bEnterprise = b.plan?.toLowerCase() === 'enterprise' ? 1 : 0;
        if (bEnterprise !== aEnterprise) return bEnterprise - aEnterprise;
        return (b.amount || 0) - (a.amount || 0);
      });
      const best = sorted[0];

      // If duplicate records exist or ID isn't canonical
      if (list.length > 1 || best.id !== canonicalId) {
        const idsToDelete = list.map((s) => s.id);
        await db.store_subscriptions.bulkDelete(idsToDelete);
        await db.store_subscriptions.put({
          ...best,
          id: canonicalId,
          storeId: best.storeId || storeIdClean.toUpperCase(),
        });
      }
    }
  } catch (err) {
    console.warn('Error during store subscriptions cleanup:', err);
  }
}

/**
 * Permanently purges all data history and all store records from IndexedDB.
 * Retains strictly the permanent Dev Core super admin account, system roles, and platform settings.
 */
export async function purgeDatabaseKeepDevCoreOnly(): Promise<void> {
  try {
    // 1. Wipe all data history & transaction tables
    await Promise.all([
      db.orders.clear().catch(() => {}),
      db.order_items.clear().catch(() => {}),
      db.shifts.clear().catch(() => {}),
      db.customer_credit_ledger.clear().catch(() => {}),
      db.audit_logs.clear().catch(() => {}),
      db.held_carts.clear().catch(() => {}),
      db.terminal_telemetry.clear().catch(() => {}),
      db.store_expenses.clear().catch(() => {}),
      db.barcode_prints.clear().catch(() => {}),
      db.barcodes.clear().catch(() => {}),
    ]);

    // 2. Wipe all store entity tables & applications
    await Promise.all([
      db.brand_applications.clear().catch(() => {}),
      db.products.clear().catch(() => {}),
      db.variants.clear().catch(() => {}),
      db.customers.clear().catch(() => {}),
      db.suppliers.clear().catch(() => {}),
      db.purchase_orders.clear().catch(() => {}),
      db.promotions.clear().catch(() => {}),
      db.staff_users.clear().catch(() => {}),
      db.support_inbox.clear().catch(() => {}),
      db.store_subscriptions.clear().catch(() => {}),
      db.store_storage.clear().catch(() => {}),
    ]);

    // 3. Delete all brands except permanent devcore root node
    const allBrands = await db.brands.toArray().catch(() => []);
    for (const b of allBrands) {
      if (b.brandId !== 'devcore' && b.id !== 'brand-devcore-node') {
        await db.brands.delete(b.id).catch(() => {});
      }
    }

    // 4. Delete all accounts except permanent devcore admin
    const allAccounts = await db.accounts.toArray().catch(() => []);
    for (const a of allAccounts) {
      if (a.username !== 'devcore' && a.id !== 'acc-devcore-root') {
        await db.accounts.delete(a.id).catch(() => {});
      }
    }

    // 5. Delete all dev core users except permanent devcore super admin
    const allDevUsers = await db.dev_core_users.toArray().catch(() => []);
    for (const u of allDevUsers) {
      if (u.username !== 'devcore' && !u.isPermanent) {
        await db.dev_core_users.delete(u.id).catch(() => {});
      }
    }

    // 6. Reset dev core audit logs to clean system state
    await db.dev_core_audit_logs.clear().catch(() => {});
    await db.dev_core_audit_logs.put({
      id: 'audit-reset-' + Date.now(),
      actor: 'devcore',
      actorRole: 'SUPER_ADMIN',
      action: 'SYSTEM_PURGE',
      targetEntity: 'DATABASE',
      targetId: 'root',
      details: 'Database cleared. All stores and data history removed. Dev Core permanent core active.',
      ipAddress: '127.0.0.1 (Internal System)',
      severity: 'INFO',
      timestamp: new Date().toISOString(),
    }).catch(() => {});

    // 7. Clear store auth state from localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('oursell_brand_auth');
        localStorage.setItem('oursell_db_cleared_devcore_only_v4', 'true');
      } catch {}
    }

    // 8. Re-seed Dev Core permanent root account, roles, and settings
    await seedDevCoreData();
  } catch (err) {
    console.error('Failed to purge database:', err);
  }
}

export async function seedInitialData(): Promise<void> {
  // Ensure existing browser IndexedDB automatically purges any previous store/history data
  if (typeof window !== 'undefined') {
    const purgeKey = 'oursell_db_cleared_devcore_only_v4';
    if (!localStorage.getItem(purgeKey)) {
      await purgeDatabaseKeepDevCoreOnly();
      return;
    }
  }

  // Ensure Dev Core permanent tables and super admin account are present
  await seedDevCoreData();

  // Normalize legacy 12-digit barcodes to real 13-digit EAN-13 barcodes across products & barcode records
  try {
    const allProds = await db.products.toArray();
    for (const p of allProds) {
      if (p.barcode && p.barcode.length === 12 && /^\d{12}$/.test(p.barcode)) {
        const digits = p.barcode.split('').map(Number);
        const sum = digits.reduce((acc, digit, idx) => acc + (idx % 2 === 0 ? digit : digit * 3), 0);
        const remainder = sum % 10;
        const check = remainder === 0 ? 0 : 10 - remainder;
        await db.products.update(p.id, { barcode: p.barcode + check.toString() });
      }
    }

    const allBars = await db.barcodes.toArray();
    for (const b of allBars) {
      if (b.barcodeValue && b.barcodeValue.length === 12 && /^\d{12}$/.test(b.barcodeValue)) {
        const digits = b.barcodeValue.split('').map(Number);
        const sum = digits.reduce((acc, digit, idx) => acc + (idx % 2 === 0 ? digit : digit * 3), 0);
        const remainder = sum % 10;
        const check = remainder === 0 ? 0 : 10 - remainder;
        await db.barcodes.update(b.id, { barcodeValue: b.barcodeValue + check.toString() });
      }
    }
  } catch (e) {
    console.warn('Barcode migration check failed:', e);
  }
}

export async function seedBarcodes(brandId = 'BRD-101'): Promise<void> {
  await db.barcodes.bulkPut([
    {
      id: 'bar-001',
      brandId,
      productId: 'prod-001',
      productName: 'Potato Chips Masala 50g',
      productSku: 'SNK-CHIP-50G',
      sellingPrice: 20.00,
      barcodeValue: '8901030000015',
      barcodeType: 'EAN13',
      labelSize: '50x25mm',
      createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'bar-002',
      brandId,
      productId: 'prod-002',
      productName: 'Natural Mineral Water 1L',
      productSku: 'BEV-WATR-1L',
      sellingPrice: 20.00,
      barcodeValue: '8901030000022',
      barcodeType: 'EAN13',
      labelSize: '50x25mm',
      createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'bar-003',
      brandId,
      productId: 'prod-003',
      productName: 'Full Cream Fresh Milk 500ml',
      productSku: 'DAI-MILK-500',
      sellingPrice: 32.00,
      barcodeValue: '8901030000039',
      barcodeType: 'EAN13',
      labelSize: '50x25mm',
      createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'bar-004',
      brandId,
      productId: 'prod-004',
      productName: 'Whole Wheat Farm Bread 400g',
      productSku: 'BAK-BRED-400',
      sellingPrice: 45.00,
      barcodeValue: '8901030000046',
      barcodeType: 'EAN13',
      labelSize: '38x25mm',
      createdAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'bar-005',
      brandId,
      productId: 'prod-005',
      productName: 'Dark Chocolate Almond Bar 85g',
      productSku: 'SNK-CHOC-BAR',
      sellingPrice: 100.00,
      barcodeValue: '8901030000053',
      barcodeType: 'EAN13',
      labelSize: '50x25mm',
      createdAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'bar-006',
      brandId,
      productId: 'prod-006',
      productName: 'Cotton Crew Sports Socks (Pair)',
      productSku: 'APP-SOCK-WHT',
      sellingPrice: 150.00,
      barcodeValue: '8901030000060',
      barcodeType: 'CODE128',
      labelSize: '50x25mm',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]);
}

export async function seedOursellDemoStore(): Promise<void> {
  const storeId = 'oursell';

  // 1. Seed Store Brand
  await db.brands.put({
    id: 'brand-oursell',
    brandId: storeId,
    brandName: 'Oursell Demo Store',
    businessCategory: 'General Retail',
    ownerName: 'Oursell Retail Admin',
    email: 'oursell@admin',
    phone: '+91 81290 31950',
    username: 'oursell',
    passwordHash: '6001',
    status: 'ACTIVE',
    planTier: 'Enterprise',
    createdAt: new Date().toISOString(),
    outletCount: 2,
    terminalCount: 4,
    currency: '₹',
    taxRateDefault: 5,
  });

  // 2. Seed Accounts: Admin & Staff
  await db.accounts.bulkPut([
    {
      id: 'acc-oursell-admin',
      storeId: 'oursell',
      username: 'oursell@admin',
      email: 'admin@ourselldemo.com',
      passwordHash: '6001',
      name: 'Oursell Store Admin',
      role: 'STORE_ADMIN',
      permissions: ['all'],
      pin: '6001',
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'acc-oursell-staff',
      storeId: 'oursell',
      username: 'oursell@staff',
      email: 'staff@ourselldemo.com',
      passwordHash: '1234',
      name: 'Cashier Fatima',
      role: 'STORE_STAFF',
      permissions: ['pos_billing', 'customer_manage', 'invoice_print'],
      pin: '1234',
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'acc-centralmart-admin',
      storeId: 'BRD-101',
      username: 'centralmart',
      email: 'kadri@centralmart.com',
      passwordHash: 'store123',
      name: 'Ibrahim Kadri',
      role: 'STORE_ADMIN',
      permissions: ['all'],
      pin: '1234',
      isActive: true,
      createdAt: new Date().toISOString(),
    },
  ]);

  // 3. Seed Products for 'oursell' store
  const existingProds = await db.products.where('brandId').equals(storeId).count().catch(() => 0);
  if (existingProds === 0) {
    await db.products.bulkPut([
      {
        id: 'prod-our-001',
        brandId: storeId,
        barcode: '8902000000016',
        sku: 'OUR-CHIP-50G',
        title: 'Artisan Potato Crisps Masala 50g',
        brand: 'Crispo',
        category: 'Snacks',
        unit: 'Pcs',
        costPrice: 15.00,
        mrp: 30.00,
        sellingPrice: 25.00,
        taxRate: 5,
        stock: 58,
        lowStockThreshold: 15,
        image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=300&auto=format&fit=crop&q=80',
        isActive: true,
      },
      {
        id: 'prod-our-002',
        brandId: storeId,
        barcode: '8902000000023',
        sku: 'OUR-WATR-1L',
        title: 'Himalayan Spring Mineral Water 1L',
        brand: 'AquaPure',
        category: 'Beverages',
        unit: 'Pcs',
        costPrice: 10.00,
        mrp: 25.00,
        sellingPrice: 20.00,
        taxRate: 5,
        stock: 120,
        lowStockThreshold: 20,
        image: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=300&auto=format&fit=crop&q=80',
        isActive: true,
      },
      {
        id: 'prod-our-003',
        brandId: storeId,
        barcode: '8902000000030',
        sku: 'OUR-MILK-500',
        title: 'Farm Fresh Organic Whole Milk 500ml',
        brand: 'DairyGold',
        category: 'Dairy',
        unit: 'Pcs',
        costPrice: 22.00,
        mrp: 35.00,
        sellingPrice: 32.00,
        taxRate: 5,
        stock: 40,
        lowStockThreshold: 10,
        image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300&auto=format&fit=crop&q=80',
        isActive: true,
      },
      {
        id: 'prod-our-004',
        brandId: storeId,
        barcode: '8902000000047',
        sku: 'OUR-BRED-400',
        title: 'Rustic Sourdough Farm Bread 400g',
        brand: 'OvenCraft',
        category: 'Bakery',
        unit: 'Pcs',
        costPrice: 30.00,
        mrp: 60.00,
        sellingPrice: 50.00,
        taxRate: 5,
        stock: 25,
        lowStockThreshold: 8,
        image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300&auto=format&fit=crop&q=80',
        isActive: true,
      },
      {
        id: 'prod-our-005',
        brandId: storeId,
        barcode: '8902000000054',
        sku: 'OUR-CHOC-85G',
        title: 'Single Origin Dark Chocolate 85g',
        brand: 'ChocoNoir',
        category: 'Snacks',
        unit: 'Pcs',
        costPrice: 65.00,
        mrp: 120.00,
        sellingPrice: 99.00,
        taxRate: 18,
        stock: 35,
        lowStockThreshold: 10,
        image: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=300&auto=format&fit=crop&q=80',
        isActive: true,
      },
      {
        id: 'prod-our-006',
        brandId: storeId,
        barcode: '8902000000061',
        sku: 'OUR-COFF-250',
        title: 'Specialty Arabica Roasted Coffee Beans 250g',
        brand: 'RoastMasters',
        category: 'Beverages',
        unit: 'Pcs',
        costPrice: 220.00,
        mrp: 450.00,
        sellingPrice: 380.00,
        taxRate: 5,
        stock: 18,
        lowStockThreshold: 5,
        image: 'https://images.unsplash.com/photo-1587734195503-904fca47e0e9?w=300&auto=format&fit=crop&q=80',
        isActive: true,
      },
    ]);
  }

  // 4. Seed Barcodes for 'oursell'
  const existingBars = await db.barcodes.where('brandId').equals(storeId).count().catch(() => 0);
  if (existingBars === 0) {
    await db.barcodes.bulkPut([
      {
        id: 'bar-our-001',
        brandId: storeId,
        productId: 'prod-our-001',
        productName: 'Artisan Potato Crisps Masala 50g',
        productSku: 'OUR-CHIP-50G',
        sellingPrice: 25.00,
        barcodeValue: '8902000000016',
        barcodeType: 'EAN13',
        labelSize: '50x25mm',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'bar-our-002',
        brandId: storeId,
        productId: 'prod-our-002',
        productName: 'Himalayan Spring Mineral Water 1L',
        productSku: 'OUR-WATR-1L',
        sellingPrice: 20.00,
        barcodeValue: '8902000000023',
        barcodeType: 'EAN13',
        labelSize: '50x25mm',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'bar-our-003',
        brandId: storeId,
        productId: 'prod-our-003',
        productName: 'Farm Fresh Organic Whole Milk 500ml',
        productSku: 'OUR-MILK-500',
        sellingPrice: 32.00,
        barcodeValue: '8902000000030',
        barcodeType: 'EAN13',
        labelSize: '50x25mm',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);
  }

  // 5. Seed Shift for 'oursell'
  const existingShifts = await db.shifts.where('brandId').equals(storeId).count().catch(() => 0);
  if (existingShifts === 0) {
    await db.shifts.put({
      id: 'shift-oursell-01',
      brandId: storeId,
      shiftNumber: 'Shift #01',
      cashierId: 'acc-oursell-admin',
      cashierName: 'Oursell Store Admin',
      openingFloat: 2500.00,
      expectedCash: 6450.00,
      payIns: 0,
      payOuts: 0,
      cashSales: 3950.00,
      cardSales: 4200.00,
      upiSales: 3100.00,
      khataSales: 0,
      totalSales: 11250.00,
      openedAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
      status: 'OPEN',
    });
  }

  // 6. Seed Orders for 'oursell'
  const existingOrders = await db.orders.where('brandId').equals(storeId).count().catch(() => 0);
  if (existingOrders === 0) {
    await db.orders.bulkPut([
      {
        id: 'ord-our-001',
        brandId: storeId,
        orderNumber: 'INV-OUR-0001',
        items: [
          {
            productId: 'prod-our-001',
            title: 'Artisan Potato Crisps Masala 50g',
            quantity: 2,
            unitPrice: 25.00,
            discount: 0,
            taxRate: 5,
            lineTotal: 50.00,
          },
          {
            productId: 'prod-our-002',
            title: 'Himalayan Spring Mineral Water 1L',
            quantity: 2,
            unitPrice: 20.00,
            discount: 0,
            taxRate: 5,
            lineTotal: 40.00,
          },
        ],
        subtotal: 90.00,
        discountAmount: 0,
        taxAmount: 4.50,
        grandTotal: 94.50,
        paymentMethod: 'CASH',
        cashTendered: 100.00,
        changeDue: 5.50,
        customerId: 'cust-our-001',
        customerName: 'Anil Kumar',
        customerPhone: '+91 98450 77889',
        cashierId: 'acc-oursell-staff',
        cashierName: 'Cashier Fatima',
        status: 'COMPLETED',
        createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
      },
      {
        id: 'ord-our-002',
        brandId: storeId,
        orderNumber: 'INV-OUR-0002',
        items: [
          {
            productId: 'prod-our-006',
            title: 'Specialty Arabica Roasted Coffee Beans 250g',
            quantity: 1,
            unitPrice: 380.00,
            discount: 0,
            taxRate: 5,
            lineTotal: 380.00,
          },
        ],
        subtotal: 380.00,
        discountAmount: 20.00,
        taxAmount: 18.00,
        grandTotal: 378.00,
        paymentMethod: 'UPI',
        customerId: 'cust-our-002',
        customerName: 'Aysha Noor',
        customerPhone: '+91 94470 12345',
        cashierId: 'acc-oursell-admin',
        cashierName: 'Oursell Store Admin',
        status: 'COMPLETED',
        createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      },
    ]);
  }
}

export async function seedResellStore(): Promise<void> {
  const storeId = 'resell';

  // 1. Seed Store Brand
  await db.brands.put({
    id: 'brand-resell',
    brandId: storeId,
    brandName: 'Resell Store',
    businessCategory: 'Fashion',
    ownerName: 'Resell Admin',
    email: 'reselladmin@resell.com',
    phone: '+91 98765 00000',
    username: 'reselladmin',
    passwordHash: 'resell6001',
    status: 'ACTIVE',
    planTier: 'Professional',
    createdAt: new Date().toISOString(),
    outletCount: 1,
    terminalCount: 2,
    currency: '₹',
    taxRateDefault: 5,
  });

  // 2. Seed Accounts: Admin & Staff
  await db.accounts.bulkPut([
    {
      id: 'acc-resell-admin',
      storeId: storeId,
      username: 'reselladmin',
      email: 'reselladmin@resell.com',
      passwordHash: 'resell6001',
      name: 'Resell Admin',
      role: 'STORE_ADMIN',
      permissions: ['all'],
      pin: '6001',
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'acc-resell-staff',
      storeId: storeId,
      username: 'resellstaff',
      email: 'staff@resell.com',
      passwordHash: '1234',
      name: 'Resell Staff Cashier',
      role: 'STORE_STAFF',
      permissions: ['pos_billing', 'customer_manage', 'invoice_print'],
      pin: '1234',
      isActive: true,
      createdAt: new Date().toISOString(),
    },
  ]);

  // 3. Seed Products for 'resell' store
  const existingProds = await db.products.where('brandId').equals(storeId).count().catch(() => 0);
  if (existingProds === 0) {
    await db.products.bulkPut([
      {
        id: 'prod-resell-001',
        brandId: storeId,
        barcode: '8903000000015',
        sku: 'RSL-DNM-JKT',
        title: 'Vintage Washed Denim Jacket',
        brand: 'RetroFit',
        category: 'Outerwear',
        unit: 'Pcs',
        costPrice: 650.00,
        mrp: 1499.00,
        sellingPrice: 999.00,
        taxRate: 5,
        stock: 24,
        lowStockThreshold: 5,
        image: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=300&auto=format&fit=crop&q=80',
        isActive: true,
      },
      {
        id: 'prod-resell-002',
        brandId: storeId,
        barcode: '8903000000022',
        sku: 'RSL-GRF-TEE',
        title: '90s Oversized Graphic Tee',
        brand: 'UrbanVault',
        category: 'Apparel',
        unit: 'Pcs',
        costPrice: 220.00,
        mrp: 699.00,
        sellingPrice: 449.00,
        taxRate: 5,
        stock: 55,
        lowStockThreshold: 10,
        image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=300&auto=format&fit=crop&q=80',
        isActive: true,
      },
      {
        id: 'prod-resell-003',
        brandId: storeId,
        barcode: '8903000000039',
        sku: 'RSL-LTH-BT',
        title: 'Distressed Classic Leather Boots',
        brand: 'TimberCraft',
        category: 'Footwear',
        unit: 'Pcs',
        costPrice: 1100.00,
        mrp: 2999.00,
        sellingPrice: 1899.00,
        taxRate: 12,
        stock: 12,
        lowStockThreshold: 4,
        image: 'https://images.unsplash.com/photo-1520639888713-7851133b1ed0?w=300&auto=format&fit=crop&q=80',
        isActive: true,
      },
      {
        id: 'prod-resell-004',
        brandId: storeId,
        barcode: '8903000000046',
        sku: 'RSL-CAN-TOTE',
        title: 'Heavyweight Canvas Market Tote',
        brand: 'EcoCarry',
        category: 'Accessories',
        unit: 'Pcs',
        costPrice: 150.00,
        mrp: 499.00,
        sellingPrice: 299.00,
        taxRate: 5,
        stock: 40,
        lowStockThreshold: 8,
        image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=300&auto=format&fit=crop&q=80',
        isActive: true,
      },
    ]);
  }

  // 4. Seed Barcodes for 'resell'
  const existingBars = await db.barcodes.where('brandId').equals(storeId).count().catch(() => 0);
  if (existingBars === 0) {
    await db.barcodes.bulkPut([
      {
        id: 'bar-resell-001',
        brandId: storeId,
        productId: 'prod-resell-001',
        productName: 'Vintage Washed Denim Jacket',
        productSku: 'RSL-DNM-JKT',
        sellingPrice: 999.00,
        barcodeValue: '8903000000015',
        barcodeType: 'EAN13',
        labelSize: '50x25mm',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'bar-resell-002',
        brandId: storeId,
        productId: 'prod-resell-002',
        productName: '90s Oversized Graphic Tee',
        productSku: 'RSL-GRF-TEE',
        sellingPrice: 449.00,
        barcodeValue: '8903000000022',
        barcodeType: 'EAN13',
        labelSize: '50x25mm',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);
  }

  // 5. Seed Shift for 'resell'
  const existingShifts = await db.shifts.where('brandId').equals(storeId).count().catch(() => 0);
  if (existingShifts === 0) {
    await db.shifts.put({
      id: 'shift-resell-01',
      brandId: storeId,
      shiftNumber: 'Shift #01',
      cashierId: 'acc-resell-admin',
      cashierName: 'Resell Admin',
      openingFloat: 2000.00,
      expectedCash: 4898.00,
      payIns: 0,
      payOuts: 0,
      cashSales: 2898.00,
      cardSales: 2348.00,
      upiSales: 1348.00,
      khataSales: 0,
      totalSales: 6594.00,
      openedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
      status: 'OPEN',
    });
  }
}

