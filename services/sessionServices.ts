import { supabase } from "@/lib/supabase/client";

export async function createSession(
  restaurantId: string,
  tableId: string,
  tableNumber: number
) {
  const sessionToken = crypto.randomUUID();

  const { data, error } = await supabase
    .from("order_sessions")
    .insert({
      restaurant_id: restaurantId,
      table_id: tableId,
      table_number: tableNumber,
      session_token: sessionToken,
    })
    .select()
    .single();

  console.log("session data:", data, "error:", error);

  if (error) throw error;

  return data;
}