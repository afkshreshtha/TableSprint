// components/CartUI.tsx (CLIENT)
"use client";

import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { clearCart, addItem, decreaseItem } from "@/store/slices/cartSlice";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useCartPersistence } from "@/hooks/useCartPersistence";
import { ShoppingCart, Plus, Minus, ArrowLeft, Edit3 } from "lucide-react";
import { useRouter } from "next/navigation";

interface Restaurant {
  id: string;
  name: string;
  slug: string;
  upi_id: string;
}

export default function CartUI({ restaurant }: { restaurant: Restaurant }) {
  const cart = useAppSelector((state) => state.cart);
  const dispatch = useAppDispatch();
  const { deleteCartFromSupabase } = useCartPersistence();
  const router = useRouter();
  
  const [paymentMarked, setPaymentMarked] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderLink, setOrderLink] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "cash">("upi");
  
  // Special instructions state
  const [specialInstructions, setSpecialInstructions] = useState<Record<string, string>>({});
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  // Calculate totals
  const subtotal = cart.total;
  const tax = subtotal * 0.05;
  const serviceCharge = subtotal * 0.1;
  const total = subtotal + tax + serviceCharge;

  // Build UPI string
  const upiParams = new URLSearchParams({
    pa: restaurant.upi_id || "",
    pn: restaurant.name,
    am: total.toFixed(2),
    cu: "INR",
    tn: `Order from ${restaurant.name}`,
  });
  const upiLink = `upi://pay?${upiParams.toString()}`;

  const handleIncrease = (itemId: string) => {
    const item = cart.items.find((i) => i.id === itemId);
    if (item) {
      dispatch(addItem({ ...item, quantity: 1 }));
    }
  };

  const handleDecrease = (itemId: string) => {
    const item = cart.items.find((i) => i.id === itemId);
    if (!item) return;

    if (item.quantity === 1) {
      const confirmRemove = confirm("Remove this item from cart?");
      if (confirmRemove) {
        dispatch(decreaseItem(itemId));
        // Remove special instructions for this item
        const newInstructions = { ...specialInstructions };
        delete newInstructions[itemId];
        setSpecialInstructions(newInstructions);
      }
    } else {
      dispatch(decreaseItem(itemId));
    }
  };

  const handleInstructionChange = (itemId: string, value: string) => {
    setSpecialInstructions(prev => ({
      ...prev,
      [itemId]: value
    }));
  };

const handlePlaceOrder = async () => {
  setIsProcessing(true);

  try {
    const sessionToken = sessionStorage.getItem("order_session");

    if (!sessionToken) {
      alert("Session not found. Please refresh and try again.");
      setIsProcessing(false);
      return;
    }

    const { data: existingSession, error: sessionError } = await supabase
      .from("order_sessions")
      .select("id, restaurant_id, table_id")
      .eq("session_token", sessionToken)
      .single();

    if (sessionError || !existingSession) {
      alert("Session expired. Please scan the QR code again.");
      setIsProcessing(false);
      return;
    }

    // ── SECURITY FIX: verify session belongs to THIS restaurant ──
    if (existingSession.restaurant_id !== restaurant.id) {
      alert("Session mismatch. Please scan the QR code again.");
      // Clear the bad session
      sessionStorage.removeItem("order_session");
      sessionStorage.removeItem("session_restaurant_id");
      dispatch(clearCart());
      setIsProcessing(false);
      return;
    }

    let tableNumber = null;
    if (existingSession.table_id) {
      const { data: tableData } = await supabase
        .from("tables")
        .select("table_number")
        .eq("id", existingSession.table_id)
        .single();

      tableNumber = tableData?.table_number || null;
    }

    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        session_id: existingSession.id,
        restaurant_id: existingSession.restaurant_id,  // ← from DB, not client
        table_id: existingSession.table_id,
        order_number: orderNumber,
        table_number: tableNumber || 0,
        subtotal,
        tax,
        service_charge: serviceCharge,
        total,
        payment_method: paymentMethod,
        payment_status: paymentMethod === "upi" ? "paid" : "pending",
        status: paymentMethod === "upi" ? "confirmed" : "pending",
      })
      .select()
      .single();

    if (orderError) {
      console.error("Order creation error:", orderError);
      alert(`Failed to create order: ${orderError.message}`);
      setIsProcessing(false);
      return;
    }

    if (!order) {
      alert("Failed to create order: No data returned");
      setIsProcessing(false);
      return;
    }

    const items = cart.items.map((item) => ({
      order_id: order.id,
      menu_item_id: item.id,
      quantity: item.quantity,
      price_at_time: item.price,
      price: item.price,
      name: item.name,
      special_instructions: specialInstructions[item.id] || null,
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(items);

    if (itemsError) {
      console.error("Order items error:", itemsError);
      alert(`Failed to add items: ${itemsError.message}`);
      setIsProcessing(false);
      return;
    }

    await supabase.from("order_status_history").insert({
      order_id: order.id,
      status: paymentMethod === "upi" ? "confirmed" : "pending",
    });

    const link = `${window.location.origin}/order/${order.id}`;
    setOrderLink(link);
    setPaymentMarked(true);

    dispatch(clearCart());
    deleteCartFromSupabase();
    setIsProcessing(false);
  } catch (err) {
    console.error("Unexpected error:", err);
    alert("An unexpected error occurred. Please try again.");
    setIsProcessing(false);
  }
};

  // Empty cart state
  if (!cart.items.length && !paymentMarked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
        <div className="bg-gradient-to-r from-orange-600 to-orange-700 text-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-orange-100 hover:text-white mb-4"
            >
              <ArrowLeft size={20} />
              Back to Menu
            </button>
            <h1 className="text-3xl sm:text-4xl font-bold">Your Cart</h1>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm">
            <ShoppingCart size={64} className="mx-auto text-gray-300 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-6">Add some delicious items from the menu!</p>
            <button
              onClick={() => router.back()}
              className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-semibold"
            >
              Browse Menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Success screen
  if (paymentMarked && orderLink) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
        <div className="bg-gradient-to-r from-green-600 to-green-700 text-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <h1 className="text-3xl sm:text-4xl font-bold">Order Confirmed!</h1>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-4">
          <div className="p-6 bg-green-100 border-2 border-green-500 rounded-2xl text-center">
            <p className="text-4xl mb-3">✅</p>
            <h2 className="text-2xl font-bold text-green-700 mb-2">
              Order Placed Successfully!
            </h2>
            <p className="text-green-600">Your order is being prepared</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
            <h3 className="font-semibold text-lg mb-4 text-center">
              📱 Track Your Order
            </h3>

            <div className="flex justify-center mb-4">
              <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
                <QRCodeSVG value={orderLink} size={180} />
              </div>
            </div>

            <p className="text-sm text-gray-600 text-center mb-4">
              Scan this QR code or save the link below to track from any device
            </p>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-300 mb-4">
              <p className="text-xs text-gray-500 mb-2">Your tracking link:</p>
              <p className="font-mono text-sm break-all text-blue-600">
                {orderLink}
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(orderLink);
                  alert("Link copied! 📋");
                }}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium"
              >
                📋 Copy Link
              </button>

              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: "Track My Order",
                      text: "Track my restaurant order",
                      url: orderLink,
                    });
                  }
                }}
                className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-medium"
              >
                📤 Share Link
              </button>

              <a
                href={`/orders`}
                className="block w-full bg-orange-600 text-white py-3 rounded-lg hover:bg-orange-700 font-medium text-center"
              >
                👀 View Order Status
              </a>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              💡 <strong>Tip:</strong> Bookmark this link or take a screenshot to
              track your order from any device!
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Cart view
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
      <div className="bg-gradient-to-r from-orange-600 to-orange-700 text-white sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-orange-100 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Menu
          </button>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">Your Cart</h1>
          <p className="text-orange-100">{cart.items.length} {cart.items.length === 1 ? 'item' : 'items'}</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cart.items.map((item) => (
              <div
                key={item.id}
                className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start gap-4 mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900">{item.name}</h3>
                    <p className="text-orange-600 font-semibold mt-1">
                      ₹{item.price.toFixed(2)}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                      <button
                        onClick={() => handleDecrease(item.id)}
                        className="p-2 text-gray-700 hover:bg-gray-200 rounded-md transition-colors"
                      >
                        <Minus size={18} />
                      </button>
                      <span className="w-8 text-center font-bold">{item.quantity}</span>
                      <button
                        onClick={() => handleIncrease(item.id)}
                        className="p-2 text-gray-700 hover:bg-gray-200 rounded-md transition-colors"
                      >
                        <Plus size={18} />
                      </button>
                    </div>

                    <div className="text-right">
                      <p className="font-bold text-gray-900">
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Special Instructions */}
                <div className="mt-3 pt-3 border-t border-gray-100">
                  {editingItemId === item.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={specialInstructions[item.id] || ""}
                        onChange={(e) => handleInstructionChange(item.id, e.target.value)}
                        placeholder="e.g., No onions, extra spicy, well done..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        rows={2}
                        autoFocus
                      />
                      <button
                        onClick={() => setEditingItemId(null)}
                        className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                      >
                        Done
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setEditingItemId(item.id)}
                      className="flex items-center gap-2 text-sm text-gray-600 hover:text-orange-600 transition-colors"
                    >
                      <Edit3 size={14} />
                      {specialInstructions[item.id] ? (
                        <span className="text-orange-600 font-medium">
                          "{specialInstructions[item.id]}"
                        </span>
                      ) : (
                        <span>Add special instructions</span>
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary - Same as before */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 sticky top-24">
              <h2 className="text-xl font-bold mb-4">Order Summary</h2>

              <div className="space-y-3 mb-4 pb-4 border-b">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal:</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tax (5%):</span>
                  <span>₹{tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Service (10%):</span>
                  <span>₹{serviceCharge.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex justify-between text-xl font-bold mb-6">
                <span>Total:</span>
                <span className="text-orange-600">₹{total.toFixed(2)}</span>
              </div>

              <h3 className="font-semibold mb-3">Payment Method</h3>
              <div className="flex gap-3 mb-6">
                <button
                  onClick={() => setPaymentMethod("upi")}
                  disabled={!restaurant.upi_id}
                  className={`flex-1 px-4 py-3 rounded-lg border-2 font-medium transition-all ${
                    paymentMethod === "upi"
                      ? "bg-orange-600 text-white border-orange-600"
                      : "bg-white text-gray-700 border-gray-300 hover:border-orange-400"
                  } ${!restaurant.upi_id ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  💳 UPI
                </button>
                <button
                  onClick={() => setPaymentMethod("cash")}
                  className={`flex-1 px-4 py-3 rounded-lg border-2 font-medium transition-all ${
                    paymentMethod === "cash"
                      ? "bg-orange-600 text-white border-orange-600"
                      : "bg-white text-gray-700 border-gray-300 hover:border-orange-400"
                  }`}
                >
                  💵 Cash
                </button>
              </div>

              {paymentMethod === "upi" && restaurant.upi_id && (
                <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="flex justify-center mb-3">
                    <QRCodeSVG value={upiLink} size={150} />
                  </div>
                  <p className="text-sm text-gray-600 text-center mb-2">
                    Scan QR with any UPI app
                  </p>
                  <a
                    href={upiLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full text-center bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 text-sm font-medium"
                  >
                    Open UPI App
                  </a>
                </div>
              )}

              {paymentMethod === "cash" && (
                <div className="mb-6 p-4 bg-green-50 rounded-xl border border-green-200">
                  <p className="text-sm text-gray-700">
                    Pay ₹{total.toFixed(2)} at the counter when picking up your order.
                  </p>
                </div>
              )}

              <button
                onClick={handlePlaceOrder}
                disabled={isProcessing || (paymentMethod === "upi" && !restaurant.upi_id)}
                className="w-full bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white py-4 rounded-xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:-translate-y-0.5 shadow-lg"
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Processing...
                  </span>
                ) : paymentMethod === "upi" ? (
                  "✓ I Paid - Confirm Order"
                ) : (
                  "Place Order"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}