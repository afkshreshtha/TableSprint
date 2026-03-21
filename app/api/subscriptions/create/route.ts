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
    console.log('========== CREATE SUBSCRIPTION START ==========');
    
    const { planId, billingCycle, restaurantId } = await request.json();
    console.log('Request:', { planId, billingCycle, restaurantId });

    // Get plan details
    const { data: plan } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    // Get restaurant
    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', restaurantId)
      .single();

    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    // Get or create customer
    let customerId = null;
    const { data: existingSub } = await supabase
      .from('restaurant_subscriptions')
      .select('razorpay_customer_id')
      .eq('restaurant_id', restaurantId)
      .maybeSingle();

    if (existingSub?.razorpay_customer_id) {
      customerId = existingSub.razorpay_customer_id;
      console.log('Using existing customer:', customerId);
    } else {
      try {
        const customers = await razorpay.customers.all({ count: 100 });
        const existingCustomer = customers.items.find(
          (c: any) => c.email === restaurant.email
        );

        if (existingCustomer) {
          customerId = existingCustomer.id;
          console.log('Found existing customer:', customerId);
        } else {
          const customer = await razorpay.customers.create({
            name: restaurant.name,
            email: restaurant.email,
            contact: restaurant.phone || '',
          });
          customerId = customer.id;
          console.log('Created new customer:', customerId);
        }
      } catch (error: any) {
        if (error.error?.description?.includes('already exists')) {
          const customers = await razorpay.customers.all({ count: 100 });
          const existingCustomer = customers.items.find(
            (c: any) => c.email === restaurant.email
          );
          if (existingCustomer) {
            customerId = existingCustomer.id;
            console.log('Recovered existing customer:', customerId);
          }
        } else {
          throw error;
        }
      }
    }

    // Get Razorpay plan ID
    const razorpayPlanId = billingCycle === 'yearly' 
      ? plan.razorpay_plan_id_yearly 
      : plan.razorpay_plan_id_monthly;

    if (!razorpayPlanId) {
      return NextResponse.json({ 
        error: 'Plan not configured',
      }, { status: 400 });
    }
    console.log('Razorpay Plan ID:', razorpayPlanId);

    // Create subscription in Razorpay
    console.log('Creating Razorpay subscription...');
    const subscription = await razorpay.subscriptions.create({
      plan_id: razorpayPlanId,
      customer_id: customerId,
      total_count: billingCycle === 'yearly' ? 10 : 12,
      quantity: 1,
      customer_notify: 1,
      notes: {
        restaurant_id: restaurantId,
        plan_name: plan.name,
        billing_cycle: billingCycle,
      },
    });

    console.log('✅ Razorpay subscription created:', subscription.id);
    console.log('Subscription status:', subscription.status);
    console.log('Start at (timestamp):', subscription.start_at);
    console.log('Current start (timestamp):', subscription.current_start);
    console.log('Current end (timestamp):', subscription.current_end);

    // Calculate period dates - use current time if Razorpay dates not available
    const now = new Date();
    let periodStart: Date;
    let periodEnd: Date;

    // Check if we have valid timestamps from Razorpay
    if (subscription.start_at && subscription.start_at > 0) {
      periodStart = new Date(subscription.start_at * 1000);
    } else if (subscription.current_start && subscription.current_start > 0) {
      periodStart = new Date(subscription.current_start * 1000);
    } else {
      // Fallback to current time
      periodStart = now;
    }

    // Calculate end date
    if (subscription.current_end && subscription.current_end > 0) {
      periodEnd = new Date(subscription.current_end * 1000);
    } else {
      // Calculate based on billing cycle
      periodEnd = new Date(periodStart);
      if (billingCycle === 'yearly') {
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      } else {
        periodEnd.setMonth(periodEnd.getMonth() + 1);
      }
    }

    console.log('Calculated period start:', periodStart.toISOString());
    console.log('Calculated period end:', periodEnd.toISOString());

    // Save subscription with period dates to database
    console.log('Saving subscription to database with period dates...');
    const { error: updateError } = await supabase
      .from('restaurant_subscriptions')
      .update({
        razorpay_subscription_id: subscription.id,
        razorpay_customer_id: customerId,
        billing_cycle: billingCycle,
        status: 'created', // Will be updated to 'active' by webhook
        current_period_start: periodStart.toISOString(),
        current_period_end: periodEnd.toISOString(),
        trial_start: null,
        trial_end: null,
        updated_at: new Date().toISOString(),
      })
      .eq('restaurant_id', restaurantId);

    if (updateError) {
      console.error('❌ Failed to save subscription:', updateError);
    } else {
      console.log('✅ Subscription saved with period dates');
    }

    const amount = billingCycle === 'yearly' ? plan.price_yearly : plan.price_monthly;

    console.log('========== CREATE SUBSCRIPTION END ==========');

    return NextResponse.json({ 
      subscriptionId: subscription.id,
      amount: amount,
      currency: 'INR',
      name: restaurant.name,
      email: restaurant.email,
      planName: plan.display_name,
      billingCycle: billingCycle,
    });
  } catch (error: any) {
    console.error('❌ Subscription creation error:', error);
    console.error('Error details:', error.error);
    return NextResponse.json({ 
      error: error.message || 'Failed to create subscription',
    }, { status: 500 });
  }
}

