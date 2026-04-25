"use client";

import { useEffect, useState, useCallback } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import {
  Clock,
  User,
  CreditCard,
  Smartphone,
  Banknote,
  CheckCircle,
  ChefHat,
  UtensilsCrossed,
  DollarSign,
  XCircle,
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";

interface OrderItem {
  id: string;
  menu_item_id: string;
  quantity: number;
  price_at_time: number;
  special_instructions?: string;
  menu_items: { name: string };
}

interface Order {
  id: string;
  order_number: string;
  table_number: number;
  status: string;
  payment_method: string;
  payment_status: string;
  subtotal: number;
  tax: number;
  service_charge: number;
  total: number;
  created_at: string;
  order_items: OrderItem[];
}

const statusConfig = {
  pending: {
    label: "Pending",
    color: "bg-yellow-100 text-yellow-800",
    icon: Clock,
  },
  confirmed: {
    label: "Confirmed",
    color: "bg-blue-100 text-blue-800",
    icon: CheckCircle,
  },
  preparing: {
    label: "Preparing",
    color: "bg-purple-100 text-purple-800",
    icon: ChefHat,
  },
  ready: {
    label: "Ready",
    color: "bg-green-100 text-green-800",
    icon: UtensilsCrossed,
  },
  served: {
    label: "Served",
    color: "bg-gray-100 text-gray-800",
    icon: CheckCircle,
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-red-100 text-red-800",
    icon: XCircle,
  },
};

const statusFlow = ["pending", "confirmed", "preparing", "ready", "served"];

// Statuses where cancellation is allowed
const CANCELLABLE_STATUSES = ["pending", "confirmed", "preparing", "ready"];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "completed">(
    "active",
  );
  const [restaurantId, setRestaurantId] = useState<string | null>(null);

  // Cancel modal state
  const [cancelTarget, setCancelTarget] = useState<Order | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Get restaurant ID ───────────────────────────────────────
  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("restaurants")
        .select("id")
        .eq("owner_id", user.id)
        .maybeSingle();
      if (data) setRestaurantId(data.id);
    })();
  }, []);

  // ── Fetch orders ────────────────────────────────────────────
  const fetchOrders = useCallback(async () => {
    if (!restaurantId) return;
    try {
      let query = supabase
        .from("orders")
        .select(
          `
          *,
          order_items (
            id, menu_item_id, quantity, price_at_time,
            special_instructions, menu_items (name)
          )
        `,
        )
        .eq("restaurant_id", restaurantId)
        .order("created_at", { ascending: false });

      if (filter === "active")
        query = query.in("status", [
          "pending",
          "confirmed",
          "preparing",
          "ready",
        ]);
      if (filter === "completed")
        query = query.in("status", ["served", "cancelled"]);

      const { data, error } = await query;
      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error("Error fetching orders:", err);
    } finally {
      setLoading(false);
    }
  }, [restaurantId, filter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // ── Realtime ────────────────────────────────────────────────
  useEffect(() => {
    if (!restaurantId) return;
    const channel = supabase
      .channel("orders-channel")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        () => fetchOrders(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId, fetchOrders]);

  // ── Update order status ─────────────────────────────────────
  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", orderId)
        .eq("restaurant_id", restaurantId);
      if (error) throw error;

      await supabase.from("order_status_history").insert({
        order_id: orderId,
        status: newStatus,
        changed_by: "restaurant",
      });
      fetchOrders();
    } catch (err) {
      console.error("Error updating order status:", err);
      alert("Failed to update order status");
    }
  };

  // ── Update payment status ───────────────────────────────────
const updatePaymentStatus = async (order: Order, newPaymentStatus: string) => {
  try {
    const { error } = await supabase
      .from("orders")
      .update({ payment_status: newPaymentStatus })  // ✅ ONLY update payment_status
      .eq("id", order.id)
      .eq("restaurant_id", restaurantId);

    if (error) throw error;
    fetchOrders();
  } catch (err) {
    console.error("Error updating payment status:", err);
    alert("Failed to update payment status");
  }
};

  // ── Cancel order ────────────────────────────────────────────
  const handleCancelOrder = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: "cancelled" })
        .eq("id", cancelTarget.id)
        .eq("restaurant_id", restaurantId)
        .in("status", CANCELLABLE_STATUSES); // safety: only cancel if still active

      if (error) throw error;

      await supabase.from("order_status_history").insert({
        order_id: cancelTarget.id,
        status: "cancelled",
        changed_by: "restaurant",
      });

      setCancelTarget(null);
      showToast(`Order #${cancelTarget.order_number} cancelled`, "success");
      fetchOrders();
    } catch (err) {
      console.error("Cancel error:", err);
      showToast("Failed to cancel order. Please try again.", "error");
    } finally {
      setCancelling(false);
    }
  };

  const getNextStatus = (s: string) => {
    const i = statusFlow.indexOf(s);
    return i < statusFlow.length - 1 ? statusFlow[i + 1] : null;
  };
  const formatTime = (d: string) =>
    new Date(d).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  const formatCurrency = (n: number) => `₹${n.toFixed(2)}`;

  if (loading || !restaurantId) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading orders...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Filters */}
      <div className="flex space-x-2 mb-6">
        {(["all", "active", "completed"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg font-medium capitalize transition-colors ${
              filter === f
                ? "bg-orange-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <UtensilsCrossed className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No orders found
          </h3>
          <p className="text-gray-500">
            {filter === "active"
              ? "New orders will appear here automatically"
              : "No orders match your filter"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {orders.map((order) => {
            const StatusIcon =
              statusConfig[order.status as keyof typeof statusConfig]?.icon ??
              Clock;
            const nextStatus = getNextStatus(order.status);
            const canCancel = CANCELLABLE_STATUSES.includes(order.status);

            return (
              <div
                key={order.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-4 text-white">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <User className="w-5 h-5" />
                      <span className="font-semibold text-lg">
                        Table {order.table_number}
                      </span>
                    </div>
                    <span className="text-sm opacity-90">
                      #{order.order_number}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="opacity-90">
                      {formatTime(order.created_at)}
                    </span>
                    <span className="font-semibold">
                      {formatCurrency(order.total)}
                    </span>
                  </div>
                </div>

                {/* Order items */}
                <div className="p-4 border-b border-gray-100">
                  <div className="space-y-2">
                    {order.order_items.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between items-start"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {item.quantity}x {item.menu_items.name}
                          </p>
                          {item.special_instructions && (
                            <p className="text-sm text-gray-500 italic mt-1">
                              📝 {item.special_instructions}
                            </p>
                          )}
                        </div>
                        <span className="text-sm text-gray-600 ml-2">
                          {formatCurrency(item.price_at_time * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Payment & status */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      {order.payment_method === "upi" ? (
                        <Smartphone className="w-4 h-4 text-gray-500" />
                      ) : order.payment_method === "card" ? (
                        <CreditCard className="w-4 h-4 text-gray-500" />
                      ) : (
                        <Banknote className="w-4 h-4 text-gray-500" />
                      )}
                      <span className="text-sm text-gray-600 capitalize">
                        {order.payment_method}
                      </span>
                    </div>

                    {order.payment_status === "pending" ? (
                      <button
                        // Update this line to pass the full 'order' object
                        onClick={() => updatePaymentStatus(order, "paid")}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 hover:bg-yellow-200 transition-colors"
                      >
                        <DollarSign className="w-3 h-3" /> Mark as Paid
                      </button>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        ✓ Paid
                      </span>
                    )}
                  </div>

                  {/* Status badge */}
                  <div
                    className={`flex items-center justify-center space-x-2 py-2 rounded-lg mb-3 ${
                      statusConfig[order.status as keyof typeof statusConfig]
                        ?.color ?? "bg-gray-100 text-gray-800"
                    }`}
                  >
                    <StatusIcon className="w-4 h-4" />
                    <span className="font-medium text-sm">
                      {statusConfig[order.status as keyof typeof statusConfig]
                        ?.label ?? order.status}
                    </span>
                  </div>

                  {/* Advance status button */}
                  {nextStatus &&
                    order.status !== "served" &&
                    order.status !== "cancelled" && (
                      <button
                        onClick={() => updateOrderStatus(order.id, nextStatus)}
                        className="w-full bg-orange-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-orange-700 transition-colors mb-2"
                      >
                        Mark as{" "}
                        {
                          statusConfig[nextStatus as keyof typeof statusConfig]
                            ?.label
                        }
                      </button>
                    )}

                  {/* Cancel button — only for active orders */}
                  {canCancel && (
                    <button
                      onClick={() => setCancelTarget(order)}
                      className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-medium text-sm text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 hover:border-red-300 transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                      Cancel Order
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Cancel confirmation modal ── */}
      {cancelTarget && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget && !cancelling)
              setCancelTarget(null);
          }}
        >
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-[slideUp_0.25s_cubic-bezier(0.34,1.56,0.64,1)]">
            {/* Modal header */}
            <div className="bg-red-50 border-b border-red-100 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <XCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-gray-900">
                    Cancel this order?
                  </h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    This action cannot be undone.
                  </p>
                </div>
              </div>
            </div>

            {/* Order summary */}
            <div className="px-6 py-4">
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-5">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-gray-900">
                    Order #{cancelTarget.order_number}
                  </span>
                  <span className="text-sm font-bold text-gray-900">
                    ₹{cancelTarget.total.toFixed(2)}
                  </span>
                </div>
                <div className="flex gap-3 text-xs text-gray-500">
                  <span>Table {cancelTarget.table_number}</span>
                  <span>·</span>
                  <span>{formatTime(cancelTarget.created_at)}</span>
                  <span>·</span>
                  <span className="capitalize">
                    {cancelTarget.payment_method}
                  </span>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200 space-y-1">
                  {cancelTarget.order_items.map((item) => (
                    <p key={item.id} className="text-xs text-gray-600">
                      {item.quantity}× {item.menu_items.name}
                    </p>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setCancelTarget(null)}
                  disabled={cancelling}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Keep Order
                </button>
                <button
                  onClick={handleCancelOrder}
                  disabled={cancelling}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {cancelling ? (
                    <>
                      <svg
                        className="animate-spin w-4 h-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <circle cx="12" cy="12" r="10" strokeOpacity=".3" />
                        <path d="M12 2a10 10 0 0 1 10 10" />
                      </svg>
                      Cancelling…
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4" /> Yes, Cancel
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ── */}
      {toast && (
        <div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl text-sm font-semibold text-white transition-all
          ${toast.type === "success" ? "bg-green-600" : "bg-red-600"}`}
        >
          {toast.type === "success" ? "✅" : "❌"} {toast.msg}
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </DashboardLayout>
  );
}
