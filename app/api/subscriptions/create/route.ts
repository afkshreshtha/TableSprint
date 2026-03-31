import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import type { Database } from "@/types/supabase";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// Razorpay doesn't export these types so we define them locally
interface RazorpayCustomer {
  id: string;
  email: string;
  name: string;
  contact: string;
}

interface RazorpayCustomerList {
  items: RazorpayCustomer[];
}

interface RazorpaySubscription {
  id: string;
  status: string;

  start_at: number | null;
  current_start: number | null;
  current_end: number | null;
}

interface CreateSubscriptionBody {
  planId: string;
  billingCycle: "monthly" | "yearly";
  restaurantId: string;
}

export async function POST(request: Request) {
  try {
    console.log("========== CREATE SUBSCRIPTION START ==========");

    const { planId, billingCycle, restaurantId }: CreateSubscriptionBody =
      await request.json();
    console.log("Request:", { planId, billingCycle, restaurantId });

    // Get plan details
    const { data: plan } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("id", planId)
      .single();

    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    // Get restaurant
    const { data: restaurant } = await supabase
      .from("restaurants")
      .select("*")
      .eq("id", restaurantId)
      .single();

    if (!restaurant) {
      return NextResponse.json(
        { error: "Restaurant not found" },
        { status: 404 },
      );
    }

    // Get or create Razorpay customer
    let customerId: string | null = null;

    const { data: existingSub } = await supabase
      .from("restaurant_subscriptions")
      .select(
        "razorpay_customer_id,status, razorpay_subscription_id, trial_start, trial_end",
      )
      .eq("restaurant_id", restaurantId)
      .maybeSingle();

    if (existingSub?.razorpay_customer_id) {
      customerId = existingSub.razorpay_customer_id;
      console.log("Using existing customer:", customerId);
    } else {
      try {
        const customers = (await razorpay.customers.all({
          count: 100,
        })) as RazorpayCustomerList;

        const existingCustomer = customers.items.find(
          (c) => c.email === restaurant.email,
        );

        if (existingCustomer) {
          customerId = existingCustomer.id;
          console.log("Found existing customer:", customerId);
        } else {
          const customer = (await razorpay.customers.create({
            name: restaurant.name,
            email: restaurant.email ?? "",
            contact: restaurant.phone ?? "",
          })) as RazorpayCustomer;
          customerId = customer.id;
          console.log("Created new customer:", customerId);
        }
      } catch (err: unknown) {
        const error = err as { error?: { description?: string } };
        if (error.error?.description?.includes("already exists")) {
          const customers = (await razorpay.customers.all({
            count: 100,
          })) as RazorpayCustomerList;
          const existingCustomer = customers.items.find(
            (c) => c.email === restaurant.email,
          );
          if (existingCustomer) {
            customerId = existingCustomer.id;
            console.log("Recovered existing customer:", customerId);
          }
        } else {
          throw err;
        }
      }
    }

    // Get Razorpay plan ID
    const razorpayPlanId =
      billingCycle === "yearly"
        ? plan.razorpay_plan_id_yearly
        : plan.razorpay_plan_id_monthly;

    if (!razorpayPlanId) {
      return NextResponse.json(
        { error: "Plan not configured" },
        { status: 400 },
      );
    }
    console.log("Razorpay Plan ID:", razorpayPlanId);

    // Create subscription in Razorpay
    console.log("Creating Razorpay subscription...");
    const subscription = (await razorpay.subscriptions.create({
      plan_id: razorpayPlanId,
      customer_id: customerId!,
      total_count: billingCycle === "yearly" ? 10 : 12,
      quantity: 1,
      customer_notify: 1,
      notes: {
        restaurant_id: restaurantId,
        plan_name: plan.name,
        billing_cycle: billingCycle,
      },
    } as unknown as Parameters<
      typeof razorpay.subscriptions.create
    >[0])) as unknown as RazorpaySubscription;

    console.log("✅ Razorpay subscription created:", subscription.id);
    console.log("Subscription status:", subscription.status);

    // Calculate period dates
    const now = new Date();
    let periodStart: Date;
    let periodEnd: Date;

    if (subscription.start_at && subscription.start_at > 0) {
      periodStart = new Date(subscription.start_at * 1000);
    } else if (subscription.current_start && subscription.current_start > 0) {
      periodStart = new Date(subscription.current_start * 1000);
    } else {
      periodStart = now;
    }

    if (subscription.current_end && subscription.current_end > 0) {
      periodEnd = new Date(subscription.current_end * 1000);
    } else {
      periodEnd = new Date(periodStart);
      if (billingCycle === "yearly") {
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      } else {
        periodEnd.setMonth(periodEnd.getMonth() + 1);
      }
    }

    console.log("Period start:", periodStart.toISOString());
    console.log("Period end:", periodEnd.toISOString());

    // Save to database
    const { error: updateError } = await supabase
      .from("restaurant_subscriptions")
      .update({
        razorpay_subscription_id: subscription.id,
        razorpay_customer_id: customerId,
        billing_cycle: billingCycle,

        // ✅ FIXED: preserve trial status
        status: existingSub?.status === "trialing" ? "trialing" : "created",

        current_period_start: periodStart.toISOString(),
        current_period_end: periodEnd.toISOString(),

        // ✅ KEEP trial data (IMPORTANT)
        trial_start: existingSub?.trial_start,
        trial_end: existingSub?.trial_end,

        updated_at: new Date().toISOString(),
      })
      .eq("restaurant_id", restaurantId);

    if (updateError) {
      console.error("❌ Failed to save subscription:", updateError);
    } else {
      console.log("✅ Subscription saved");
    }


    const amount =
      billingCycle === "yearly" ? plan.price_yearly : plan.price_monthly;

    console.log("========== CREATE SUBSCRIPTION END ==========");

    return NextResponse.json({
      subscriptionId: subscription.id,
      amount,
      currency: "INR",
      name: restaurant.name,
      email: restaurant.email,
      planName: plan.display_name,
      billingCycle,
    });
  } catch (err: unknown) {
    const error = err as { message?: string; error?: unknown };
    console.error("❌ Subscription creation error:", error);
    return NextResponse.json(
      { error: error.message ?? "Failed to create subscription" },
      { status: 500 },
    );
  }
}
