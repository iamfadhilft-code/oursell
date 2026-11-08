'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePosStore } from '@/store/usePosStore';
import { useBrandAuthStore } from '@/store/useBrandAuthStore';
import { db } from '@/db/posDb';
import {
  PlanId,
  FeatureKey,
  FEATURE_REGISTRY,
  DEFAULT_PLAN_LIMITS,
  PLAN_PRICING,
  normalizePlanId,
  getPlanDisplayName,
  hasFeatureAccess,
  isLanguageAllowed,
  isRealStore,
} from '@/lib/planAccess';

export interface PlanUsageState {
  staff: { used: number; limit: number; remaining: number; isExceeded: boolean };
  outlets: { used: number; limit: number | null; remaining: number | null; isExceeded: boolean };
  terminals: { used: number; limit: number | null; remaining: number | null; isExceeded: boolean };
  products: { used: number; limit: number | null; remaining: number | null; isExceeded: boolean };
}

export function usePlanAccess(targetStoreSlug?: string) {
  const { activeBrandId } = usePosStore();
  const { currentBrand } = useBrandAuthStore();

  const storeSlug = targetStoreSlug || currentBrand?.brandId || activeBrandId || 'oursell';

  const [planId, setPlanId] = useState<PlanId>('starter');
  const [planName, setPlanName] = useState<string>('Starter');
  const [monthlyPrice, setMonthlyPrice] = useState<number>(0);
  const [annualPrice, setAnnualPrice] = useState<number>(0);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>('ACTIVE');
  const [renewalDate, setRenewalDate] = useState<string | null>(null);

  const [limits, setLimits] = useState<{
    staff: number;
    outlets: number | null;
    terminals: number | null;
    products: number | null;
  }>(DEFAULT_PLAN_LIMITS.starter);

  const [usage, setUsage] = useState<PlanUsageState>({
    staff: { used: 0, limit: 1, remaining: 1, isExceeded: false },
    outlets: { used: 0, limit: 1, remaining: 1, isExceeded: false },
    terminals: { used: 0, limit: 2, remaining: 2, isExceeded: false },
    products: { used: 0, limit: 1000, remaining: 1000, isExceeded: false },
  });

  const [dynamicFeatureOverrides, setDynamicFeatureOverrides] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchPlanData = useCallback(async () => {
    if (!storeSlug) return;
    setIsLoading(true);

    try {
      // 1. First check local Dexie db for offline responsiveness
      const localSub = await db.store_subscriptions
        .where('storeId')
        .equals(storeSlug)
        .first()
        .catch(() => null);

      if (localSub) {
        const localNorm = normalizePlanId(localSub.plan);
        const lLimits = DEFAULT_PLAN_LIMITS[localNorm];
        setPlanId(localNorm);
        setPlanName(getPlanDisplayName(localNorm));
        setMonthlyPrice(localSub.amount || PLAN_PRICING[localNorm].monthly);
        setLimits({
          staff: localSub.staffLimit ?? lLimits.staff,
          outlets: localSub.outletLimit !== undefined ? localSub.outletLimit : lLimits.outlets,
          terminals: localSub.terminalLimit !== undefined ? localSub.terminalLimit : lLimits.terminals,
          products: localSub.productLimit !== undefined ? localSub.productLimit : lLimits.products,
        });
      }

      // 2. Fetch authoritative live verified plan & usage from API
      const res = await fetch(`/api/store/plan?storeId=${encodeURIComponent(storeSlug)}`);
      const data = await res.json();

      if (data.success && data.plan) {
        const livePlanId = normalizePlanId(data.plan.id);
        setPlanId(livePlanId);
        setPlanName(data.plan.tier || getPlanDisplayName(livePlanId));
        setMonthlyPrice(data.plan.monthlyPrice);
        setAnnualPrice(data.plan.annualPrice);
        setSubscriptionStatus(data.plan.status);
        setRenewalDate(data.plan.currentPeriodEnd);
        setLimits(data.plan.limits);

        if (data.usage) {
          setUsage(data.usage);
        }

        if (data.features) {
          setDynamicFeatureOverrides(data.features);
        }

        // Keep local Dexie synchronized only for legitimate real stores
        const isReal = isRealStore({ storeId: storeSlug, storeName: data.store?.name });
        if (isReal) {
          const canonicalId = `sub-${storeSlug.trim().toLowerCase()}`;
          await db.store_subscriptions.put({
            id: canonicalId,
            storeId: storeSlug,
            storeName: data.store?.name || storeSlug,
            plan: livePlanId === 'enterprise' ? 'Enterprise' : livePlanId === 'professional' ? 'Professional' : 'Starter',
            billingCycle: data.plan.billingCycle || 'MONTHLY',
            amount: data.plan.monthlyPrice,
            annualPrice: data.plan.annualPrice,
            currency: data.store?.currency || '₹',
            status: data.plan.status,
            startDate: new Date().toISOString(),
            nextBillingDate: data.plan.currentPeriodEnd || new Date(Date.now() + 30 * 86400000).toISOString(),
            paymentMethod: 'Prepaid Cloud',
            autoRenew: true,
            staffLimit: data.plan.limits.staff,
            outletLimit: data.plan.limits.outlets,
            terminalLimit: data.plan.limits.terminals,
            productLimit: data.plan.limits.products,
          }).catch(() => {});
        }
      }
    } catch (err) {
      console.warn('Failed to fetch verified store plan from API, using defaults:', err);
    } finally {
      setIsLoading(false);
    }
  }, [storeSlug]);

  useEffect(() => {
    fetchPlanData();
  }, [fetchPlanData]);

  /**
   * Checks whether a feature is permitted under the active subscription
   */
  const checkFeature = useCallback(
    (featureKey: FeatureKey) => {
      const def = FEATURE_REGISTRY[featureKey];
      const allowed = hasFeatureAccess(planId, featureKey, dynamicFeatureOverrides);
      return {
        allowed,
        minPlan: def?.minPlan || 'Starter',
        feature: def,
      };
    },
    [planId, dynamicFeatureOverrides]
  );

  /**
   * Checks if a resource can be added without exceeding the subscription limit
   */
  const canAddResource = useCallback(
    (resource: 'staff' | 'outlet' | 'terminal' | 'product') => {
      if (resource === 'staff') {
        const cur = usage.staff.used;
        const lim = limits.staff;
        return {
          allowed: cur < lim,
          current: cur,
          limit: lim,
          reason: cur >= lim ? `Staff limit reached for current ${planName} plan (${lim} staff max).` : undefined,
        };
      }
      if (resource === 'outlet') {
        const cur = usage.outlets.used;
        const lim = limits.outlets;
        const allowed = lim === null ? true : cur < lim;
        return {
          allowed,
          current: cur,
          limit: lim,
          reason: !allowed ? `Outlet limit reached for current ${planName} plan (${lim} outlet max).` : undefined,
        };
      }
      if (resource === 'terminal') {
        const cur = usage.terminals.used;
        const lim = limits.terminals;
        const allowed = lim === null ? true : cur < lim;
        return {
          allowed,
          current: cur,
          limit: lim,
          reason: !allowed ? `Terminal limit reached for current ${planName} plan (${lim} terminals max).` : undefined,
        };
      }
      if (resource === 'product') {
        const cur = usage.products.used;
        const lim = limits.products;
        const allowed = lim === null ? true : cur < lim;
        return {
          allowed,
          current: cur,
          limit: lim,
          reason: !allowed ? `Product catalog limit reached for current ${planName} plan (${lim} products max).` : undefined,
        };
      }
      return { allowed: true, current: 0, limit: null };
    },
    [usage, limits, planName]
  );

  /**
   * Checks whether a language is permitted (Starter: 'en' only; Pro & Ent: 'en', 'ml', 'ar')
   */
  const checkLanguage = useCallback(
    (lang: string) => {
      return isLanguageAllowed(lang, planId);
    },
    [planId]
  );

  const hasAccess = useCallback(
    (featureKey: FeatureKey) => {
      return hasFeatureAccess(planId, featureKey, dynamicFeatureOverrides);
    },
    [planId, dynamicFeatureOverrides]
  );

  return {
    storeSlug,
    planId,
    planName,
    monthlyPrice,
    annualPrice,
    subscriptionStatus,
    renewalDate,
    limits,
    usage,
    isLoading,
    refreshPlan: fetchPlanData,
    refetchPlan: fetchPlanData,
    checkFeature,
    hasAccess,
    canAddResource,
    checkLanguage,
  };
}
