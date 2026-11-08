import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { FEATURE_REGISTRY } from '@/lib/planAccess';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET: Retrieve a single plan configuration with its enabled features
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const cleanId = id.trim().toLowerCase();

    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Database unavailable' }, { status: 503 });
    }

    const { data: plan, error } = await (supabase as any)
      .from('pricing_plans')
      .select('*')
      .eq('id', cleanId)
      .maybeSingle();

    if (error || !plan) {
      return NextResponse.json({ success: false, error: `Plan "${id}" not found` }, { status: 404 });
    }

    const { data: featureRows } = await (supabase as any)
      .from('plan_features')
      .select('feature_key, is_enabled')
      .eq('plan_id', cleanId);

    const featureMap: Record<string, boolean> = {};
    (featureRows || []).forEach((row: any) => {
      featureMap[row.feature_key] = row.is_enabled;
    });

    return NextResponse.json({
      success: true,
      plan: {
        id: plan.id,
        name: plan.name,
        badge: plan.badge,
        description: plan.description,
        monthlyPrice: Number(plan.monthly_price),
        annualPrice: Number(plan.annual_price),
        staffLimit: Number(plan.staff_limit),
        outletLimit: plan.outlet_limit === null ? null : Number(plan.outlet_limit),
        terminalLimit: plan.terminal_limit === null ? null : Number(plan.terminal_limit),
        productLimit: plan.product_limit === null ? null : Number(plan.product_limit),
        features: Array.isArray(plan.features) ? plan.features : JSON.parse(plan.features || '[]'),
        isActive: plan.is_active,
        sortOrder: plan.sort_order,
      },
      features: featureMap,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

/**
 * PUT: Super Admin update of global plan pricing, capacity limits, and features
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const cleanId = id.trim().toLowerCase();
    const body = await request.json();

    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Database unavailable' }, { status: 503 });
    }

    // Build update object for pricing_plans
    const planUpdates: any = {
      updated_at: new Date().toISOString(),
    };

    if (body.name !== undefined) planUpdates.name = body.name.trim();
    if (body.badge !== undefined) planUpdates.badge = body.badge ? body.badge.trim() : null;
    if (body.description !== undefined) planUpdates.description = body.description.trim();
    if (body.monthlyPrice !== undefined) planUpdates.monthly_price = Number(body.monthlyPrice);
    if (body.annualPrice !== undefined) planUpdates.annual_price = Number(body.annualPrice);
    if (body.staffLimit !== undefined) planUpdates.staff_limit = Number(body.staffLimit);
    if (body.outletLimit !== undefined) planUpdates.outlet_limit = body.outletLimit === null ? null : Number(body.outletLimit);
    if (body.terminalLimit !== undefined) planUpdates.terminal_limit = body.terminalLimit === null ? null : Number(body.terminalLimit);
    if (body.productLimit !== undefined) planUpdates.product_limit = body.productLimit === null ? null : Number(body.productLimit);
    if (body.features !== undefined) planUpdates.features = body.features;
    if (body.isActive !== undefined) planUpdates.is_active = Boolean(body.isActive);

    let { data: updatedPlan, error: pError } = await (supabase as any)
      .from('pricing_plans')
      .update(planUpdates)
      .eq('id', cleanId)
      .select()
      .maybeSingle();

    if (!updatedPlan && !pError) {
      // Row might not exist yet, do upsert
      const insertData = {
        id: cleanId,
        ...planUpdates,
        created_at: new Date().toISOString(),
      };
      const insRes = await (supabase as any)
        .from('pricing_plans')
        .upsert(insertData)
        .select()
        .single();
      updatedPlan = insRes.data;
      pError = insRes.error;
    }

    if (pError) {
      return NextResponse.json({ success: false, error: pError.message }, { status: 500 });
    }

    // Upsert individual feature toggles if passed
    if (body.featureToggles && typeof body.featureToggles === 'object') {
      for (const [featKey, isEnabled] of Object.entries(body.featureToggles)) {
        const meta = (FEATURE_REGISTRY as any)[featKey];
        await (supabase as any)
          .from('plan_features')
          .upsert(
            {
              plan_id: cleanId,
              feature_key: featKey,
              feature_name: meta?.name || featKey,
              category: meta?.category || 'General',
              is_enabled: Boolean(isEnabled),
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'plan_id,feature_key' }
          )
          .catch((e: any) => console.warn(`Feature toggle upsert failed for ${featKey}:`, e));
      }
    }

    // Cascade update limits to active store subscriptions on this plan
    const subLimitUpdates: any = {};
    if (body.staffLimit !== undefined) subLimitUpdates.staff_limit = Number(body.staffLimit);
    if (body.outletLimit !== undefined) subLimitUpdates.outlet_limit = body.outletLimit === null ? null : Number(body.outletLimit);
    if (body.terminalLimit !== undefined) subLimitUpdates.terminal_limit = body.terminalLimit === null ? null : Number(body.terminalLimit);
    if (body.productLimit !== undefined) subLimitUpdates.product_limit = body.productLimit === null ? null : Number(body.productLimit);

    if (Object.keys(subLimitUpdates).length > 0) {
      await (supabase as any)
        .from('subscriptions')
        .update(subLimitUpdates)
        .or(`plan_id.eq.${cleanId},plan_tier.ilike.%${cleanId}%`);
    }

    // Log super admin audit
    try {
      await (supabase as any).from('dev_core_audit_logs').insert({
        actor: 'Dev Core Super Admin',
        actor_role: 'SUPER_ADMIN',
        action: 'PLAN_CONFIGURATION_UPDATED',
        target_entity: 'PRICING_PLAN',
        details: {
          plan_id: cleanId,
          monthly_price: body.monthlyPrice,
          annual_price: body.annualPrice,
          staff_limit: body.staffLimit,
          outlet_limit: body.outletLimit,
          terminal_limit: body.terminalLimit,
          product_limit: body.productLimit,
          is_active: body.isActive,
          name: body.name,
        },
      });
    } catch (e) {
      console.warn('Audit log insert failed:', e);
    }

    return NextResponse.json({
      success: true,
      plan: {
        id: updatedPlan.id,
        name: updatedPlan.name,
        badge: updatedPlan.badge,
        description: updatedPlan.description,
        monthlyPrice: Number(updatedPlan.monthly_price),
        annualPrice: Number(updatedPlan.annual_price),
        staffLimit: Number(updatedPlan.staff_limit),
        outletLimit: updatedPlan.outlet_limit === null ? null : Number(updatedPlan.outlet_limit),
        terminalLimit: updatedPlan.terminal_limit === null ? null : Number(updatedPlan.terminal_limit),
        productLimit: updatedPlan.product_limit === null ? null : Number(updatedPlan.product_limit),
        features: Array.isArray(updatedPlan.features) ? updatedPlan.features : JSON.parse(updatedPlan.features || '[]'),
        isActive: updatedPlan.is_active,
        sortOrder: updatedPlan.sort_order,
        updatedAt: updatedPlan.updated_at,
      },
      message: `Plan "${cleanId}" updated successfully across database and connected stores.`,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
