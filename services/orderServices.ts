import { supabase } from "@/lib/supabase/client";
import Razorpay from "razorpay";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function placeOrder(
  sessionToken: string,
  paymentMethod: "online" | "offline"
) {
  // 1️⃣ Get session
  const { data: session } = await supabase
    .from("order_sessions")
    .select("id, table_id, restaurant_id")
    .eq("session_token", sessionToken)
    .single();

  if (!session) throw new Error("Session not found");

  // 2️⃣ Get cart items
  const { data: cartItems } = await supabase
    .from("cart_items")
    .select("menu_item_id, quantity, menu_items(name, price)")
    .eq("session_id", session.id);

  if (!cartItems || cartItems.length === 0)
    throw new Error("Cart is empty");

  // 3️⃣ Calculate total
  const totalPrice = cartItems.reduce(
    (sum, item) => sum + item.quantity * item.menu_items.price,
    0
  );

  // 4️⃣ Create order
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert([
      {
        session_id: session.id,
        table_id: session.table_id,
        restaurant_id: session.restaurant_id,
        total_price: totalPrice,
        status: paymentMethod === "offline" ? "pending" : "payment_pending",
      },
    ])
    .select()
    .single();

  if (orderError || !order) throw new Error(orderError?.message || "Failed to create order");

  // 5️⃣ Insert order items
  const orderItemsPayload = cartItems.map((item) => ({
    order_id: order.id,
    menu_item_id: item.menu_item_id,
    name: item.menu_items.name,
    price: item.menu_items.price,
    quantity: item.quantity,
  }));

  const { error: itemsError } = await supabase
    .from("order_items")
    .insert(orderItemsPayload);

  if (itemsError) throw new Error(itemsError.message);

  // 6️⃣ Insert initial status
  await supabase.from("order_status_history").insert([
    { order_id: order.id, status: order.status },
  ]);

  // 7️⃣ Clear cart
  await supabase.from("cart_items").delete().eq("session_id", session.id);

  // 8️⃣ If online payment, create Razorpay order
  if (paymentMethod === "online") {
    const razorpayOrder = await razorpay.orders.create({
      amount: totalPrice * 100, // in paise
      currency: "INR",
      receipt: order.id,
      payment_capture: true,
    });

    return {
      order,
      razorpayOrder,
    };
  }

  // Offline payment
  return { order };
}