import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { normalizePlanId, DEFAULT_PLAN_LIMITS, getPlanDisplayName } from '@/lib/planAccess';
import { resolveStoreBusiness } from '@/lib/supabase/storeResolver';

async function resolveStore(supabase: ReturnType<typeof getSupabaseServerClient>, storeId: string, fallbackSlug?: string) {
  if (!supabase || !storeId) return null;

  const business = await resolveStoreBusiness(supabase, storeId, fallbackSlug);
  if (!business) return null;

  const { data: sub } = await (supabase as any)
    .from('subscriptions')
    .select('plan_id, plan_tier, terminal_limit, status')
    .eq('business_id', business.id)
    .eq('status', 'ACTIVE')
    .maybeSingle();

  const planId = normalizePlanId(sub?.plan_id || sub?.plan_tier);
  const terminalLimit = sub?.terminal_limit !== undefined ? sub.terminal_limit : DEFAULT_PLAN_LIMITS[planId].terminals;

  return {
    businessId: business.id,
    storeSlug: business.slug,
    planId,
    planName: getPlanDisplayName(planId),
    terminalLimit,
  };
}

/**
 * GET: Retrieve store POS terminals
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

    const { data: terminals, error } = await (supabase as any)
      .from('pos_terminals')
      .select('*, outlets(name, code)')
      .eq('business_id', storeInfo.businessId)
      .order('created_at', { ascending: true });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const activeCount = (terminals || []).filter((t: any) => t.is_active).length;

    return NextResponse.json({
      success: true,
      storeId: storeInfo.storeSlug,
      planName: storeInfo.planName,
      terminalLimit: storeInfo.terminalLimit,
      currentCount: activeCount,
      isLimitReached: storeInfo.terminalLimit !== null && activeCount >= storeInfo.terminalLimit,
      terminals: terminals || [],
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

/**
 * POST: Register a POS terminal with strict plan limit enforcement
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { storeId, storeSlug, outletId, terminalCode, code, name, deviceFingerprint, ipAddress } = body;

    if (!storeId || !name) {
      return NextResponse.json({ success: false, error: 'Store ID and terminal name are required.' }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Database unavailable' }, { status: 503 });
    }

    const storeInfo = await resolveStore(supabase, storeId, storeSlug);
    if (!storeInfo) {
      return NextResponse.json({ success: false, error: `Store "${storeId}" not found` }, { status: 404 });
    }

    const { businessId, terminalLimit, planName } = storeInfo;

    // 1. Check current terminal count vs limit
    const { count, error: countErr } = await (supabase as any)
      .from('pos_terminals')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', businessId)
      .eq('is_active', true);

    if (countErr) {
      return NextResponse.json({ success: false, error: countErr.message }, { status: 500 });
    }

    const currentCount = count || 0;

    if (terminalLimit !== null && currentCount >= terminalLimit) {
      return NextResponse.json(
        {
          success: false,
          error: `POS Terminal limit reached for current ${planName} plan (${terminalLimit} terminals maximum). Upgrade your plan to add more POS terminals.`,
          code: 'TERMINAL_LIMIT_EXCEEDED',
          currentCount,
          terminalLimit,
          planName,
        },
        { status: 403 }
      );
    }

    const finalCode = (terminalCode || code || `TERM-${Date.now().toString().slice(-4)}`).trim().toUpperCase();

    // 2. Insert into pos_terminals (guarded also by Postgres trigger)
    const { data: newTerminal, error: insertErr } = await (supabase as any)
      .from('pos_terminals')
      .insert({
        business_id: businessId,
        outlet_id: outletId || null,
        terminal_code: finalCode,
        name: name.trim(),
        device_fingerprint: deviceFingerprint || null,
        ip_address: ipAddress || null,
        status: 'ACTIVE',
        is_active: true,
        last_ping_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertErr) {
      if (insertErr.message?.includes('POS Terminal limit reached') || insertErr.code === '23514') {
        return NextResponse.json(
          {
            success: false,
            error: insertErr.message,
            code: 'TERMINAL_LIMIT_EXCEEDED',
            currentCount,
            terminalLimit,
          },
          { status: 403 }
        );
      }
      return NextResponse.json({ success: false, error: insertErr.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `POS Terminal "${newTerminal.name}" registered successfully.`,
      terminal: newTerminal,
      currentCount: currentCount + 1,
      terminalLimit,
    }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

/**
 * PUT: Update terminal status or metadata
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, storeId, storeSlug, name, outletId, status, isActive } = body;

    if (!id || !storeId) {
      return NextResponse.json({ success: false, error: 'Terminal ID and Store ID required' }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Database unavailable' }, { status: 503 });
    }

    const storeInfo = await resolveStore(supabase, storeId, storeSlug);
    if (!storeInfo) {
      return NextResponse.json({ success: false, error: 'Store not found' }, { status: 404 });
    }

    if (isActive === true && storeInfo.terminalLimit !== null) {
      const { count } = await (supabase as any)
        .from('pos_terminals')
        .select('id', { count: 'exact', head: true })
        .eq('business_id', storeInfo.businessId)
        .eq('is_active', true)
        .neq('id', id);

      if ((count || 0) >= storeInfo.terminalLimit) {
        return NextResponse.json({
          success: false,
          error: `Cannot activate terminal. Limit of ${storeInfo.terminalLimit} terminals reached for ${storeInfo.planName}.`,
          code: 'TERMINAL_LIMIT_EXCEEDED',
        }, { status: 403 });
      }
    }

    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (name !== undefined) updateData.name = name.trim();
    if (outletId !== undefined) updateData.outlet_id = outletId || null;
    if (status !== undefined) updateData.status = status;
    if (isActive !== undefined) updateData.is_active = Boolean(isActive);

    const { data: updated, error } = await (supabase as any)
      .from('pos_terminals')
      .update(updateData)
      .eq('id', id)
      .eq('business_id', storeInfo.businessId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, terminal: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

/**
 * DELETE: Remove terminal
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const storeId = searchParams.get('storeId') || searchParams.get('storeSlug');
    const storeSlug = searchParams.get('storeSlug') || undefined;

    if (!id || !storeId) {
      return NextResponse.json({ success: false, error: 'Terminal ID and Store ID required' }, { status: 400 });
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
      .from('pos_terminals')
      .delete()
      .eq('id', id)
      .eq('business_id', storeInfo.businessId);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'POS Terminal removed.' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
