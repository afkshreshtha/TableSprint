// app/orders/page.tsx
"use client";

import { supabase } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShoppingBag, ArrowLeft, TrendingUp, Package } from "lucide-react";

interface Order {
  id: string;
  order_number: string;
  status: string;
  total: number;
  payment_method: string;
  payment_status: string;
  created_at: string;
  restaurant_id: string;
  table_number: number;
}

interface Restaurant {
  id: string;
  name: string;
}

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [restaurants, setRestaurants] = useState<Record<string, Restaurant>>({});
  const [loading, setLoading] = useState(true);
  const [hasSession, setHasSession] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const statusConfig = {
    pending: { color: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: "📝", label: "Pending" },
    confirmed: { color: "bg-blue-100 text-blue-800 border-blue-200", icon: "✅", label: "Confirmed" },
    preparing: { color: "bg-orange-100 text-orange-800 border-orange-200", icon: "👨‍🍳", label: "Preparing" },
    ready: { color: "bg-green-100 text-green-800 border-green-200", icon: "🔔", label: "Ready" },
    served: { color: "bg-purple-100 text-purple-800 border-purple-200", icon: "🍽️", label: "Served" },
    cancelled: { color: "bg-red-100 text-red-800 border-red-200", icon: "❌", label: "Cancelled" },
  };

  // Fetch all orders for this session
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const sessionToken = sessionStorage.getItem("order_session");

        if (!sessionToken) {
          setHasSession(false);
          setLoading(false);
          return;
        }

        const { data: session, error: sessionError } = await supabase
          .from("order_sessions")
          .select("id")
          .eq("session_token", sessionToken)
          .single();

        if (sessionError || !session) {
          console.error("Session error:", sessionError);
          setHasSession(false);
          setLoading(false);
          return;
        }

        const { data: ordersData, error: ordersError } = await supabase
          .from("orders")
          .select("*")
          .eq("session_id", session.id)
          .order("created_at", { ascending: false });

        if (ordersError) {
          console.error("Orders fetch error:", ordersError);
          setError("Failed to load orders. Please try again.");
          setLoading(false);
          return;
        }

        if (ordersData && ordersData.length > 0) {
          setOrders(ordersData);

          const restaurantIds = [...new Set(ordersData.map((o) => o.restaurant_id))];
          const { data: restaurantsData, error: restaurantsError } = await supabase
            .from("restaurants")
            .select("id, name")
            .in("id", restaurantIds);

          if (restaurantsError) {
            console.error("Restaurants fetch error:", restaurantsError);
          } else if (restaurantsData) {
            const restaurantsMap: Record<string, Restaurant> = {};
            restaurantsData.forEach((r) => {
              restaurantsMap[r.id] = r;
            });
            setRestaurants(restaurantsMap);
          }
        }

        setLoading(false);
      } catch (err) {
        console.error("Unexpected error:", err);
        setError("An unexpected error occurred.");
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  // Real-time updates for ALL orders
  useEffect(() => {
    if (orders.length === 0) return;

    const channel = supabase
      .channel("all-orders")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
        },
        (payload) => {
          console.log("Order updated:", payload);

          setOrders((prevOrders) =>
            prevOrders.map((order) =>
              order.id === payload.new.id ? (payload.new as Order) : order
            )
          );

          const audio = new Audio("/notification.mp3");
          audio.play().catch((e) => console.log("Audio play failed:", e));

          if (Notification.permission === "granted") {
            const newOrder = payload.new as Order;
            const statusLabel = statusConfig[newOrder.status as keyof typeof statusConfig]?.label || newOrder.status;

            new Notification("Order Updated! 🎉", {
              body: `Order #${newOrder.order_number} is now ${statusLabel}`,
              icon: "/logo.png",
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orders]);

  // Request notification permission
  useEffect(() => {
    if (typeof window !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mb-4"></div>
          <p className="text-gray-600 font-medium">Loading your orders...</p>
        </div>
      </div>
    );
  }

  // No session state
  if (!hasSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
        <div className="bg-gradient-to-r from-orange-600 to-orange-700 text-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <h1 className="text-3xl sm:text-4xl font-bold">My Orders</h1>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-200">
            <ShoppingBag size={64} className="mx-auto text-gray-300 mb-4" />
            <h2 className="text-2xl font-bold mb-4">No Orders on This Device</h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Orders are stored per device. If you placed an order, use the tracking link you received.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link
                href="/track"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors"
              >
                Track Order by ID
              </Link>
              <Link
                href="/"
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold transition-colors"
              >
                Browse Restaurants
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
        <div className="bg-gradient-to-r from-red-600 to-red-700 text-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <h1 className="text-3xl sm:text-4xl font-bold">Error</h1>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-200">
            <p className="text-6xl mb-4">⚠️</p>
            <h2 className="text-2xl font-bold mb-4">Something Went Wrong</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-semibold"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // No orders state
  if (orders.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
        <div className="bg-gradient-to-r from-orange-600 to-orange-700 text-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <h1 className="text-3xl sm:text-4xl font-bold">My Orders</h1>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-200">
            <p className="text-6xl mb-4">🍽️</p>
            <h2 className="text-2xl font-bold mb-4">No Orders Yet</h2>
            <p className="text-gray-600 mb-6">
              Start by scanning a QR code at a restaurant table
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-semibold"
            >
              Browse Restaurants
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Orders list
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-orange-700 text-white sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold mb-2 flex items-center gap-3">
                <ShoppingBag size={32} />
                My Orders
              </h1>
              <p className="text-orange-100">{orders.length} {orders.length === 1 ? 'order' : 'orders'}</p>
            </div>
            <div className="flex items-center gap-2 bg-green-500 px-4 py-2 rounded-full text-sm font-medium shadow-lg">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              Live Updates
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Package size={24} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-xl">
                <TrendingUp size={24} className="text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Spent</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₹{orders.reduce((sum, order) => sum + order.total, 0).toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-100 rounded-xl">
                <ShoppingBag size={24} className="text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Active Orders</p>
                <p className="text-2xl font-bold text-gray-900">
                  {orders.filter(o => !['served', 'cancelled'].includes(o.status)).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {orders.map((order) => {
            const status = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.pending;
            const restaurant = restaurants[order.restaurant_id];

            return (
              <Link
                key={order.id}
                href={`/order/${order.id}`}
                className="block bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-200 p-6 border border-gray-200 group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900 group-hover:text-orange-600 transition-colors">
                        #{order.order_number}
                      </h3>
                      <div className={`px-3 py-1 rounded-full border text-xs font-medium ${status.color}`}>
                        {status.icon} {status.label}
                      </div>
                    </div>
                    {restaurant ? (
                      <p className="text-sm text-gray-600 font-medium flex items-center gap-2">
                        <span className="inline-block w-2 h-2 bg-orange-500 rounded-full"></span>
                        {restaurant.name}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-400 italic">Loading restaurant...</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        📅 {new Date(order.created_at).toLocaleDateString("en-IN")}
                      </span>
                      <span className="flex items-center gap-1">
                        🕐 {new Date(order.created_at).toLocaleTimeString("en-IN", { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                      <span className="flex items-center gap-1">
                        🪑 Table {order.table_number}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-2xl font-bold text-orange-600 mb-1">
                      ₹{order.total.toFixed(2)}
                    </p>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-gray-500 capitalize">
                        {order.payment_method}
                      </span>
                      <div className={`inline-block text-xs px-2 py-1 rounded ${
                        order.payment_status === "paid" 
                          ? "bg-green-100 text-green-700" 
                          : "bg-yellow-100 text-yellow-700"
                      }`}>
                        {order.payment_status === "paid" ? "✓ Paid" : "⏳ Pending"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 flex justify-end">
                  <span className="text-orange-600 font-medium text-sm group-hover:text-orange-700 flex items-center gap-2 transition-colors">
                    View Details 
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Bottom spacing */}
      <div className="h-8"></div>
    </div>
  );
}