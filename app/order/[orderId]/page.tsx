// app/order/[orderId]/page.tsx
"use client";

import { supabase } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Package, Clock, CreditCard } from "lucide-react";

interface Order {
  id: string;
  order_number: string;
  status: string;
  total: number;
  subtotal: number;
  tax: number;
  service_charge: number;
  payment_method: string;
  payment_status: string;
  created_at: string;
  table_number: number;
}

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  price_at_time: number;
  special_instructions: string | null;
}

export default function OrderPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  const steps = [
    { key: "pending", label: "Order Placed", icon: "📝", color: "yellow" },
    { key: "confirmed", label: "Confirmed", icon: "✅", color: "blue" },
    { key: "preparing", label: "Preparing", icon: "👨‍🍳", color: "orange" },
    { key: "ready", label: "Ready", icon: "🔔", color: "green" },
    { key: "served", label: "Served", icon: "🍽️", color: "purple" },
  ];

  // Fetch initial order data
  useEffect(() => {
    const fetchOrder = async () => {
      const { data: orderData } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();

      const { data: itemsData } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", orderId);

      setOrder(orderData);
      setOrderItems(itemsData || []);
      setLoading(false);
    };

    fetchOrder();
  }, [orderId]);

  // Real-time subscription
  useEffect(() => {
    if (typeof window !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission();
    }

    const channel = supabase
      .channel(`order-${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          console.log("Order updated:", payload);
          setOrder(payload.new as Order);

          const audio = new Audio("/notification.mp3");
          audio.play().catch((e) => console.log("Audio play failed:", e));

          if (Notification.permission === "granted") {
            new Notification("Order Updated! 🎉", {
              body: `Your order is now ${payload.new.status}`,
              icon: "/logo.png",
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mb-4"></div>
          <p className="text-gray-600 font-medium">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
        <div className="bg-gradient-to-r from-red-600 to-red-700 text-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <h1 className="text-3xl sm:text-4xl font-bold">Order Not Found</h1>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <p className="text-red-600 mb-6">The order you're looking for doesn't exist.</p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-semibold"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const currentStepIndex = steps.findIndex((step) => step.key === order.status);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-orange-700 text-white sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Package size={32} />
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold">
                Order #{order.order_number}
              </h1>
              <p className="text-orange-100 flex items-center gap-2 mt-1">
                <Clock size={16} />
                {new Date(order.created_at).toLocaleString()}
              </p>
            </div>
          </div>
          
          {/* Table Number Badge */}
          <div className="inline-flex items-center gap-2 bg-orange-500 px-4 py-2 rounded-full">
            <span className="text-sm font-medium">Table {order.table_number}</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Order Status Timeline */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200 mb-6">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                📍 Order Status
              </h2>

              <div className="space-y-6">
                {steps.map((step, index) => {
                  const isCompleted = index <= currentStepIndex;
                  const isCurrent = index === currentStepIndex;

                  return (
                    <div key={step.key} className="flex items-start gap-4">
                      {/* Icon/Circle */}
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl transition-all shadow-md ${
                            isCompleted
                              ? "bg-gradient-to-br from-green-500 to-green-600 text-white scale-110"
                              : "bg-gray-100 text-gray-400"
                          } ${isCurrent ? "ring-4 ring-green-200 animate-pulse" : ""}`}
                        >
                          {isCompleted ? "✓" : step.icon}
                        </div>
                        {index < steps.length - 1 && (
                          <div
                            className={`w-1 h-16 mt-2 rounded-full transition-all ${
                              isCompleted
                                ? "bg-gradient-to-b from-green-500 to-green-400"
                                : "bg-gray-200"
                            }`}
                          />
                        )}
                      </div>

                      {/* Text */}
                      <div className="flex-1 pt-3">
                        <p
                          className={`font-bold text-lg ${
                            isCompleted ? "text-green-600" : "text-gray-400"
                          }`}
                        >
                          {step.label}
                        </p>
                        {isCurrent && (
                          <div className="flex items-center gap-2 mt-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <p className="text-sm text-green-600 font-medium">
                              In Progress...
                            </p>
                          </div>
                        )}
                        {isCompleted && !isCurrent && (
                          <p className="text-sm text-gray-500 mt-1">✓ Completed</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                🍽️ Order Items
              </h2>
              <div className="space-y-4">
                {orderItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-start p-4 bg-gray-50 rounded-xl border border-gray-200"
                  >
                    <div className="flex-1">
                      <p className="font-bold text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                      {item.special_instructions && (
                        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-xs text-yellow-800 font-medium">
                            📝 Note: {item.special_instructions}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-orange-600">
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500">
                        ₹{item.price.toFixed(2)} each
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200 sticky top-24 space-y-6">
              {/* Payment Info */}
              <div className="pb-6 border-b">
                <h3 className="font-bold mb-3 flex items-center gap-2">
                  <CreditCard size={20} />
                  Payment Details
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                    <span className="text-2xl">💳</span>
                    <div>
                      <p className="text-sm text-gray-600">Method</p>
                      <p className="font-semibold text-gray-900 capitalize">
                        {order.payment_method}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                    <span className="text-2xl">
                      {order.payment_status === "paid" ? "✅" : "⏳"}
                    </span>
                    <div>
                      <p className="text-sm text-gray-600">Status</p>
                      <p className="font-semibold text-gray-900 capitalize">
                        {order.payment_status}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Price Breakdown */}
              <div>
                <h3 className="font-bold mb-3">Bill Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal:</span>
                    <span>₹{order.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Tax (5%):</span>
                    <span>₹{order.tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Service (10%):</span>
                    <span>₹{order.service_charge.toFixed(2)}</span>
                  </div>
                  <div className="pt-3 border-t-2 flex justify-between text-xl font-bold">
                    <span>Total:</span>
                    <span className="text-orange-600">₹{order.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Live Tracking Badge */}
              <div className="pt-6 border-t">
                <div className="flex items-center gap-2 bg-green-100 text-green-700 px-4 py-3 rounded-xl text-sm font-medium justify-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Live Tracking Active
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom spacing */}
      <div className="h-8"></div>
    </div>
  );
}