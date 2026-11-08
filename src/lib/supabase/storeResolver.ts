import { SupabaseClient } from '@supabase/supabase-js';

export function isUuid(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str.trim());
}

export interface PlanLimitInfo {
  planTier: string;
  planId: string;
  staffLimit: number;
  outletLimit: number | null;
  terminalLimit: number | null;
  productLimit: number | null;
}

export interface ResolvedStoreInfo {
  businessId: string;
  storeSlug: string;
  storeName: string;
  limits: PlanLimitInfo;
}

export interface ResolveStoreOptions {
  fallbackSlug?: string;
  fallbackName?: string;
  autoProvision?: boolean;
}

/**
 * Safely queries the businesses table without triggering PostgreSQL 22P02 UUID syntax errors.
 */
export async function findBusinessRecord(
  supabase: SupabaseClient | any,
  identifier: string
) {
  if (!supabase || !identifier) return null;
  const clean = identifier.trim();
  if (!clean) return null;

  let query = supabase.from('businesses').select('*');
  if (isUuid(clean)) {
    query = query.eq('id', clean);
  } else {
    query = query.ilike('slug', clean);
  }

  const { data, error } = await query.maybeSingle();
  if (error || !data) return null;
  return data;
}

/**
 * Resolves a store business record using identifier, fallback slug, or brand code fallback.
 */
export async function resolveStoreBusiness(
  supabase: SupabaseClient | any,
  storeIdentifier: string,
  fallbackSlug?: string
) {
  if (!supabase || !storeIdentifier) return null;
  const clean = storeIdentifier.trim();
  if (!clean) return null;

  let business = await findBusinessRecord(supabase, clean);
  if (!business && fallbackSlug) {
    const fb = fallbackSlug.trim();
    if (fb && fb.toLowerCase() !== clean.toLowerCase()) {
      business = await findBusinessRecord(supabase, fb);
    }
  }
  if (!business && clean.toLowerCase().startsWith('brd-')) {
    business = await findBusinessRecord(supabase, 'oursell');
  }
  return business;
}

/**
 * Resolves a store's business record and subscription limits securely across multi-tenant identifiers.
 * Handles UUIDs, slugs (e.g. "oursell"), and brand codes (e.g. "BRD-9896").
 */
export async function resolveStoreBusinessAndSubscription(
  supabase: SupabaseClient | any,
  storeIdentifier: string,
  options?: ResolveStoreOptions
): Promise<ResolvedStoreInfo | null> {
  if (!supabase || !storeIdentifier) return null;

  const clean = storeIdentifier.trim();
  if (!clean) return null;

  // 1. Try finding business by primary identifier (UUID or slug)
  let business = await findBusinessRecord(supabase, clean);

  // 2. If not found, try fallbackSlug (e.g., if storeId is BRD-9896 and storeSlug is 'oursell')
  if (!business && options?.fallbackSlug) {
    const fb = options.fallbackSlug.trim();
    if (fb && fb.toLowerCase() !== clean.toLowerCase()) {
      business = await findBusinessRecord(supabase, fb);
    }
  }

  // 3. If still not found and clean looks like a brand code (e.g., BRD-9896), try checking 'oursell' fallback
  if (!business && clean.toLowerCase().startsWith('brd-')) {
    business = await findBusinessRecord(supabase, 'oursell');
  }

  // 4. If still not found and autoProvision is enabled (default true)
  if (!business && options?.autoProvision !== false) {
    const cleanSlug = clean.toLowerCase();
    const bizName = options?.fallbackName?.trim() || `Store ${clean.toUpperCase()}`;

    try {
      const { data: newBiz, error: createError } = await supabase
        .from('businesses')
        .insert({
          slug: cleanSlug,
          name: bizName,
          owner_name: 'Store Administrator',
          contact_email: `${cleanSlug}@oursell.app`,
          currency: '₹',
          tax_rate_default: 5.0,
          outlet_count: 1,
          terminal_count: 2,
          is_active: true,
          registration_status: 'ACTIVE',
        })
        .select('*')
        .maybeSingle();

      if (!createError && newBiz) {
        business = newBiz;

        // Seed default active starter subscription
        await supabase.from('subscriptions').insert({
          business_id: newBiz.id,
          plan_tier: 'Starter',
          plan_id: 'starter',
          status: 'ACTIVE',
          billing_cycle: 'MONTHLY',
          monthly_price: 0,
          staff_limit: 3,
          outlet_limit: 2,
          terminal_limit: 4,
          product_limit: 1000,
        });
      }
    } catch (provisionErr) {
      console.warn('Auto-provisioning business notice:', provisionErr);
    }
  }

  if (!business) {
    return null;
  }

  // 5. Resolve active subscription
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('plan_tier, plan_id, staff_limit, outlet_limit, terminal_limit, product_limit, status')
    .eq('business_id', business.id)
    .eq('status', 'ACTIVE')
    .maybeSingle();

  let staffLimit = sub?.staff_limit;
  let planTier = sub?.plan_tier || 'Starter';
  let planId = sub?.plan_id || 'starter';

  if (!staffLimit) {
    const { data: planConfig } = await supabase
      .from('pricing_plans')
      .select('name, staff_limit, outlet_limit, terminal_limit, product_limit')
      .or(`id.eq.${planId},name.ilike.${planTier}`)
      .maybeSingle();

    if (planConfig) {
      staffLimit = planConfig.staff_limit;
      planTier = planConfig.name;
    } else {
      const lower = planTier.toLowerCase();
      staffLimit = lower.includes('enterprise') ? 5 : lower.includes('pro') ? 3 : 1;
    }
  }

  return {
    businessId: business.id,
    storeSlug: business.slug,
    storeName: business.name,
    limits: {
      planTier,
      planId,
      staffLimit: Number(staffLimit),
      outletLimit: sub?.outlet_limit ?? null,
      terminalLimit: sub?.terminal_limit ?? null,
      productLimit: sub?.product_limit ?? null,
    },
  };
}
