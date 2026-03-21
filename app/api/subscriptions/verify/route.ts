import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import crypto from "crypto";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

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
    console.log("Signature:", razorpay_signature);

    if (
      !razorpay_payment_id ||
      !razorpay_subscription_id ||
      !razorpay_signature
    ) {
      console.error("❌ Missing required fields");
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Verify signature
    const text = `${razorpay_payment_id}|${razorpay_subscription_id}`;
    console.log("Signature text:", text);

    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(text)
      .digest("hex");

    console.log("Generated signature:", generatedSignature);
    console.log("Received signature:", razorpay_signature);

    if (generatedSignature !== razorpay_signature) {
      console.error("❌ Invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    console.log("✅ Signature verified");

    // Find subscription
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

    // Get Pro plan
    const { data: proPlan } = await supabase
      .from("subscription_plans")
      .select("id, price_monthly, price_yearly")
      .eq("name", "pro")
      .single();

    if (!proPlan) {
      console.error("❌ Pro plan not found");
      return NextResponse.json({ error: "Plan not found" }, { status: 500 });
    }

    console.log("✅ Pro plan found:", proPlan.id);

    // Calculate period dates if not set
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

    // Calculate payment amount
    const amount =
      sub.billing_cycle === "yearly"
        ? proPlan.price_yearly
        : proPlan.price_monthly;

    console.log("💰 Payment amount:", amount, "paise (₹" + amount / 100 + ")");

    // Check if payment already recorded (prevent duplicates)
    const { data: existingPayment, error: checkError } = await supabase
      .from("payment_history")
      .select("id")
      .eq("razorpay_payment_id", razorpay_payment_id)
      .maybeSingle();

    if (checkError) {
      console.error("Error checking existing payment:", checkError);
    }

    if (existingPayment) {
      console.log("ℹ️  Payment already recorded:", existingPayment.id);
    } else {
      // Record payment in payment_history
      console.log("💾 Recording payment in payment_history...");
      console.log("Data to insert:", {
        restaurant_id: sub.restaurant_id,
        subscription_id: sub.id,
        razorpay_payment_id: razorpay_payment_id,
        amount: amount,
        currency: "INR",
        status: "success",
        description: `Subscription payment - ${sub.billing_cycle} plan`,
      });

      const { data: payment, error: paymentError } = await supabase
        .from("payment_history")
        .insert({
          restaurant_id: sub.restaurant_id,
          subscription_id: sub.id,
          razorpay_payment_id: razorpay_payment_id,

          amount: amount,
          currency: "INR",
          status: "success",
          payment_method: "card",
          description: `Subscription payment - ${sub.billing_cycle} plan`,
        })
        .select()
        .single();

      if (paymentError) {
        console.error("❌ Failed to record payment:", paymentError);
        console.error(
          "Payment error details:",
          JSON.stringify(paymentError, null, 2),
        );
        // Don't fail the whole request - webhook will record it
      } else {
        console.log("✅ Payment recorded successfully!");
        console.log("Payment record:", payment);
      }
    }

    // Update subscription to active
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
      return NextResponse.json(
        { error: "Failed to update subscription" },
        { status: 500 },
      );
    }

    console.log("✅ Subscription updated successfully");
    console.log("Updated subscription:", updated);
    console.log("========== VERIFY PAYMENT END ==========");

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const error = err as { message?: string; stack?: string };
    console.error("❌ Verification error:", error);
    console.error("Error stack:", error.stack);
    return NextResponse.json(
      { error: error.message ?? "Verification failed" },
      { status: 500 },
    );
  }
}
