import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    console.log('========== CANCEL SUBSCRIPTION START ==========');
    
    const { restaurantId, cancelAtPeriodEnd } = await request.json();
    console.log('Cancel request:', { restaurantId, cancelAtPeriodEnd });

    if (!restaurantId) {
      return NextResponse.json({ error: 'Restaurant ID required' }, { status: 400 });
    }

    // Get subscription
    const { data: sub, error: fetchError } = await supabase
      .from('restaurant_subscriptions')
      .select('razorpay_subscription_id, plan_id, status')
      .eq('restaurant_id', restaurantId)
      .single();

    console.log('Subscription found:', sub);

    if (fetchError || !sub) {
      console.error('Subscription not found:', fetchError);
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    if (!sub.razorpay_subscription_id) {
      console.error('No Razorpay subscription ID');
      return NextResponse.json({ error: 'No active subscription to cancel' }, { status: 400 });
    }

    // Cancel in Razorpay
    console.log('Cancelling Razorpay subscription:', sub.razorpay_subscription_id);
    
    try {
      await razorpay.subscriptions.cancel(
        sub.razorpay_subscription_id,
        cancelAtPeriodEnd
      );
      console.log('✅ Razorpay subscription cancelled');
    } catch (razorpayError: any) {
      console.error('Razorpay cancellation error:', razorpayError);
      
      // If already cancelled, continue with database update
      if (!razorpayError.error?.description?.includes('already')) {
        throw razorpayError;
      }
    }

    // Update database
    const { error: updateError } = await supabase
      .from('restaurant_subscriptions')
      .update({
        cancel_at_period_end: cancelAtPeriodEnd,
        status: cancelAtPeriodEnd ? 'active' : 'cancelled',
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('restaurant_id', restaurantId);

    if (updateError) {
      console.error('Database update error:', updateError);
      return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 });
    }

    console.log('✅ Subscription cancelled in database');
    console.log('========== CANCEL SUBSCRIPTION END ==========');

    return NextResponse.json({ 
      success: true,
      message: cancelAtPeriodEnd 
        ? 'Subscription will be cancelled at period end'
        : 'Subscription cancelled immediately'
    });

  } catch (error: any) {
    console.error('❌ Cancellation error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to cancel subscription' 
    }, { status: 500 });
  }
}