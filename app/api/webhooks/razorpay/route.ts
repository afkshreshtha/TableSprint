import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import crypto from "crypto";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

interface RazorpaySubscriptionEntity {
  id: string;
  status: string;
  current_start: number;
  current_end: number;
  notes?: {
    restaurant_id?: string;
    billing_cycle?: string;
  };
}

interface RazorpayPaymentEntity {
  id: string;
  order_id?: string;
  subscription_id?: string;
  amount: number;
  currency: string;
  method?: string;         // "upi" | "card" | "netbanking" | "wallet" etc.
  error_description?: string;
}

interface RazorpayWebhookEvent {
  event: string;
  payload: {
    subscription?: { entity: RazorpaySubscriptionEntity };
    payment?: { entity: RazorpayPaymentEntity };
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const signature = request.headers.get("x-razorpay-signature");

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET!)
      .update(body)
      .digest("hex");

    if (signature !== expectedSignature) {
      console.error("Invalid webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(body) as RazorpayWebhookEvent;
    console.log("Razorpay webhook event:", event.event);

    switch (event.event) {
      case "subscription.activated":
        await handleSubscriptionActivated(event.payload.subscription!.entity);
        break;
      case "subscription.charged":
        await handleSubscriptionCharged(
          event.payload.subscription!.entity,
          event.payload.payment!.entity,
        );
        break;
      case "subscription.cancelled":
        await handleSubscriptionCancelled(event.payload.subscription!.entity);
        break;
      case "subscription.paused":
        await handleSubscriptionPaused(event.payload.subscription!.entity);
        break;
      case "subscription.resumed":
        await handleSubscriptionResumed(event.payload.subscription!.entity);
        break;
      case "subscription.completed":
        await handleSubscriptionCompleted(event.payload.subscription!.entity);
        break;
      case "payment.failed":
        await handlePaymentFailed(event.payload.payment!.entity);
        break;
      case "payment.authorized":
      case "payment.captured":
      case "invoice.paid":
      case "subscription.authenticated":
        console.log("ℹ️ Acknowledged event:", event.event);
        break;
      default:
        console.log("Unhandled event:", event.event);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}

async function handleSubscriptionActivated(subscription: RazorpaySubscriptionEntity) {
  console.log("Activating subscription:", subscription.id);

  const restaurantId = subscription.notes?.restaurant_id;
  if (!restaurantId) {
    console.error("No restaurant_id in subscription notes");
    return;
  }

  const { data: plan } = await supabase
    .from("subscription_plans")
    .select("id")
    .eq("name", "pro")
    .single();

  if (!plan) {
    console.error("Pro plan not found");
    return;
  }

  const { error } = await supabase
    .from("restaurant_subscriptions")
    .update({
      plan_id: plan.id,
      razorpay_subscription_id: subscription.id,
      status: "active",
      billing_cycle: subscription.notes?.billing_cycle ?? "monthly",
      current_period_start: new Date(subscription.current_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_end * 1000).toISOString(),
      trial_start: null,
      trial_end: null,
      updated_at: new Date().toISOString(),
    })
    .eq("restaurant_id", restaurantId);

  if (error) {
    console.error("Error updating subscription:", error);
  } else {
    console.log("✅ Subscription activated for restaurant:", restaurantId);
  }
}

async function handleSubscriptionCharged(
  subscription: RazorpaySubscriptionEntity,
  payment: RazorpayPaymentEntity,
) {
  console.log("Subscription charged:", subscription.id);

  const { data: sub } = await supabase
    .from("restaurant_subscriptions")
    .select("restaurant_id, id, plan_id")
    .eq("razorpay_subscription_id", subscription.id)
    .maybeSingle();

  if (!sub) {
    console.error("Subscription not found in database:", subscription.id);
    return;
  }

  await supabase.from("payment_history").insert({
    restaurant_id: sub.restaurant_id,
    subscription_id: sub.id,
    razorpay_payment_id: payment.id,
    razorpay_order_id: payment.order_id,
    amount: payment.amount,
    currency: payment.currency,
    status: "success",
    payment_method: payment.method ?? null,  // ✅ passes "upi", "card", etc. as-is
    description: `Subscription payment - ${subscription.id}`,
  });

  await supabase
    .from("restaurant_subscriptions")
    .update({
      status: "active",
      current_period_start: new Date(subscription.current_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_end * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("razorpay_subscription_id", subscription.id);

  console.log("✅ Payment recorded for subscription:", subscription.id);
}

async function handleSubscriptionCancelled(subscription: RazorpaySubscriptionEntity) {
  console.log("Subscription cancelled:", subscription.id);

  const { data: sub } = await supabase
    .from("restaurant_subscriptions")
    .select("restaurant_id")
    .eq("razorpay_subscription_id", subscription.id)
    .maybeSingle();

  if (!sub) return;

  await supabase
    .from("restaurant_subscriptions")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
      cancel_at_period_end: true,
      updated_at: new Date().toISOString(),
    })
    .eq("razorpay_subscription_id", subscription.id);

  console.log("✅ Subscription cancelled:", subscription.id);
}

async function handleSubscriptionPaused(subscription: RazorpaySubscriptionEntity) {
  console.log("Subscription paused:", subscription.id);

  await supabase
    .from("restaurant_subscriptions")
    .update({ status: "paused", updated_at: new Date().toISOString() })
    .eq("razorpay_subscription_id", subscription.id);
}

async function handleSubscriptionResumed(subscription: RazorpaySubscriptionEntity) {
  console.log("Subscription resumed:", subscription.id);

  await supabase
    .from("restaurant_subscriptions")
    .update({ status: "active", updated_at: new Date().toISOString() })
    .eq("razorpay_subscription_id", subscription.id);
}

async function handleSubscriptionCompleted(subscription: RazorpaySubscriptionEntity) {
  console.log("Subscription completed:", subscription.id);

  const { data: sub } = await supabase
    .from("restaurant_subscriptions")
    .select("restaurant_id")
    .eq("razorpay_subscription_id", subscription.id)
    .maybeSingle();

  if (!sub) return;

  const { data: freePlan } = await supabase
    .from("subscription_plans")
    .select("id")
    .eq("name", "free")
    .single();

  if (!freePlan) return;

  await supabase
    .from("restaurant_subscriptions")
    .update({
      plan_id: freePlan.id,
      status: "free",
      razorpay_subscription_id: null,
      billing_cycle: null,
      current_period_start: null,
      current_period_end: null,
      updated_at: new Date().toISOString(),
    })
    .eq("razorpay_subscription_id", subscription.id);

  await supabase.rpc("handle_plan_downgrade", {
    rest_id: sub.restaurant_id,
    new_plan_id: freePlan.id,
  });

  console.log("✅ Downgraded to free plan:", sub.restaurant_id);
}

async function handlePaymentFailed(payment: RazorpayPaymentEntity) {
  console.log("Payment failed:", payment.id);
  

  const { data: sub } = await supabase
    .from("restaurant_subscriptions")
    .select("restaurant_id, id")
    .eq("razorpay_subscription_id", payment.subscription_id)
    .maybeSingle();

  if (!sub) return;

  await supabase.from("payment_history").insert({
    restaurant_id: sub.restaurant_id,
    subscription_id: sub.id,
    razorpay_payment_id: payment.id,
    amount: payment.amount,
    currency: payment.currency,
    status: "failed",
    payment_method: payment.method ?? null,  // ✅ same fix here
    description: `Payment failed - ${payment.error_description ?? "Unknown error"}`,
  });

  await supabase
    .from("restaurant_subscriptions")
    .update({ status: "past_due", updated_at: new Date().toISOString() })
    .eq("razorpay_subscription_id", payment.subscription_id);

  console.log("✅ Payment failure recorded:", payment.id);
}
