import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import crypto from "crypto";
import Razorpay from "razorpay";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(request: Request) {
  try {
    console.log("========== VERIFY PAYMENT START ==========");

    const body = await request.json();
    const {
      razorpay_payment_id,
      razorpay_subscription_id,
      razorpay_signature,
    } = body;

    console.log("Payment ID:", razorpay_payment_id);
    console.log("Subscription ID:", razorpay_subscription_id);

    if (!razorpay_payment_id || !razorpay_subscription_id || !razorpay_signature) {
      console.error("❌ Missing required fields");
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // ── Verify signature ───────────────────────────────────────────────────
    const text = `${razorpay_payment_id}|${razorpay_subscription_id}`;
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(text)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      console.error("❌ Invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    console.log("✅ Signature verified");

    // ── Find subscription ──────────────────────────────────────────────────
    const { data: sub, error: subError } = await supabase
      .from("restaurant_subscriptions")
      .select("*, subscription_plans(*)")
      .eq("razorpay_subscription_id", razorpay_subscription_id)
      .single();

    if (subError || !sub) {
      console.error("❌ Subscription not found:", subError);
      return NextResponse.json({
        success: true,
        message: "Payment verified. Webhook will update subscription.",
      });
    }

    console.log("✅ Subscription found:", sub.id);
    console.log("Restaurant ID:", sub.restaurant_id);
    console.log("Billing cycle:", sub.billing_cycle);

    // ── Get Pro plan ───────────────────────────────────────────────────────
    const { data: proPlan } = await supabase
      .from("subscription_plans")
      .select("id, price_monthly, price_yearly")
      .eq("name", "pro")
      .single();

    if (!proPlan) {
      console.error("❌ Pro plan not found");
      return NextResponse.json({ error: "Plan not found" }, { status: 500 });
    }

    // ── Calculate period dates ─────────────────────────────────────────────
    const now = new Date();
    const periodStart = sub.current_period_start || now.toISOString();
    let periodEnd = sub.current_period_end;

    if (!periodEnd) {
      const endDate = new Date(periodStart);
      if (sub.billing_cycle === "yearly") {
        endDate.setFullYear(endDate.getFullYear() + 1);
      } else {
        endDate.setMonth(endDate.getMonth() + 1);
      }
      periodEnd = endDate.toISOString();
    }

    const amount = sub.billing_cycle === "yearly"
      ? proPlan.price_yearly
      : proPlan.price_monthly;

    console.log("💰 Payment amount:", amount, "paise (₹" + amount / 100 + ")");

    // ── Fetch payment method from Razorpay API ─────────────────────────────
    let paymentMethod: string | null = null;
    try {
      const paymentDetails = await razorpay.payments.fetch(razorpay_payment_id);
      const method = (paymentDetails as any).method ?? null;
      const vpa = (paymentDetails as any).vpa ?? null;
      const wallet = (paymentDetails as any).wallet ?? null;
      const bank = (paymentDetails as any).bank ?? null;

      if (method === "upi" && vpa) {
        paymentMethod = `upi (${vpa})`;
      } else if (method === "wallet" && wallet) {
        paymentMethod = `wallet (${wallet})`;
      } else if (method === "netbanking" && bank) {
        paymentMethod = `netbanking (${bank})`;
      } else {
        paymentMethod = method;
      }

      console.log("✅ Payment method fetched:", paymentMethod);
    } catch (err) {
      console.error("⚠️ Could not fetch payment method from Razorpay:", err);
      // Non-critical — continue without method
    }

    // ── Check for duplicate payment ────────────────────────────────────────
    const { data: existingPayment } = await supabase
      .from("payment_history")
      .select("id")
      .eq("razorpay_payment_id", razorpay_payment_id)
      .maybeSingle();

    if (existingPayment) {
      console.log("ℹ️ Payment already recorded:", existingPayment.id);

      // Still update method if it was null before
      if (paymentMethod) {
        await supabase
          .from("payment_history")
          .update({ payment_method: paymentMethod })
          .eq("razorpay_payment_id", razorpay_payment_id);
        console.log("✅ Payment method backfilled:", paymentMethod);
      }
    } else {
      // ── Record payment ───────────────────────────────────────────────────
      console.log("💾 Recording payment in payment_history...");

      const { data: payment, error: paymentError } = await supabase
        .from("payment_history")
        .insert({
          restaurant_id: sub.restaurant_id,
          subscription_id: sub.id,
          razorpay_payment_id: razorpay_payment_id,
          razorpay_order_id: null,         // always null for subscriptions
          amount: amount,
          currency: "INR",
          status: "success",
          payment_method: paymentMethod,
          description: `Subscription payment - ${sub.billing_cycle} plan`,
        })
        .select()
        .single();

      if (paymentError) {
        console.error("❌ Failed to record payment:", paymentError);
        // Non-critical — webhook will record it
      } else {
        console.log("✅ Payment recorded! Method:", paymentMethod);
        console.log("Payment record:", payment);
      }
    }

    // ── Update subscription to active ──────────────────────────────────────
    console.log("📝 Updating subscription to active...");
    const { data: updated, error: updateError } = await supabase
      .from("restaurant_subscriptions")
      .update({
        plan_id: proPlan.id,
        status: "active",
        current_period_start: periodStart,
        current_period_end: periodEnd,
        trial_start: null,
        trial_end: null,
        updated_at: new Date().toISOString(),
      })
      .eq("restaurant_id", sub.restaurant_id)
      .select();

    if (updateError) {
      console.error("❌ Failed to update subscription:", updateError);
      return NextResponse.json({ error: "Failed to update subscription" }, { status: 500 });
    }

    console.log("✅ Subscription updated successfully");
    console.log("Updated subscription:", updated);
    console.log("========== VERIFY PAYMENT END ==========");

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const error = err as { message?: string; stack?: string };
    console.error("❌ Verification error:", error);
    return NextResponse.json(
      { error: error.message ?? "Verification failed" },
      { status: 500 },
    );
  }
}