import { supabase } from "@/lib/supabase/client"

async function getSessionId(sessionToken: string) {

  const { data } = await supabase
    .from("order_sessions")
    .select("id")
    .eq("session_token", sessionToken)
    .single()

  return data?.id
}

export async function increaseCart(sessionToken: string, menuItemId: string) {

  const sessionId = await getSessionId(sessionToken)

  const { data: existing } = await supabase
    .from("carts")
    .select("*")
    .eq("session_token", sessionId)
 
    .maybeSingle()

  if (existing) {

await supabase
  .from("carts")
  .update({
    items: items,
    total: items.reduce((sum, i) => sum + i.price * i.quantity, 0)
  })
  .eq("session_token", sessionToken)

  } else {

    await supabase
      .from("carts")
      .insert({
        session_token: sessionId,
      })

  }
}

export async function decreaseCart(sessionToken: string, menuItemId: string) {
  const sessionId = await getSessionId(sessionToken)
  console.log("sessionId:", sessionId)

  const { data: existing, error } = await supabase
    .from("carts")
    .select("*")
    .eq("session_token", sessionId)
    .maybeSingle()

  console.log("existing:", existing, "error:", error)

  if (!existing) return

  console.log("quantity:", existing.quantity)

  if (existing.quantity <= 1) {
    const { error: deleteError } = await supabase
      .from("carts")
      .delete()
      .eq("id", existing.id)

    console.log("deleteError:", deleteError)  // 👈 is delete being blocked?
  } else {
    await supabase
      .from("carts")
      .update({ quantity: existing.quantity - 1 })
      .eq("id", existing.id)
  }
}

export async function getCart(sessionToken: string) {

  const { data: session } = await supabase
    .from("order_sessions")
    .select("id")
    .eq("session_token", sessionToken)
    .single()

  if (!session) return []

const { data } = await supabase
  .from("carts")
  .select("*")
  .eq("session_token", sessionToken)
  .maybeSingle();

  return data
}