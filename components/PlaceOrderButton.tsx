"use client";

import { useState } from "react";
import { placeOrder } from "@/services/orderServices";
import { useRouter } from "next/navigation";

export default function PlaceOrderButton({ sessionToken, restaurantSlug }: any) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handlePlaceOrder = async (paymentMethod: "online" | "offline") => {
    try {
      setLoading(true);
      const { order, razorpayOrder } = await placeOrder(sessionToken, paymentMethod);

      if (paymentMethod === "offline") {
        alert("Order placed! Pay at the counter.");
        router.push(`/r/${restaurantSlug}/order/${order.id}`);
        return;
      }

      // 🔹 Online payment via Razorpay checkout
      const options: any = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: razorpayOrder?.amount,
        currency: razorpayOrder?.currency,
        name: "Your Restaurant Name",
        description: `Order #${order.id}`,
        order_id: razorpayOrder?.id,
        handler: async function (response: any) {
          // Call webhook or update order status
          alert("Payment successful!");
          router.push(`/r/${restaurantSlug}/order/${order.id}`);
        },
        prefill: {
          name: "",
          email: "",
        },
        theme: {
          color: "#2463eb",
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      console.error(err);
      alert("Failed to place order: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-4">
      <button
        onClick={() => handlePlaceOrder("online")}
        className="bg-green-600 text-white px-6 py-2 rounded-md"
        disabled={loading}
      >
        Pay Online
      </button>

      <button
        onClick={() => handlePlaceOrder("offline")}
        className="bg-gray-600 text-white px-6 py-2 rounded-md"
        disabled={loading}
      >
        Pay at Counter
      </button>
    </div>
  );
}