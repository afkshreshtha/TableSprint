"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the hash fragment (everything after #)
        const hashParams = new URLSearchParams(
          window.location.hash.substring(1),
        );
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");

        // Also check for query params (PKCE flow)
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get("code");

        let user = null;

        // Handle implicit flow (hash-based tokens)
        if (accessToken && refreshToken) {
          console.log("✅ Found tokens in hash, setting session...");

          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            console.error("Session error:", error);
            setError(error.message);
            setTimeout(
              () =>
                router.push(
                  "/login?error=" + encodeURIComponent(error.message),
                ),
              2000,
            );
            return;
          }

          user = data.user;
        }

        // Handle PKCE flow (code-based)
        if (!user && code) {
          console.log("✅ Found code, exchanging for session...");

          const { data, error } =
            await supabase.auth.exchangeCodeForSession(code);

          if (error) {
            console.error("Code exchange error:", error);
            setError(error.message);
            setTimeout(
              () =>
                router.push(
                  "/login?error=" + encodeURIComponent(error.message),
                ),
              2000,
            );
            return;
          }

          user = data.user;
        }

        if (!user) {
          console.error("No authentication data found");
          setError("No authentication data received");
          setTimeout(() => router.push("/login?error=no_auth_data"), 2000);
          return;
        }

        console.log("✅ User authenticated:", user.email);

        // Check if staff (chef) first
        const { data: staffRecord, error: staffFetchError } = await supabase
          .from("restaurant_staff")
          .select("id, role, user_id, restaurant_id")
          .eq("email", user.email)
          .maybeSingle();

        console.log("👨‍🍳 Staff record:", staffRecord);

        if (staffRecord) {
          // Update user_id if it's null (first time login) using RPC function
          if (!staffRecord.user_id) {
            console.log("🔄 Claiming staff record...");

            const { data: claimResult, error: claimError } =
              await supabase.rpc("claim_staff_record");

            console.log("Claim result:", claimResult);

            if (claimError) {
              console.error("Claim error:", claimError);
              // Continue anyway - they might still be able to access kitchen
            } else if (claimResult && !claimResult.success) {
              console.error("Failed to claim:", claimResult.error);
            }
          }

          // Redirect chef to kitchen
          if (staffRecord.role === "chef") {
            console.log("🍳 Redirecting chef to kitchen...");
            router.push("/dashboard/kitchen");
            return;
          }
        }

        // Owner flow
        console.log("👔 Checking if user is owner...");
        const { data: existingRestaurant } = await supabase
          .from("restaurants")
          .select("id")
          .eq("owner_id", user.id)
          .maybeSingle();

        if (!existingRestaurant) {
          console.log("🏪 Creating new restaurant...");
          const restaurantName = `${user.user_metadata?.full_name ?? "My"} Restaurant`;
          const slug = restaurantName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");

          // Create restaurant
          const { data: newRestaurant, error: restaurantError } = await supabase
            .from("restaurants")
            .insert({
              owner_id: user.id,
              name: `${user.user_metadata?.full_name ?? "My"} Restaurant`,
              email: user.email,
              slug: slug || `resturant-${Date.now()}`,
            })
            .select()
            .single();

          if (restaurantError) {
            console.error("Error creating restaurant:", restaurantError);
            setError("Failed to create restaurant");
            return;
          }

          // Start with FREE plan
          const { data: freePlan } = await supabase
            .from("subscription_plans")
            .select("id")
            .eq("name", "free")
            .single();

          if (freePlan && newRestaurant) {
            await supabase.from("restaurant_subscriptions").insert({
              restaurant_id: newRestaurant.id,
              plan_id: freePlan.id,
              status: "free",
              billing_cycle: null,
            });

            console.log("✅ Started on Free plan");
          }
        }

        console.log("📊 Redirecting owner to dashboard...");
        router.push("/dashboard");
      } catch (err: unknown) {
        const error = err as { message?: string };
        console.error("Callback error:", error);
        setError(error.message ?? "Authentication failed");
        setTimeout(
          () =>
            router.push(
              "/login?error=" +
                encodeURIComponent(error.message ?? "auth_failed"),
            ),
          2000,
        );
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 flex items-center justify-center p-4">
      <div className="text-center">
        {error ? (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <p className="text-gray-900 font-semibold mb-2">
              Authentication Error
            </p>
            <p className="text-gray-600 text-sm">{error}</p>
            <p className="text-gray-500 text-xs mt-2">
              Redirecting to login...
            </p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-900 font-semibold mb-2">
              Completing sign in...
            </p>
            <p className="text-gray-600 text-sm">
              Please wait while we set up your account
            </p>
          </>
        )}
      </div>
    </div>
  );
}
