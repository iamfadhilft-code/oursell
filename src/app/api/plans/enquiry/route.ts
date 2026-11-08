import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      planId,
      planName,
      billingCycle,
      price,
      customerName,
      customerEmail,
      customerPhone,
      message,
    } = body;

    if (!customerName || !customerEmail || !customerPhone || !planName) {
      return NextResponse.json(
        { success: false, error: 'Please provide your name, email, phone number, and selected plan.' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServerClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('plan_enquiries')
        .insert({
          plan_id: planId || null,
          plan_name: planName,
          billing_cycle: billingCycle || 'MONTHLY',
          price: Number(price) || 0,
          customer_name: customerName.trim(),
          customer_email: customerEmail.trim().toLowerCase(),
          customer_phone: customerPhone.trim(),
          message: message ? message.trim() : null,
          status: 'NEW',
        })
        .select()
        .single();

      if (error) {
        console.error('Error inserting plan enquiry to Supabase:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }

      // Also forward notification to support_inbox for Dev Core team
      try {
        await supabase.from('support_inbox').insert({
          sender_email: customerEmail.trim().toLowerCase(),
          subject: `New Plan Enquiry: ${planName} (${billingCycle || 'MONTHLY'} - ₹${price})`,
          message: `Customer: ${customerName.trim()} (${customerPhone.trim()})\nPlan: ${planName}\nPrice: ₹${price} / ${billingCycle === 'ANNUAL' ? 'year' : 'month'}\nMessage: ${message || 'No additional note provided.'}`,
          priority: 'HIGH',
          status: 'OPEN',
        });
      } catch (inboxErr) {
        console.warn('Could not mirror enquiry to support_inbox:', inboxErr);
      }

      return NextResponse.json({
        success: true,
        message: 'Your enquiry has been received. Our team will contact you shortly.',
        enquiry: data,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Enquiry received successfully.',
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('plan_enquiries')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        return NextResponse.json({ success: true, enquiries: data });
      }
    }

    return NextResponse.json({ success: true, enquiries: [] });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
