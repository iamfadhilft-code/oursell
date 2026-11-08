import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { normalizePlanId, DEFAULT_PLAN_LIMITS, PLAN_PRICING, getPlanDisplayName } from '@/lib/planAccess';
import { resolveStoreBusiness } from '@/lib/supabase/storeResolver';

/**
 * GET: Retrieve store subscription details and history
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId') || searchParams.get('storeSlug') || 'oursell';
    const storeSlugParam = searchParams.get('storeSlug') || undefined;

    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Database unavailable' }, { status: 503 });
    }

    const business = await resolveStoreBusiness(supabase, storeId, storeSlugParam);

    if (!business) {
      return NextResponse.json({ success: false, error: `Store "${storeId}" not found` }, { status: 404 });
    }

    const { data: sub } = await (supabase as any)
      .from('subscriptions')
      .select('*')
      .eq('business_id', business.id)
      .maybeSingle();

    const { data: events } = await (supabase as any)
      .from('subscription_events')
      .select('*')
      .eq('business_id', business.id)
      .order('created_at', { ascending: false })
      .limit(20);

    const planId = normalizePlanId(sub?.plan_id || sub?.plan_tier);

    return NextResponse.json({
      success: true,
      store: business,
      subscription: {
        ...sub,
        plan_id: planId,
        plan_name: getPlanDisplayName(planId),
      },
      events: events || [],
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

/**
 * POST: Upgrade / change store plan
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { storeId, storeSlug, targetPlanId, billingCycle = 'MONTHLY', actorName = 'Store Owner', reason } = body;

    if (!storeId || !targetPlanId) {
      return NextResponse.json({ success: false, error: 'Store ID and target plan required' }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Database unavailable' }, { status: 503 });
    }

    const targetPlan = normalizePlanId(targetPlanId);
    const business = await resolveStoreBusiness(supabase, storeId, storeSlug);

    if (!business) {
      return NextResponse.json({ success: false, error: 'Store not found' }, { status: 404 });
    }

    // Current sub
    const { data: currentSub } = await (supabase as any)
      .from('subscriptions')
      .select('*')
      .eq('business_id', business.id)
      .maybeSingle();

    const oldPlanId = currentSub?.plan_id || 'starter';
    const newLimits = DEFAULT_PLAN_LIMITS[targetPlan];
    const newPricing = PLAN_PRICING[targetPlan];

    const planTierDb = targetPlan === 'enterprise' ? 'Enterprise' : targetPlan === 'professional' ? 'Professional' : 'Starter';

    // Update subscription
    const { data: updatedSub, error: subError } = await (supabase as any)
      .from('subscriptions')
      .upsert({
        business_id: business.id,
        plan_tier: planTierDb,
        plan_id: targetPlan,
        status: 'ACTIVE',
        billing_cycle: billingCycle,
        monthly_price: newPricing.monthly,
        annual_price: newPricing.annual,
        staff_limit: newLimits.staff,
        outlet_limit: newLimits.outlets,
        terminal_limit: newLimits.terminals,
        product_limit: newLimits.products,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'business_id' })
      .select()
      .single();

    if (subError) {
      return NextResponse.json({ success: false, error: subError.message }, { status: 400 });
    }

    // Log subscription audit event
    await (supabase as any).from('subscription_events').insert({
      business_id: business.id,
      event_type: 'PLAN_CHANGE',
      old_plan_id: oldPlanId,
      new_plan_id: targetPlan,
      actor: actorName,
      actor_role: 'STORE_ADMIN',
      reason: reason || `Store changed plan to ${newPricing.name} (${billingCycle})`,
      metadata: {
        limits: newLimits,
        pricing: newPricing,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Plan successfully updated to ${newPricing.name}.`,
      subscription: updatedSub,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
