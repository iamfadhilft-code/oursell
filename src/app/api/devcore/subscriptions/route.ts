import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { normalizePlanId, DEFAULT_PLAN_LIMITS, PLAN_PRICING, getPlanDisplayName, isRealStore } from '@/lib/planAccess';
import { resolveStoreBusiness } from '@/lib/supabase/storeResolver';

/**
 * GET: Retrieve all subscribed stores with live usage and subscription status for Dev Core Super Admin
 */
export async function GET() {
  try {
    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Database unavailable' }, { status: 503 });
    }

    // Fetch all businesses with subscriptions
    const { data: businesses, error: bError } = await (supabase as any)
      .from('businesses')
      .select('id, slug, name, owner_name, contact_email, is_active, created_at')
      .order('created_at', { ascending: false });

    if (bError) {
      return NextResponse.json({ success: false, error: bError.message }, { status: 500 });
    }

    const { data: subs } = await (supabase as any)
      .from('subscriptions')
      .select('*');

    const subsMap = new Map<string, any>((subs || []).map((s: any) => [s.business_id, s]));

    // Filter strictly for active real merchant stores (excluding demo/mock environments)
    const realBusinesses = (businesses || []).filter(
      (biz: any) =>
        biz.is_active !== false &&
        isRealStore({
          slug: biz.slug,
          name: biz.name,
        })
    );

    // Fetch live usage counts for each real business
    const storeUsageList = await Promise.all(
      realBusinesses.map(async (biz: any) => {
        const sub = subsMap.get(biz.id);
        const planId = normalizePlanId(sub?.plan_id || sub?.plan_tier);
        const defaultLimits = DEFAULT_PLAN_LIMITS[planId];

        const staffLimit = sub?.staff_limit ?? defaultLimits.staff;
        const outletLimit = sub?.outlet_limit !== undefined ? sub.outlet_limit : defaultLimits.outlets;
        const terminalLimit = sub?.terminal_limit !== undefined ? sub.terminal_limit : defaultLimits.terminals;
        const productLimit = sub?.product_limit !== undefined ? sub.product_limit : defaultLimits.products;

        const [staffRes, outletRes, terminalRes, productRes] = await Promise.all([
          (supabase as any)
            .from('staff_records')
            .select('id', { count: 'exact', head: true })
            .eq('business_id', biz.id)
            .eq('is_active', true),
          (supabase as any)
            .from('outlets')
            .select('id', { count: 'exact', head: true })
            .eq('business_id', biz.id)
            .eq('is_active', true),
          (supabase as any)
            .from('pos_terminals')
            .select('id', { count: 'exact', head: true })
            .eq('business_id', biz.id)
            .eq('is_active', true),
          (supabase as any)
            .from('products')
            .select('id', { count: 'exact', head: true })
            .eq('business_id', biz.id)
            .eq('is_active', true),
        ]);

        return {
          id: sub?.id || `sub-${biz.id}`,
          storeId: biz.slug,
          storeName: biz.name,
          ownerName: biz.owner_name,
          email: biz.contact_email,
          businessId: biz.id,
          planId,
          plan: getPlanDisplayName(planId),
          status: sub?.status || 'ACTIVE',
          billingCycle: sub?.billing_cycle || 'MONTHLY',
          monthlyPrice: sub?.monthly_price ? Number(sub.monthly_price) : PLAN_PRICING[planId].monthly,
          annualPrice: sub?.annual_price ? Number(sub.annual_price) : PLAN_PRICING[planId].annual,
          currentPeriodEnd: sub?.current_period_end || null,
          staffLimit,
          outletLimit,
          terminalLimit,
          productLimit,
          usage: {
            staff: staffRes.count || 0,
            outlets: outletRes.count || 0,
            terminals: terminalRes.count || 0,
            products: productRes.count || 0,
          },
        };
      })
    );

    return NextResponse.json({
      success: true,
      subscriptions: storeUsageList,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

/**
 * PUT: Super Admin manually modifies a store subscription with audit logging
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      businessId,
      storeId,
      planId,
      status,
      billingCycle,
      staffLimit,
      outletLimit,
      terminalLimit,
      productLimit,
      actor = 'Dev Core Super Admin',
      reason = 'Manual administrative plan change',
    } = body;

    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Database unavailable' }, { status: 503 });
    }

    // Resolve business
    let targetBizId = businessId;
    if (!targetBizId && storeId) {
      const b = await resolveStoreBusiness(supabase, storeId);
      if (b) targetBizId = b.id;
    }

    if (!targetBizId) {
      return NextResponse.json({ success: false, error: 'Business ID or Store ID is required' }, { status: 400 });
    }

    const { data: currentSub } = await (supabase as any)
      .from('subscriptions')
      .select('*')
      .eq('business_id', targetBizId)
      .maybeSingle();

    const targetPlan = normalizePlanId(planId || currentSub?.plan_id || 'starter');
    const defaultLimits = DEFAULT_PLAN_LIMITS[targetPlan];
    const pricing = PLAN_PRICING[targetPlan];

    const planTierDb = targetPlan === 'enterprise' ? 'Enterprise' : targetPlan === 'professional' ? 'Professional' : 'Starter';

    const updatePayload: Record<string, any> = {
      plan_tier: planTierDb,
      plan_id: targetPlan,
      status: status || currentSub?.status || 'ACTIVE',
      billing_cycle: billingCycle || currentSub?.billing_cycle || 'MONTHLY',
      monthly_price: pricing.monthly,
      annual_price: pricing.annual,
      staff_limit: staffLimit !== undefined ? Number(staffLimit) : defaultLimits.staff,
      outlet_limit: outletLimit !== undefined ? (outletLimit === null || outletLimit === 'UNLIMITED' ? null : Number(outletLimit)) : defaultLimits.outlets,
      terminal_limit: terminalLimit !== undefined ? (terminalLimit === null || terminalLimit === 'UNLIMITED' ? null : Number(terminalLimit)) : defaultLimits.terminals,
      product_limit: productLimit !== undefined ? (productLimit === null || productLimit === 'UNLIMITED' ? null : Number(productLimit)) : defaultLimits.products,
      updated_at: new Date().toISOString(),
    };

    const { data: updatedSub, error: subErr } = await (supabase as any)
      .from('subscriptions')
      .upsert({
        business_id: targetBizId,
        ...updatePayload,
      }, { onConflict: 'business_id' })
      .select()
      .single();

    if (subErr) {
      return NextResponse.json({ success: false, error: subErr.message }, { status: 400 });
    }

    // 1. Audit in subscription_events
    await (supabase as any).from('subscription_events').insert({
      business_id: targetBizId,
      event_type: 'MANUAL_OVERRIDE',
      old_plan_id: currentSub?.plan_id || 'starter',
      new_plan_id: targetPlan,
      actor,
      actor_role: 'SUPER_ADMIN',
      reason,
      metadata: updatePayload,
    });

    // 2. Audit in dev_core_audit_logs
    await (supabase as any).from('dev_core_audit_logs').insert({
      actor,
      actor_role: 'SUPER_ADMIN',
      action: 'MODIFY_STORE_SUBSCRIPTION',
      target_entity: 'subscriptions',
      details: {
        business_id: targetBizId,
        store_id: storeId,
        new_plan: targetPlan,
        reason,
        changes: updatePayload,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Store subscription successfully updated to ${getPlanDisplayName(targetPlan)}.`,
      subscription: updatedSub,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
