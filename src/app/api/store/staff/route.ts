import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { resolveStoreBusinessAndSubscription } from '@/lib/supabase/storeResolver';

/**
 * GET: Retrieve store staff with current usage vs subscription limit.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId') || searchParams.get('storeSlug') || 'oursell';
    const storeSlugParam = searchParams.get('storeSlug') || undefined;

    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({
        success: false,
        error: 'Database connection unavailable',
      }, { status: 503 });
    }

    const subInfo = await resolveStoreBusinessAndSubscription(supabase, storeId, {
      fallbackSlug: storeSlugParam,
    });
    if (!subInfo) {
      return NextResponse.json({ success: false, error: `Store "${storeId}" not found` }, { status: 404 });
    }

    const { businessId, storeSlug, limits } = subInfo;

    // Strict tenant isolation: fetch only staff belonging to this business_id
    const { data: staffList, error: sError } = await supabase
      .from('staff_records')
      .select('id, employee_id, name, email, role, is_active, permissions, can_give_discount, last_login_at, created_at')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (sError) {
      return NextResponse.json({ success: false, error: sError.message }, { status: 500 });
    }

    const activeCount = (staffList || []).filter((s: any) => s.is_active).length;
    const isLimitReached = activeCount >= limits.staffLimit;

    return NextResponse.json({
      success: true,
      storeId: storeSlug,
      businessId,
      planTier: limits.planTier,
      staffLimit: limits.staffLimit,
      currentCount: activeCount,
      totalCount: staffList?.length || 0,
      isLimitReached,
      staff: staffList || [],
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

/**
 * POST: Create a new staff account with strict backend staff limit enforcement.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      storeId,
      storeSlug: bodyStoreSlug,
      businessName,
      name,
      email,
      employeeId,
      role = 'STORE_STAFF',
      pin,
      password,
      permissions = ['pos_billing', 'customer_manage', 'invoice_print'],
      canGiveDiscount = false,
    } = body;

    if (!storeId || !name || (!pin && !password)) {
      return NextResponse.json(
        { success: false, error: 'Please provide store ID, staff name, and a 4-digit PIN or password.' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Database unavailable' }, { status: 503 });
    }

    const subInfo = await resolveStoreBusinessAndSubscription(supabase, storeId, {
      fallbackSlug: bodyStoreSlug,
      fallbackName: businessName,
    });
    if (!subInfo) {
      return NextResponse.json({ success: false, error: `Store "${storeId}" not found` }, { status: 404 });
    }

    const { businessId, storeSlug, limits } = subInfo;

    // 1. COUNT ACTIVE STAFF FOR THIS STORE (Backend Validation)
    const { count, error: countError } = await supabase
      .from('staff_records')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', businessId)
      .eq('is_active', true);

    if (countError) {
      return NextResponse.json({ success: false, error: countError.message }, { status: 500 });
    }

    const currentCount = count || 0;

    // 2. ENFORCE LIMIT: REJECT IF CURRENT ACTIVE STAFF >= STAFF LIMIT
    if (currentCount >= limits.staffLimit) {
      return NextResponse.json(
        {
          success: false,
          error: `Your staff limit has been reached. Current ${limits.planTier} plan allows a maximum of ${limits.staffLimit} staff account(s).`,
          code: 'STAFF_LIMIT_EXCEEDED',
          currentCount,
          staffLimit: limits.staffLimit,
          planTier: limits.planTier,
        },
        { status: 403 }
      );
    }

    // 3. GENERATE EMPLOYEE ID & PIN
    const finalEmployeeId =
      employeeId?.trim() || `EMP-${Date.now().toString().slice(-4)}`;
    const finalPin = (pin || password || '1111').trim().slice(-4);

    // 4. INSERT INTO SUPABASE (Guarded additionally by Postgres trigger)
    const { data: newStaff, error: insertError } = await supabase
      .from('staff_records')
      .insert({
        business_id: businessId,
        employee_id: finalEmployeeId,
        name: name.trim(),
        email: email ? email.trim().toLowerCase() : null,
        role: role === 'STORE_ADMIN' ? 'STORE_ADMIN' : 'STORE_STAFF',
        pin_hash: finalPin,
        password_hash: finalPin,
        permissions: permissions,
        can_give_discount: Boolean(canGiveDiscount),
        is_active: true,
      })
      .select()
      .single();

    if (insertError) {
      // Catch postgres trigger exception if triggered
      if (insertError.message?.includes('Staff limit reached') || insertError.code === '23514') {
        return NextResponse.json(
          {
            success: false,
            error: insertError.message,
            code: 'STAFF_LIMIT_EXCEEDED',
            currentCount,
            staffLimit: limits.staffLimit,
            planTier: limits.planTier,
          },
          { status: 403 }
        );
      }
      return NextResponse.json({ success: false, error: insertError.message }, { status: 400 });
    }

    return NextResponse.json(
      {
        success: true,
        message: `Staff member "${newStaff.name}" created successfully.`,
        staff: newStaff,
        currentCount: currentCount + 1,
        staffLimit: limits.staffLimit,
        planTier: limits.planTier,
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

/**
 * PUT: Update an existing staff member (name, pin, discount authorization, status).
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      storeId,
      storeSlug,
      name,
      email,
      role,
      pin,
      permissions,
      canGiveDiscount,
      isActive,
    } = body;

    if (!id || !storeId) {
      return NextResponse.json({ success: false, error: 'Staff ID and Store ID are required.' }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Database unavailable' }, { status: 503 });
    }

    const subInfo = await resolveStoreBusinessAndSubscription(supabase, storeId, {
      fallbackSlug: storeSlug,
    });
    if (!subInfo) {
      return NextResponse.json({ success: false, error: `Store "${storeId}" not found` }, { status: 404 });
    }

    const { businessId, limits } = subInfo;

    // If reactivating an inactive staff account, check limit first
    if (isActive === true) {
      const { count } = await supabase
        .from('staff_records')
        .select('id', { count: 'exact', head: true })
        .eq('business_id', businessId)
        .eq('is_active', true)
        .neq('id', id);

      if ((count || 0) >= limits.staffLimit) {
        return NextResponse.json(
          {
            success: false,
            error: `Cannot activate staff member. Staff limit of ${limits.staffLimit} for ${limits.planTier} plan has been reached.`,
            code: 'STAFF_LIMIT_EXCEEDED',
            currentCount: count,
            staffLimit: limits.staffLimit,
          },
          { status: 403 }
        );
      }
    }

    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (name !== undefined) updateData.name = name.trim();
    if (email !== undefined) updateData.email = email ? email.trim().toLowerCase() : null;
    if (role !== undefined) updateData.role = role;
    if (pin !== undefined) {
      const p = pin.trim().slice(-4);
      updateData.pin_hash = p;
      updateData.password_hash = p;
    }
    if (permissions !== undefined) updateData.permissions = permissions;
    if (canGiveDiscount !== undefined) updateData.can_give_discount = Boolean(canGiveDiscount);
    if (isActive !== undefined) updateData.is_active = Boolean(isActive);

    // Strict tenant isolation: update only where id = id AND business_id = businessId
    const { data: updated, error } = await supabase
      .from('staff_records')
      .update(updateData as any)
      .eq('id', id)
      .eq('business_id', businessId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, staff: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

/**
 * DELETE: Remove a staff account with tenant isolation.
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const storeId = searchParams.get('storeId') || searchParams.get('storeSlug');
    const storeSlug = searchParams.get('storeSlug') || undefined;

    if (!id || !storeId) {
      return NextResponse.json({ success: false, error: 'Staff ID and Store ID required.' }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Database unavailable' }, { status: 503 });
    }

    const subInfo = await resolveStoreBusinessAndSubscription(supabase, storeId, {
      fallbackSlug: storeSlug,
    });
    if (!subInfo) {
      return NextResponse.json({ success: false, error: 'Store not found' }, { status: 404 });
    }

    // Tenant isolation: delete only where id AND business_id match
    const { error } = await supabase
      .from('staff_records')
      .delete()
      .eq('id', id)
      .eq('business_id', subInfo.businessId);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Staff member removed.' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
