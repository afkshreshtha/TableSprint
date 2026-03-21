"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/authContext";
import { supabase } from "@/lib/supabase/client";

type StaffRole = "owner" | "chef";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: StaffRole[]; // omit = any authenticated user (old behavior)
}

export default function ProtectedRoute({
  children,
  allowedRoles,
}: ProtectedRouteProps) {
  const { user, loading } = useAuth(); // ← your existing useAuth
  const router = useRouter();
  const [role, setRole] = useState<StaffRole | null>(null);
  const [roleLoading, setRoleLoading] = useState(!!allowedRoles);

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Check role only when allowedRoles is provided

  useEffect(() => {
    if (!allowedRoles || !user) return;

    const getRole = async () => {
      // Check if owner
      const { data: restaurant } = await supabase
        .from("restaurants")
        .select("id")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (restaurant) {
        setRole("owner");
        setRoleLoading(false);
        return;
      }

      // Check if chef
      const { data: staff } = await supabase
        .from("restaurant_staff")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

      console.log(user);
      setRole((staff?.role as StaffRole) ?? null);
      setRoleLoading(false);
    };

    getRole();
  }, [user, allowedRoles]);

  // Redirect if wrong role
  useEffect(() => {
    if (roleLoading || !allowedRoles || !role) return;

    if (!allowedRoles.includes(role)) {
      router.replace(role === "chef" ? "/dashboard/kitchen" : "/login");
    }
  }, [role, roleLoading, allowedRoles, router]);

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;
  if (allowedRoles && role && !allowedRoles.includes(role)) return null;

  return <>{children}</>;
}
