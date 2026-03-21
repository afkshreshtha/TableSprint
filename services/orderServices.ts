import { supabase } from "@/lib/supabase/client";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  receipt?: string;
}

export async function placeOrder(
  sessionToken: string,
  paymentMethod: "online" | "offline"
) {
  // 1️⃣ Get session
  const { data: session } = await supabase
    .from("order_sessions")
    .select("id, table_id, table_number, restaurant_id")
    .eq("session_token", sessionToken)
    .single();

  if (!session) throw new Error("Session not found");

  // 2️⃣ Get cart
  const { data: cart } = await supabase
    .from("carts")
    .select("items, total")
    .eq("session_token", sessionToken)
    .maybeSingle();

  if (!cart) throw new Error("Cart is empty");

  const cartItems = cart.items as unknown as CartItem[];

  if (!cartItems || cartItems.length === 0) throw new Error("Cart is empty");

  // 3️⃣ Generate order number
  const { data: orderNumber } = await supabase.rpc("generate_order_number");

  // 4️⃣ Create order
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      session_id: session.id,
      table_id: session.table_id,
      table_number: session.table_number,
      restaurant_id: session.restaurant_id,
      order_number: orderNumber ?? `ORD-${Date.now()}`,
      subtotal: cart.total,
      total: cart.total,
      status: paymentMethod === "offline" ? "pending" : "payment_pending",
      payment_method: paymentMethod === "offline" ? "cash" : "online",
      payment_status: "pending",
    })
    .select()
    .single();

  if (orderError || !order)
    throw new Error(orderError?.message ?? "Failed to create order");

  // 5️⃣ Insert order items
  const orderItemsPayload = cartItems.map((item) => ({
    order_id: order.id,
    menu_item_id: item.id,
    name: item.name,
    price: item.price,
    price_at_time: item.price,
    quantity: item.quantity,
  }));

  const { error: itemsError } = await supabase
    .from("order_items")
    .insert(orderItemsPayload);

  if (itemsError) throw new Error(itemsError.message);

  // 6️⃣ Insert initial status history
  await supabase
    .from("order_status_history")
    .insert({ order_id: order.id, status: order.status ?? "pending" });

  // 7️⃣ Clear cart
  await supabase.from("carts").delete().eq("session_token", sessionToken);

  // 8️⃣ If online payment, create Razorpay order
  if (paymentMethod === "online") {
    const response = await fetch("/api/razorpay/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: cart.total,
        orderId: order.id,
      }),
    });

    const razorpayOrder = (await response.json()) as RazorpayOrder;
    return { order, razorpayOrder };
  }

  return { order };
}