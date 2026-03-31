"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ── Trial expiry check (runs once per session) ──────────────────────────────
async function expireTrialIfEnded(userId: string) {
  try {
    // Get the restaurant for this user
    const { data: restaurant } = await supabase
      .from("restaurants")
      .select("id")
      .eq("owner_id", userId)
      .single();

    if (!restaurant) return;

    // Get their subscription only if it's still marked as trialing
    const { data: sub } = await supabase
      .from("restaurant_subscriptions")
      .select("id, status, trial_end, plan_id")
      .eq("restaurant_id", restaurant.id)
      .eq("status", "trialing")
      .single();

    // Nothing to do if not trialing or trial hasn't ended yet
    if (!sub || !sub.trial_end) return;
    if (new Date(sub.trial_end) >= new Date()) return;

    // Look up the free plan id
    const { data: freePlan } = await supabase
      .from("subscription_plans")
      .select("id")
      .eq("name", "free")
      .single();

    if (!freePlan) return;

    // Flip to free
    await supabase
      .from("restaurant_subscriptions")
      .update({
        status: "free",
        plan_id: freePlan.id,
      })
      .eq("id", sub.id);

  } catch (err) {
    // Non-critical — silently ignore so auth flow is never blocked
    console.error("[trial-expiry]", err);
  }
}
// ────────────────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check active session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setLoading(false);

      // Run trial expiry check whenever a session is found
      if (currentUser) {
        expireTrialIfEnded(currentUser.id);
      }
    });

    // Listen for auth state changes (sign in, sign out, token refresh, etc.)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setLoading(false);

      // Also re-check on every sign-in event
      if (_event === "SIGNED_IN" && currentUser) {
        expireTrialIfEnded(currentUser.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      router.push("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}