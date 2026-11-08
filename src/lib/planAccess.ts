/**
 * OURSELL RETAIL OS: CENTRALIZED PLAN CONFIGURATION & FEATURE ACCESS ENGINE
 * Single source of truth for all plan tiers, feature keys, resource limits, and permission checks.
 */

export type PlanId = 'starter' | 'professional' | 'enterprise';
export type PlanTierName = 'Starter' | 'Professional' | 'Enterprise' | 'Multi-Chain Enterprise';

export type FeatureKey =
  | 'pos_billing'
  | 'offline_billing'
  | 'barcode_studio'
  | 'thermal_receipts'
  | 'product_management'
  | 'basic_inventory'
  | 'customer_management'
  | 'basic_reports'
  | 'basic_dashboard'
  | 'basic_staff'
  | 'language_en'
  | 'advanced_inventory'
  | 'customer_khata'
  | 'purchase_orders'
  | 'supplier_management'
  | 'expense_management'
  | 'advanced_analytics'
  | 'multi_outlet'
  | 'advanced_permissions'
  | 'languages_ml_ar'
  | 'priority_support'
  | 'fleet_management'
  | 'enterprise_analytics'
  | 'dedicated_db'
  | 'custom_domain'
  | 'franchise_management'
  | 'enterprise_api'
  | 'custom_integrations'
  | 'on_premise_support';

export interface FeatureDefinition {
  key: FeatureKey;
  name: string;
  label?: string;
  category: 'Checkout' | 'Inventory' | 'Billing' | 'CRM' | 'Purchasing' | 'Finance' | 'Reports' | 'Outlets' | 'Staff' | 'Localization' | 'Enterprise' | 'Support' | 'Operations';
  minPlan: 'Starter' | 'Professional' | 'Enterprise';
  description: string;
}

export const FEATURE_REGISTRY: Record<FeatureKey, FeatureDefinition> = {
  pos_billing: {
    key: 'pos_billing',
    name: 'POS Billing & Register',
    category: 'Checkout',
    minPlan: 'Starter',
    description: 'High-speed barcode scanning, cart calculation, discounts, and split checkout.',
  },
  offline_billing: {
    key: 'offline_billing',
    name: 'Offline Billing Mode',
    category: 'Checkout',
    minPlan: 'Starter',
    description: 'Autonomous client-side billing that queues transactions when internet drops.',
  },
  barcode_studio: {
    key: 'barcode_studio',
    name: 'Barcode Studio',
    category: 'Inventory',
    minPlan: 'Starter',
    description: 'Generate and print EAN-13, Code-128 and QR labels in thermal sizes.',
  },
  thermal_receipts: {
    key: 'thermal_receipts',
    name: '80mm Thermal Receipts',
    category: 'Billing',
    minPlan: 'Starter',
    description: 'Standard 80mm ESC/POS thermal invoice layouts and receipt printing.',
  },
  product_management: {
    key: 'product_management',
    name: 'Product Management',
    category: 'Inventory',
    minPlan: 'Starter',
    description: 'Standard product catalog, pricing, cost, tax rate, and MRP setup.',
  },
  basic_inventory: {
    key: 'basic_inventory',
    name: 'Basic Stock Tracking',
    category: 'Inventory',
    minPlan: 'Starter',
    description: 'Real-time stock deduction on checkout and low-stock warning indicators.',
  },
  customer_management: {
    key: 'customer_management',
    name: 'Customer Directory',
    category: 'CRM',
    minPlan: 'Starter',
    description: 'Store phone numbers, customer profiles, and basic purchase histories.',
  },
  basic_reports: {
    key: 'basic_reports',
    name: 'Basic Sales Reports',
    category: 'Reports',
    minPlan: 'Starter',
    description: 'Daily gross revenue, bill count, top products sold, and cash summary.',
  },
  basic_dashboard: {
    key: 'basic_dashboard',
    name: 'Store Dashboard',
    category: 'Operations',
    minPlan: 'Starter',
    description: 'Core retail dashboard with key performance indicators and alerts.',
  },
  basic_staff: {
    key: 'basic_staff',
    name: 'Staff Account Management',
    category: 'Staff',
    minPlan: 'Starter',
    description: 'Create and manage cashier and manager logins with secure PIN codes.',
  },
  language_en: {
    key: 'language_en',
    name: 'English Interface',
    category: 'Localization',
    minPlan: 'Starter',
    description: 'Standard English interface across the store OS and POS.',
  },

  // Professional Features
  advanced_inventory: {
    key: 'advanced_inventory',
    name: 'Advanced Inventory & Batching',
    category: 'Inventory',
    minPlan: 'Professional',
    description: 'Damage adjustments, bulk reordering, multi-variant tracking, and stock audits.',
  },
  customer_khata: {
    key: 'customer_khata',
    name: 'Customer Khata & Credit Ledger',
    category: 'CRM',
    minPlan: 'Professional',
    description: 'Store credit accounts, credit limits, khata ledger transactions, and payment tracking.',
  },
  purchase_orders: {
    key: 'purchase_orders',
    name: 'Purchase Orders & Restock',
    category: 'Purchasing',
    minPlan: 'Professional',
    description: 'Create purchase orders, receive supplier shipments, and auto-update stock.',
  },
  supplier_management: {
    key: 'supplier_management',
    name: 'Advanced Supplier Management',
    category: 'Purchasing',
    minPlan: 'Professional',
    description: 'Supplier directory, GSTIN records, payment terms (Net-30/COD), and vendor balances.',
  },
  expense_management: {
    key: 'expense_management',
    name: 'Store Expense Tracking',
    category: 'Finance',
    minPlan: 'Professional',
    description: 'Track store cash expenses (cleaning, tea, maintenance) directly from cashier register.',
  },
  advanced_analytics: {
    key: 'advanced_analytics',
    name: 'Advanced Sales Analytics & Profit Margins',
    category: 'Reports',
    minPlan: 'Professional',
    description: 'Gross profit margins, hourly traffic heatmaps, basket affinity pairings, and trends.',
  },
  multi_outlet: {
    key: 'multi_outlet',
    name: 'Multi-Outlet Management',
    category: 'Outlets',
    minPlan: 'Professional',
    description: 'Manage multiple branches, switch outlet context, and view consolidated reports.',
  },
  advanced_permissions: {
    key: 'advanced_permissions',
    name: 'Advanced Staff Permissions',
    category: 'Staff',
    minPlan: 'Professional',
    description: 'Granular permissions for cashier discounts, stock modification, and reports access.',
  },
  languages_ml_ar: {
    key: 'languages_ml_ar',
    name: 'Malayalam & Arabic Languages',
    category: 'Localization',
    minPlan: 'Professional',
    description: 'Full multi-lingual interface in Malayalam and Arabic with RTL layout.',
  },
  priority_support: {
    key: 'priority_support',
    name: 'Priority Support',
    category: 'Support',
    minPlan: 'Professional',
    description: 'Priority email and fast-track ticketing support from the OURSELL team.',
  },

  // Enterprise Features
  fleet_management: {
    key: 'fleet_management',
    name: 'Centralized Enterprise Fleet Management',
    category: 'Enterprise',
    minPlan: 'Enterprise',
    description: 'Centralized network view of all chain locations, real-time sync, and remote terminal telemetry.',
  },
  enterprise_analytics: {
    key: 'enterprise_analytics',
    name: 'Enterprise Fleet Analytics',
    category: 'Enterprise',
    minPlan: 'Enterprise',
    description: 'Cross-chain performance comparisons, regional sales metrics, and executive rollups.',
  },
  dedicated_db: {
    key: 'dedicated_db',
    name: 'Dedicated Database Isolation',
    category: 'Enterprise',
    minPlan: 'Enterprise',
    description: 'Physical or virtual dedicated database schema with tenant isolation and custom retention.',
  },
  custom_domain: {
    key: 'custom_domain',
    name: 'Custom Domain Mapping',
    category: 'Enterprise',
    minPlan: 'Enterprise',
    description: 'Run your store on your own branded domain (e.g., pos.yourbrand.com) with SSL.',
  },
  franchise_management: {
    key: 'franchise_management',
    name: 'Franchise Management & Royalty Tracking',
    category: 'Enterprise',
    minPlan: 'Enterprise',
    description: 'Manage franchisee agreements, royalty percentages, and brand compliance.',
  },
  enterprise_api: {
    key: 'enterprise_api',
    name: 'Enterprise REST API Access',
    category: 'Enterprise',
    minPlan: 'Enterprise',
    description: 'Direct API keys and webhook streams for ERP, SAP, and custom eCommerce synchronization.',
  },
  custom_integrations: {
    key: 'custom_integrations',
    name: 'Custom Integrations & Hardware',
    category: 'Enterprise',
    minPlan: 'Enterprise',
    description: 'Dedicated integrations for automated weighing scales, RFID, and specialized ERPs.',
  },
  on_premise_support: {
    key: 'on_premise_support',
    name: '24/7 SLA & On-Premise Support',
    category: 'Enterprise',
    minPlan: 'Enterprise',
    description: '24/7 round-the-clock telephone and on-premise technician support.',
  },
};

export interface PlanLimits {
  staff: number;
  outlets: number | null; // null = Unlimited
  terminals: number | null; // null = Unlimited
  products: number | null; // null = Unlimited
}

export const DEFAULT_PLAN_LIMITS: Record<PlanId, PlanLimits> = {
  starter: {
    staff: 1,
    outlets: 1,
    terminals: 2,
    products: 1000,
  },
  professional: {
    staff: 3,
    outlets: 3,
    terminals: 6,
    products: null, // Unlimited
  },
  enterprise: {
    staff: 5, // STRICT ENTERPRISE STAFF LIMIT IS 5
    outlets: null, // Unlimited
    terminals: null, // Unlimited
    products: null, // Unlimited
  },
};

export const PLAN_PRICING: Record<PlanId, { monthly: number; annual: number; name: string }> = {
  starter: {
    monthly: 0,
    annual: 0,
    name: 'Starter',
  },
  professional: {
    monthly: 799,
    annual: 7990,
    name: 'Professional',
  },
  enterprise: {
    monthly: 3299,
    annual: 32990,
    name: 'Multi-Chain Enterprise',
  },
};

/**
 * Normalizes any string plan name / tier to standard PlanId
 */
export function normalizePlanId(planInput: string | null | undefined): PlanId {
  if (!planInput) return 'starter';
  const clean = planInput.trim().toLowerCase();
  if (clean.includes('enterprise') || clean === 'ent') return 'enterprise';
  if (clean.includes('pro') || clean === 'professional') return 'professional';
  return 'starter';
}

/**
 * Normalizes plan ID to display name
 */
export function getPlanDisplayName(planId: PlanId | string): string {
  const norm = normalizePlanId(planId);
  if (norm === 'enterprise') return 'Multi-Chain Enterprise';
  if (norm === 'professional') return 'Professional';
  return 'Starter';
}

/**
 * Determines whether a given plan ID has access to a specific feature key.
 */
export function hasFeatureAccess(
  planInput: string | null | undefined,
  featureKey: FeatureKey,
  dynamicOverrides?: Record<string, boolean>
): boolean {
  // If a dynamic override from Supabase plan_features exists, respect it
  if (dynamicOverrides && typeof dynamicOverrides[featureKey] === 'boolean') {
    return dynamicOverrides[featureKey];
  }

  const planId = normalizePlanId(planInput);
  const def = FEATURE_REGISTRY[featureKey];
  if (!def) return false;

  if (def.minPlan === 'Starter') {
    return true; // Included in all plans
  }

  if (def.minPlan === 'Professional') {
    return planId === 'professional' || planId === 'enterprise';
  }

  if (def.minPlan === 'Enterprise') {
    return planId === 'enterprise';
  }

  return false;
}

/**
 * Returns the resource limits for a given plan.
 */
export function getPlanLimits(planInput: string | null | undefined): PlanLimits {
  const planId = normalizePlanId(planInput);
  return DEFAULT_PLAN_LIMITS[planId];
}

/**
 * Verifies if adding another staff account is permitted under current active plan.
 */
export function canAddStaff(currentCount: number, planInput: string | null | undefined): {
  allowed: boolean;
  limit: number;
  current: number;
  planName: string;
} {
  const planId = normalizePlanId(planInput);
  const limit = DEFAULT_PLAN_LIMITS[planId].staff;
  return {
    allowed: currentCount < limit,
    limit,
    current: currentCount,
    planName: getPlanDisplayName(planId),
  };
}

/**
 * Verifies if adding another outlet is permitted under current active plan.
 */
export function canAddOutlet(currentCount: number, planInput: string | null | undefined): {
  allowed: boolean;
  limit: number | null;
  current: number;
  planName: string;
} {
  const planId = normalizePlanId(planInput);
  const limit = DEFAULT_PLAN_LIMITS[planId].outlets;
  return {
    allowed: limit === null ? true : currentCount < limit,
    limit,
    current: currentCount,
    planName: getPlanDisplayName(planId),
  };
}

/**
 * Verifies if adding another terminal is permitted under current active plan.
 */
export function canAddTerminal(currentCount: number, planInput: string | null | undefined): {
  allowed: boolean;
  limit: number | null;
  current: number;
  planName: string;
} {
  const planId = normalizePlanId(planInput);
  const limit = DEFAULT_PLAN_LIMITS[planId].terminals;
  return {
    allowed: limit === null ? true : currentCount < limit,
    limit,
    current: currentCount,
    planName: getPlanDisplayName(planId),
  };
}

/**
 * Verifies if adding another product is permitted under current active plan.
 */
export function canAddProduct(currentCount: number, planInput: string | null | undefined): {
  allowed: boolean;
  limit: number | null;
  current: number;
  planName: string;
} {
  const planId = normalizePlanId(planInput);
  const limit = DEFAULT_PLAN_LIMITS[planId].products;
  return {
    allowed: limit === null ? true : currentCount < limit,
    limit,
    current: currentCount,
    planName: getPlanDisplayName(planId),
  };
}

/**
 * Verifies whether language is permitted under current active plan.
 * Starter: only 'en'
 * Professional & Enterprise: 'en', 'ml', 'ar'
 */
export function isLanguageAllowed(
  lang: string,
  planInput: string | null | undefined
): { allowed: boolean; requiredPlan: 'Starter' | 'Professional' | 'Enterprise' } {
  if (lang === 'en') {
    return { allowed: true, requiredPlan: 'Starter' };
  }
  const planId = normalizePlanId(planInput);
  const allowed = planId === 'professional' || planId === 'enterprise';
  return {
    allowed,
    requiredPlan: 'Professional',
  };
}

/**
 * Validates whether a store or subscription record belongs to a legitimate real merchant store
 * (as opposed to internal devcore root admin node, mock demo stores, or sample retail fixtures).
 */
export function isRealStore(store: {
  storeId?: string | null;
  brandId?: string | null;
  slug?: string | null;
  name?: string | null;
  storeName?: string | null;
  brandName?: string | null;
}): boolean {
  if (!store) return false;
  const id = (store.storeId || store.brandId || store.slug || '').trim().toLowerCase();
  const name = (store.name || store.storeName || store.brandName || '').trim().toLowerCase();

  // DevCore system admin node
  if (id === 'devcore' || id === 'brand-devcore-node' || name.includes('dev core')) return false;

  // Known demo/mock store slugs and handles
  if (['oursell', 'resell', 'demo', 'centralmart'].includes(id)) return false;
  if (id.startsWith('demo-') || id.startsWith('test-')) return false;

  // Demo store names and sample titles
  if (
    name.includes('demo store') ||
    name.includes('retail flagship') ||
    name.includes('fashion boutique') ||
    name.includes('fashion store') ||
    name.includes('sample store')
  ) {
    return false;
  }

  return true;
}
