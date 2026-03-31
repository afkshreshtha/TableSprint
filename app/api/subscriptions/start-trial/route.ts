import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import type { Database } from "@/types/supabase";

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // server-side only
);

export async function POST(req: Request) {
  try {
    const { restaurantId } = await req.json();

    if (!restaurantId) {
      return NextResponse.json(
        { error: "Restaurant ID required" },
        { status: 400 }
      );
    }

    // 1️⃣ Check if trial already used
    const { data: sub, error: subError } = await supabase
      .from("restaurant_subscriptions")
      .select("trial_used")
      .eq("restaurant_id", restaurantId)
      .single();

    if (subError) {
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 }
      );
    }

    if (sub?.trial_used) {
      return NextResponse.json(
        { error: "Trial already used" },
        { status: 400 }
      );
    }

    // 2️⃣ Get PRO plan
    const { data: proPlan, error: planError } = await supabase
      .from("subscription_plans")
      .select("id, trial_days")
      .eq("name", "pro")
      .single();

    if (!proPlan || planError) {
      return NextResponse.json(
        { error: "Pro plan not found" },
        { status: 404 }
      );
    }

    // 3️⃣ Calculate dates
    const trialStart = new Date();
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + (proPlan.trial_days || 14));

    // 4️⃣ Update subscription
    const { error: updateError } = await supabase
      .from("restaurant_subscriptions")
      .update({
        plan_id: proPlan.id,
        status: "trialing",
        trial_start: trialStart.toISOString(),
        trial_end: trialEnd.toISOString(),
        trial_used: true, // 🔥 important
        updated_at: new Date().toISOString(),
      })
      .eq("restaurant_id", restaurantId);

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to start trial" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Trial started successfully",
      trialEnd,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Something went wrong" },
      { status: 500 }
    );
  }
}
