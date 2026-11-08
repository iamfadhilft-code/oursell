import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { normalizePlanId, DEFAULT_PLAN_LIMITS, getPlanDisplayName } from '@/lib/planAccess';
import { resolveStoreBusiness } from '@/lib/supabase/storeResolver';

/**
 * Resolves business and active subscription limits for outlets
 */
async function resolveStore(supabase: ReturnType<typeof getSupabaseServerClient>, storeId: string, fallbackSlug?: string) {
  if (!supabase || !storeId) return null;

  const business = await resolveStoreBusiness(supabase, storeId, fallbackSlug);
  if (!business) return null;

  const { data: sub } = await (supabase as any)
    .from('subscriptions')
    .select('plan_id, plan_tier, outlet_limit, status')
    .eq('business_id', business.id)
    .eq('status', 'ACTIVE')
    .maybeSingle();

  const planId = normalizePlanId(sub?.plan_id || sub?.plan_tier);
  const outletLimit = sub?.outlet_limit !== undefined ? sub.outlet_limit : DEFAULT_PLAN_LIMITS[planId].outlets;

  return {
    businessId: business.id,
    storeSlug: business.slug,
    planId,
    planName: getPlanDisplayName(planId),
    outletLimit,
  };
}

/**
 * GET: Retrieve store outlets
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

    const storeInfo = await resolveStore(supabase, storeId, storeSlugParam);
    if (!storeInfo) {
      return NextResponse.json({ success: false, error: `Store "${storeId}" not found` }, { status: 404 });
    }

    const { data: outlets, error } = await (supabase as any)
      .from('outlets')
      .select('*')
      .eq('business_id', storeInfo.businessId)
      .order('created_at', { ascending: true });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const activeCount = (outlets || []).filter((o: any) => o.is_active).length;

    return NextResponse.json({
      success: true,
      storeId: storeInfo.storeSlug,
      planName: storeInfo.planName,
      outletLimit: storeInfo.outletLimit,
      currentCount: activeCount,
      isLimitReached: storeInfo.outletLimit !== null && activeCount >= storeInfo.outletLimit,
      outlets: outlets || [],
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

/**
 * POST: Create an outlet with strict plan limit enforcement
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { storeId, storeSlug, name, code, address, phone, managerName, isPrimary = false } = body;

    if (!storeId || !name) {
      return NextResponse.json({ success: false, error: 'Store ID and outlet name are required.' }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Database unavailable' }, { status: 503 });
    }

    const storeInfo = await resolveStore(supabase, storeId, storeSlug);
    if (!storeInfo) {
      return NextResponse.json({ success: false, error: `Store "${storeId}" not found` }, { status: 404 });
    }

    const { businessId, outletLimit, planName } = storeInfo;

    // 1. Check current outlet count vs limit
    const { count, error: countErr } = await (supabase as any)
      .from('outlets')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', businessId)
      .eq('is_active', true);

    if (countErr) {
      return NextResponse.json({ success: false, error: countErr.message }, { status: 500 });
    }

    const currentCount = count || 0;

    if (outletLimit !== null && currentCount >= outletLimit) {
      return NextResponse.json(
        {
          success: false,
          error: `Outlet limit reached for current ${planName} plan (${outletLimit} outlet maximum). Upgrade your plan to add more outlets.`,
          code: 'OUTLET_LIMIT_EXCEEDED',
          currentCount,
          outletLimit,
          planName,
        },
        { status: 403 }
      );
    }

    const finalCode = (code || `OUT-${Date.now().toString().slice(-4)}`).trim().toUpperCase();

    // 2. Insert into outlets (also guarded by Postgres trigger)
    const { data: newOutlet, error: insertErr } = await (supabase as any)
      .from('outlets')
      .insert({
        business_id: businessId,
        name: name.trim(),
        code: finalCode,
        address: address ? address.trim() : null,
        phone: phone ? phone.trim() : null,
        manager_name: managerName ? managerName.trim() : null,
        is_primary: Boolean(isPrimary),
        is_active: true,
      })
      .select()
      .single();

    if (insertErr) {
      if (insertErr.message?.includes('Outlet limit reached') || insertErr.code === '23514') {
        return NextResponse.json(
          {
            success: false,
            error: insertErr.message,
            code: 'OUTLET_LIMIT_EXCEEDED',
            currentCount,
            outletLimit,
          },
          { status: 403 }
        );
      }
      return NextResponse.json({ success: false, error: insertErr.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `Outlet "${newOutlet.name}" created successfully.`,
      outlet: newOutlet,
      currentCount: currentCount + 1,
      outletLimit,
    }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

/**
 * PUT: Update an outlet
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, storeId, storeSlug, name, address, phone, managerName, isPrimary, isActive } = body;

    if (!id || !storeId) {
      return NextResponse.json({ success: false, error: 'Outlet ID and Store ID required' }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Database unavailable' }, { status: 503 });
    }

    const storeInfo = await resolveStore(supabase, storeId, storeSlug);
    if (!storeInfo) {
      return NextResponse.json({ success: false, error: 'Store not found' }, { status: 404 });
    }

    // Check limit if reactivating
    if (isActive === true && storeInfo.outletLimit !== null) {
      const { count } = await (supabase as any)
        .from('outlets')
        .select('id', { count: 'exact', head: true })
        .eq('business_id', storeInfo.businessId)
        .eq('is_active', true)
        .neq('id', id);

      if ((count || 0) >= storeInfo.outletLimit) {
        return NextResponse.json({
          success: false,
          error: `Cannot reactivate outlet. Limit of ${storeInfo.outletLimit} outlets reached for ${storeInfo.planName}.`,
          code: 'OUTLET_LIMIT_EXCEEDED',
        }, { status: 403 });
      }
    }

    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (name !== undefined) updateData.name = name.trim();
    if (address !== undefined) updateData.address = address?.trim() || null;
    if (phone !== undefined) updateData.phone = phone?.trim() || null;
    if (managerName !== undefined) updateData.manager_name = managerName?.trim() || null;
    if (isPrimary !== undefined) updateData.is_primary = Boolean(isPrimary);
    if (isActive !== undefined) updateData.is_active = Boolean(isActive);

    const { data: updated, error } = await (supabase as any)
      .from('outlets')
      .update(updateData)
      .eq('id', id)
      .eq('business_id', storeInfo.businessId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, outlet: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

/**
 * DELETE: Remove outlet
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const storeId = searchParams.get('storeId') || searchParams.get('storeSlug');
    const storeSlug = searchParams.get('storeSlug') || undefined;

    if (!id || !storeId) {
      return NextResponse.json({ success: false, error: 'Outlet ID and Store ID required' }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Database unavailable' }, { status: 503 });
    }

    const storeInfo = await resolveStore(supabase, storeId, storeSlug);
    if (!storeInfo) {
      return NextResponse.json({ success: false, error: 'Store not found' }, { status: 404 });
    }

    const { error } = await (supabase as any)
      .from('outlets')
      .delete()
      .eq('id', id)
      .eq('business_id', storeInfo.businessId);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Outlet removed successfully.' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
