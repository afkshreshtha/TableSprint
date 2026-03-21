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

interface RazorpayError {
  error?: { description?: string };
  message?: string;
}

interface RazorpaySubscriptions {
  resume: (id: string, options: { resume_at: string }) => Promise<void>;
}

export async function POST(request: Request) {
  try {
    const { restaurantId } = await request.json();

    if (!restaurantId) {
      return NextResponse.json({ error: 'Restaurant ID required' }, { status: 400 });
    }

    const { data: sub } = await supabase
      .from('restaurant_subscriptions')
      .select('razorpay_subscription_id, status')
      .eq('restaurant_id', restaurantId)
      .single();

    if (!sub?.razorpay_subscription_id) {
      return NextResponse.json({ error: 'No subscription found' }, { status: 400 });
    }

    if (sub.status !== 'paused') {
      return NextResponse.json({ error: 'Subscription is not paused' }, { status: 400 });
    }

    await (razorpay.subscriptions as unknown as RazorpaySubscriptions).resume(
      sub.razorpay_subscription_id,
      { resume_at: 'now' }
    );

    await supabase
      .from('restaurant_subscriptions')
      .update({ status: 'active', updated_at: new Date().toISOString() })
      .eq('restaurant_id', restaurantId);

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const error = err as RazorpayError;
    console.error('Resume error:', error);
    return NextResponse.json(
      { error: error.message ?? 'Failed to resume' },
      { status: 500 }
    );
  }
}