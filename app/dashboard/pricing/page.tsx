"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import ProtectedRoute from "@/lib/utils/protectedRoute";
import {
  Check,
  X,
  Loader2,
  CreditCard,
  AlertCircle,
  Zap,
  PauseCircle,
  PlayCircle,
  XCircle,
  Calendar,
  RefreshCw,
  Shield,
  ChevronRight,
} from "lucide-react";
import { useRazorpay } from "@/hooks/useRazorpay";

interface Plan {
  id: string;
  name: string;
  display_name: string;
  price_monthly: number;
  price_yearly: number;
  trial_days: number;
  features: any;
}

interface Subscription {
  id: string;
  plan_id: string;
  status: string;
  billing_cycle: string | null;
  trial_end: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  cancelled_at: string | null;
  razorpay_subscription_id: string | null;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; dot: string }
> = {
  active: {
    label: "Active",
    color: "text-emerald-700",
    bg: "bg-emerald-50 border-emerald-200",
    dot: "bg-emerald-500",
  },
  trialing: {
    label: "Trial",
    color: "text-blue-700",
    bg: "bg-blue-50 border-blue-200",
    dot: "bg-blue-500",
  },
  paused: {
    label: "Paused",
    color: "text-amber-700",
    bg: "bg-amber-50 border-amber-200",
    dot: "bg-amber-500",
  },
  cancelled: {
    label: "Cancelled",
    color: "text-red-700",
    bg: "bg-red-50 border-red-200",
    dot: "bg-red-500",
  },
  past_due: {
    label: "Past Due",
    color: "text-red-700",
    bg: "bg-red-50 border-red-200",
    dot: "bg-red-500",
  },
  created: {
    label: "Pending",
    color: "text-gray-600",
    bg: "bg-gray-50 border-gray-200",
    dot: "bg-gray-400",
  },
  free: {
    label: "Free",
    color: "text-gray-600",
    bg: "bg-gray-50 border-gray-200",
    dot: "bg-gray-400",
  },
};

export default function PricingPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    "monthly",
  );
  const [processing, setProcessing] = useState(false);
  const [startingTrial, setStartingTrial] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [pausing, setPausing] = useState(false);
  const razorpayLoaded = useRazorpay();

  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: restaurant } = await supabase
        .from("restaurants")
        .select("id")
        .eq("owner_id", user.id)
        .single();

      if (restaurant) {
        setRestaurantId(restaurant.id);

        const { data: plansData } = await supabase
          .from("subscription_plans")
          .select("*")
          .eq("is_active", true)
          .order("price_monthly", { ascending: true });

        setPlans(plansData || []);

        const { data: subData } = await supabase
          .from("restaurant_subscriptions")
          .select("*")
          .eq("restaurant_id", restaurant.id)
          .single();

        setSubscription(subData);
      }

      setLoading(false);
    };

    init();
  }, []);

  const handleStartTrial = async () => {
    if (!restaurantId) return;
    setStartingTrial(true);
    try {
      const { data: proPlan } = await supabase
        .from("subscription_plans")
        .select("id")
        .eq("name", "pro")
        .single();

      if (!proPlan) return;

      const trialStart = new Date();
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + 14);

      await supabase
        .from("restaurant_subscriptions")
        .update({
          plan_id: proPlan.id,
          status: "trialing",
          trial_start: trialStart.toISOString(),
          trial_end: trialEnd.toISOString(),
        })
        .eq("restaurant_id", restaurantId);

      alert("14-day trial started! Enjoy all Pro features.");
      window.location.reload();
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to start trial");
    } finally {
      setStartingTrial(false);
    }
  };

  const handleSubscribe = async () => {
    if (!restaurantId) return;
    if (
      !razorpayLoaded ||
      typeof window === "undefined" ||
      !(window as any).Razorpay
    ) {
      alert("Payment system is loading. Please try again.");
      return;
    }

    setProcessing(true);
    try {
      const { data: proPlan } = await supabase
        .from("subscription_plans")
        .select("id")
        .eq("name", "pro")
        .single();

      if (!proPlan) {
        alert("Plan not found");
        setProcessing(false);
        return;
      }

      const res = await fetch("/api/subscriptions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: proPlan.id,
          billingCycle,
          restaurantId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to create subscription");
        setProcessing(false);
        return;
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
        subscription_id: data.subscriptionId,
        name: "TableSprint",
        description: `${data.planName} - ${data.billingCycle}`,
        prefill: { name: data.name, email: data.email },
        theme: { color: "#ea580c" },
        handler: async function (response: any) {
          const paymentId = response?.razorpay_payment_id;
          const subscriptionId = response?.razorpay_subscription_id;
          const signature = response?.razorpay_signature;

          if (!paymentId || !subscriptionId || !signature) {
            alert("Payment response incomplete. Please contact support.");
            setProcessing(false);
            return;
          }

          try {
            const verifyRes = await fetch("/api/subscriptions/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_payment_id: paymentId,
                razorpay_subscription_id: subscriptionId,
                razorpay_signature: signature,
              }),
            });

            if (verifyRes.ok) {
              await new Promise((r) => setTimeout(r, 1500));
              alert("✅ Subscription activated successfully!");
              window.location.reload();
            } else {
              alert(
                "Payment verification failed. Contact support with ID: " +
                  paymentId,
              );
              setProcessing(false);
            }
          } catch {
            alert("Payment verification failed. Please contact support.");
            setProcessing(false);
          }
        },
        modal: { ondismiss: () => setProcessing(false) },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", (response: any) => {
        alert(
          "Payment failed: " +
            (response?.error?.description || "Unknown error"),
        );
        setProcessing(false);
      });
      rzp.open();
    } catch {
      alert("Failed to create subscription");
      setProcessing(false);
    }
  };

  const handleCancel = async () => {
    if (
      !restaurantId ||
      !confirm("Cancel subscription? You'll keep access until the period ends.")
    )
      return;
    setCancelling(true);
    try {
      const res = await fetch("/api/subscriptions/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restaurantId, cancelAtPeriodEnd: true }),
      });
      if (res.ok) {
        alert("Subscription will be cancelled at period end.");
        window.location.reload();
      } else {
        const d = await res.json();
        alert(d.error || "Failed to cancel");
      }
    } catch {
      alert("Failed to cancel subscription");
    } finally {
      setCancelling(false);
    }
  };

  const handlePause = async () => {
    if (
      !restaurantId ||
      !confirm("Pause your subscription? Billing stops until you resume.")
    )
      return;
    setPausing(true);
    try {
      const res = await fetch("/api/subscriptions/pause", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restaurantId }),
      });
      if (res.ok) {
        alert("Subscription paused.");
        window.location.reload();
      } else {
        const d = await res.json();
        alert(d.error || "Failed to pause");
      }
    } catch {
      alert("Failed to pause subscription");
    } finally {
      setPausing(false);
    }
  };

  const handleResume = async () => {
    if (!restaurantId) return;
    setPausing(true);
    try {
      const res = await fetch("/api/subscriptions/resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restaurantId }),
      });
      if (res.ok) {
        alert("Subscription resumed.");
        window.location.reload();
      } else {
        const d = await res.json();
        alert(d.error || "Failed to resume");
      }
    } catch {
      alert("Failed to resume subscription");
    } finally {
      setPausing(false);
    }
  };

  const getDaysRemaining = (endDate: string) =>
    Math.ceil(
      (new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    );

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["owner"]}>
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  const currentPlan = plans.find((p) => p.id === subscription?.plan_id);
  const isFree =
    currentPlan?.name === "free" || !subscription?.razorpay_subscription_id;
  const isTrialing = subscription?.status === "trialing";
  const isActive = subscription?.status === "active";
  const isPaused = subscription?.status === "paused";
  const isCancelled = subscription?.status === "cancelled";
  const hasProAccess = isActive || isTrialing || isPaused;
  const trialDaysLeft =
    isTrialing && subscription?.trial_end
      ? getDaysRemaining(subscription.trial_end)
      : 0;
  const periodDaysLeft = subscription?.current_period_end
    ? getDaysRemaining(subscription.current_period_end)
    : 0;
  const statusConfig = STATUS_CONFIG[subscription?.status || "free"];

  return (
    <ProtectedRoute allowedRoles={["owner"]}>
      <DashboardLayout>
        <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Subscription & Billing
            </h1>
            <p className="text-gray-500 mt-1 text-sm">
              Manage your TableSprint plan
            </p>
          </div>

          {/* ── ACTIVE SUBSCRIPTION MANAGEMENT CARD ── */}
          {(hasProAccess ||
            isPaused ||
            isCancelled ||
            subscription?.razorpay_subscription_id) && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              {/* Card Header */}
              <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Pro Plan</p>
                    <p className="text-sm text-gray-500 capitalize">
                      {subscription?.billing_cycle || "monthly"} billing
                    </p>
                  </div>
                </div>
                {/* Status Badge */}
                <div
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium ${statusConfig.bg} ${statusConfig.color}`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${statusConfig.dot}`}
                  />
                  {statusConfig.label}
                  {subscription?.cancel_at_period_end && isActive && (
                    <span className="text-xs font-normal">
                      · Cancels at period end
                    </span>
                  )}
                </div>
              </div>

              {/* Card Body */}
              <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Period Info */}
                <div className="flex items-start gap-3">
                  <Calendar className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-0.5">
                      {subscription?.cancel_at_period_end
                        ? "Expires"
                        : isPaused
                          ? "Paused since"
                          : "Renews"}
                    </p>
                    <p className="text-sm font-semibold text-gray-900">
                      {subscription?.current_period_end
                        ? new Date(
                            subscription.current_period_end,
                          ).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "—"}
                    </p>
                    {subscription?.current_period_end && !isPaused && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {periodDaysLeft > 0
                          ? `${periodDaysLeft} days remaining`
                          : "Expired"}
                      </p>
                    )}
                  </div>
                </div>

                {/* Billing Amount */}
                <div className="flex items-start gap-3">
                  <CreditCard className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-0.5">
                      Amount
                    </p>
                    <p className="text-sm font-semibold text-gray-900">
                      {subscription?.billing_cycle === "yearly"
                        ? `₹${(plans.find((p) => p.name === "pro")?.price_yearly || 0) / 100}/yr`
                        : `₹${(plans.find((p) => p.name === "pro")?.price_monthly || 0) / 100}/mo`}
                    </p>
                    {subscription?.billing_cycle === "yearly" && (
                      <p className="text-xs text-emerald-600 mt-0.5">
                        20% saved vs monthly
                      </p>
                    )}
                  </div>
                </div>

                {/* Trial Info */}
                {isTrialing && subscription?.trial_end && (
                  <div className="flex items-start gap-3">
                    <Zap className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-0.5">
                        Trial
                      </p>
                      <p className="text-sm font-semibold text-gray-900">
                        {trialDaysLeft} days left
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Ends{" "}
                        {new Date(subscription.trial_end).toLocaleDateString(
                          "en-IN",
                          { day: "numeric", month: "short" },
                        )}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Paused Banner */}
              {isPaused && (
                <div className="mx-6 mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3">
                  <PauseCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-amber-800">
                      Subscription is paused
                    </p>
                    <p className="text-xs text-amber-600 mt-0.5">
                      Billing is stopped. Resume anytime to continue your Pro
                      access.
                    </p>
                  </div>
                </div>
              )}

              {/* Cancel Warning */}
              {subscription?.cancel_at_period_end && isActive && (
                <div className="mx-6 mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
                  <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-800">
                      Cancellation scheduled
                    </p>
                    <p className="text-xs text-red-600 mt-0.5">
                      Your plan will downgrade to Free on{" "}
                      {subscription.current_period_end
                        ? new Date(
                            subscription.current_period_end,
                          ).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "long",
                          })
                        : "period end"}
                      . Your data will be preserved.
                    </p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="px-6 pb-5 flex flex-wrap gap-2">
                {isPaused ? (
                  <button
                    onClick={handleResume}
                    disabled={pausing}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                  >
                    {pausing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <PlayCircle className="w-4 h-4" />
                    )}
                    Resume Subscription
                  </button>
                ) : isActive && !subscription?.cancel_at_period_end ? (
                  <>
                    <button
                      onClick={handlePause}
                      disabled={pausing}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-amber-300 text-amber-700 text-sm font-medium rounded-lg hover:bg-amber-50 disabled:opacity-50 transition-colors"
                    >
                      {pausing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <PauseCircle className="w-4 h-4" />
                      )}
                      Pause Billing
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={cancelling}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-red-200 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
                    >
                      {cancelling ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <XCircle className="w-4 h-4" />
                      )}
                      Cancel Plan
                    </button>
                  </>
                ) : isTrialing ? (
                  <button
                    onClick={handleSubscribe}
                    disabled={processing}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors"
                  >
                    {processing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CreditCard className="w-4 h-4" />
                    )}
                    Subscribe to Continue
                  </button>
                ) : null}
              </div>
            </div>
          )}

          {/* ── TRIAL BANNER ── */}
          {isTrialing && subscription?.trial_end && (
            <div className="relative overflow-hidden bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg">
              <div className="absolute right-0 top-0 w-48 h-48 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="w-5 h-5" />
                  <span className="font-bold text-lg">Free Trial Active</span>
                </div>
                <p className="text-orange-100">
                  <strong className="text-white">{trialDaysLeft} days</strong>{" "}
                  remaining · All Pro features unlocked
                </p>
                <p className="text-orange-200 text-sm mt-1">
                  Trial ends{" "}
                  {new Date(subscription.trial_end).toLocaleDateString(
                    "en-IN",
                    { day: "numeric", month: "long", year: "numeric" },
                  )}
                </p>
              </div>
            </div>
          )}

          {/* ── BILLING TOGGLE (only for free/trial users) ── */}
          {!isActive && !isPaused && (
            <div className="flex justify-center">
              <div className="bg-gray-100 rounded-xl p-1 inline-flex gap-1">
                <button
                  onClick={() => setBillingCycle("monthly")}
                  className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                    billingCycle === "monthly"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingCycle("yearly")}
                  className={`px-5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                    billingCycle === "yearly"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Yearly
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                    −20%
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* ── PLANS GRID ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {plans.map((plan) => {
              const price =
                billingCycle === "yearly"
                  ? plan.price_yearly
                  : plan.price_monthly;
              const isCurrentPlan = currentPlan?.id === plan.id;
              const isPro = plan.name === "pro";

              const features = [
                {
                  label: `${plan.features.max_tables || "Unlimited"} tables`,
                  included: true,
                },
                {
                  label: `${plan.features.max_menu_items || "Unlimited"} menu items`,
                  included: true,
                },
                { label: "Unlimited orders", included: true },
                { label: "QR ordering", included: true },
                { label: "Kitchen display", included: true },
                {
                  label: "Chef staff account",
                  included: !!plan.features.staff_management,
                },

                {
                  label: "UPI payment links",
                  included: !!plan.features.payment_integration,
                },
                {
                  label: "Support",
                  included: !!plan.features.support,
                },
                {
                  label: "Custom branding",
                  included: !!plan.features.custom_branding,
                },
                {
                  label: `${plan.features.analytics || "Basic"} analytics`,
                  included: true,
                },
              ];

              return (
                <div
                  key={plan.id}
                  className={`relative rounded-2xl border-2 p-7 flex flex-col transition-shadow ${
                    isPro
                      ? "border-orange-500 bg-white shadow-xl shadow-orange-100"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  {isPro && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <span className="bg-orange-600 text-white text-xs font-bold px-4 py-1 rounded-full tracking-wide uppercase">
                        Recommended
                      </span>
                    </div>
                  )}

                  {/* Plan Header */}
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-3">
                      {plan.display_name}
                    </h3>
                    <div className="flex items-end gap-1">
                      <span className="text-4xl font-bold text-gray-900">
                        {price === 0
                          ? "Free"
                          : `₹${(price / 100).toLocaleString("en-IN")}`}
                      </span>
                      {price > 0 && (
                        <span className="text-gray-400 mb-1.5 text-sm">
                          /{billingCycle === "yearly" ? "yr" : "mo"}
                        </span>
                      )}
                    </div>
                    {billingCycle === "yearly" && price > 0 && (
                      <p className="text-sm text-emerald-600 mt-1 font-medium">
                        ₹
                        {(
                          (plan.price_monthly * 12 - price) /
                          100
                        ).toLocaleString("en-IN")}{" "}
                        saved vs monthly
                      </p>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="space-y-2.5 mb-8 flex-1">
                    {features.map((f) => (
                      <li key={f.label} className="flex items-center gap-2.5">
                        {f.included ? (
                          <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        ) : (
                          <X className="w-4 h-4 text-gray-300 flex-shrink-0" />
                        )}
                        <span
                          className={`text-sm ${f.included ? "text-gray-700" : "text-gray-400"}`}
                        >
                          {f.label}
                        </span>
                      </li>
                    ))}
                    <li className="text-xs text-gray-400 pt-1 pl-6">
                      {plan.features.support} support
                    </li>
                  </ul>

                  {/* CTA */}
                  <div className="space-y-2">
                    {/* Currently on this plan and it's pro with active/trial access */}
                    {isCurrentPlan && isPro && hasProAccess && (
                      <div className="flex items-center justify-center gap-2 px-4 py-3 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-semibold border border-emerald-200">
                        <Check className="w-4 h-4" />
                        Current Plan
                      </div>
                    )}

                    {/* Free plan — current */}
                    {isCurrentPlan && !isPro && (
                      <>
                        <div className="flex items-center justify-center px-4 py-3 bg-gray-50 text-gray-500 rounded-xl text-sm font-medium border border-gray-200">
                          Current Plan
                        </div>
                        <button
                          onClick={handleStartTrial}
                          disabled={startingTrial}
                          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-orange-600 text-white rounded-xl text-sm font-semibold hover:bg-orange-700 disabled:opacity-50 transition-colors"
                        >
                          {startingTrial ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Zap className="w-4 h-4" />
                          )}
                          Start 14-Day Free Trial
                        </button>
                      </>
                    )}

                    {/* Pro plan — user is on free */}
                    {isPro && !hasProAccess && !isCancelled && (
                      <>
                        {!isTrialing && (
                          <button
                            onClick={handleStartTrial}
                            disabled={startingTrial}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-orange-500 text-orange-600 rounded-xl text-sm font-semibold hover:bg-orange-50 disabled:opacity-50 transition-colors"
                          >
                            {startingTrial ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Zap className="w-4 h-4" />
                            )}
                            Start Free Trial
                          </button>
                        )}
                        <button
                          onClick={handleSubscribe}
                          disabled={processing}
                          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-orange-600 text-white rounded-xl text-sm font-semibold hover:bg-orange-700 disabled:opacity-50 transition-colors"
                        >
                          {processing ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <CreditCard className="w-4 h-4" />
                          )}
                          {isTrialing
                            ? "Subscribe to Continue"
                            : "Subscribe Now"}
                          <ChevronRight className="w-4 h-4 ml-auto" />
                        </button>
                      </>
                    )}

                    {/* Pro plan — cancelled, can resubscribe */}
                    {isPro && isCancelled && (
                      <button
                        onClick={handleSubscribe}
                        disabled={processing}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-orange-600 text-white rounded-xl text-sm font-semibold hover:bg-orange-700 disabled:opacity-50 transition-colors"
                      >
                        {processing ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <RefreshCw className="w-4 h-4" />
                        )}
                        Resubscribe
                      </button>
                    )}
                  </div>

                  {isPro &&
                    plan.trial_days > 0 &&
                    !hasProAccess &&
                    !isCancelled && (
                      <p className="text-center text-xs text-gray-400 mt-3">
                        {plan.trial_days}-day free trial · No credit card
                        required
                      </p>
                    )}
                </div>
              );
            })}
          </div>

          {/* ── INFO BOX ── */}
          <div className="p-5 bg-blue-50 border border-blue-100 rounded-2xl">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-2">
                  What happens when you downgrade?
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-blue-700">
                  <p>
                    · Your data is <strong>never deleted</strong>
                  </p>
                  <p>· Access 5 oldest tables & menu items on Free</p>
                  <p>
                    · Extra items hidden but <strong>preserved</strong>
                  </p>
                  <p>· Upgrade again to instantly restore everything</p>
                  <p>· Cancel anytime — access until period ends</p>
                  <p>· Pause billing without losing your plan</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
