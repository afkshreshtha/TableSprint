import { supabase } from "@/lib/supabase/client";
import type { Database } from "@/types/supabase";

type CartRow = Database["public"]["Tables"]["carts"]["Row"];

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

function parseItems(raw: CartRow["items"]): CartItem[] {
  if (!Array.isArray(raw)) return [];
  return raw as unknown as CartItem[];
}

// carts.session_token stores the session_token directly (not the session UUID)
async function getExistingCart(sessionToken: string): Promise<CartRow | null> {
  const { data } = await supabase
    .from("carts")
    .select("*")
    .eq("session_token", sessionToken)
    .maybeSingle();

  return data;
}

export async function increaseCart(sessionToken: string, menuItemId: string) {
  // Fetch the menu item to get name + price
  const { data: menuItem } = await supabase
    .from("menu_items")
    .select("id, name, price")
    .eq("id", menuItemId)
    .single();

  if (!menuItem) return;

  const existing = await getExistingCart(sessionToken);

  if (existing) {
    const items = parseItems(existing.items);
    const idx = items.findIndex((i) => i.id === menuItemId);

    if (idx !== -1) {
      items[idx].quantity += 1;
    } else {
      items.push({ id: menuItem.id, name: menuItem.name, price: menuItem.price, quantity: 1 });
    }

    const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

    await supabase
      .from("carts")
      .update({ items, total, updated_at: new Date().toISOString() })
      .eq("session_token", sessionToken);
  } else {
    const items: CartItem[] = [
      { id: menuItem.id, name: menuItem.name, price: menuItem.price, quantity: 1 },
    ];
    const total = menuItem.price;

    await supabase.from("carts").insert({
      session_token: sessionToken,
      items,
      total,
    });
  }
}

export async function decreaseCart(sessionToken: string, menuItemId: string) {
  const existing = await getExistingCart(sessionToken);
  if (!existing) return;

  const items = parseItems(existing.items);
  const idx = items.findIndex((i) => i.id === menuItemId);
  if (idx === -1) return;

  if (items[idx].quantity <= 1) {
    items.splice(idx, 1);
  } else {
    items[idx].quantity -= 1;
  }

  if (items.length === 0) {
    await supabase.from("carts").delete().eq("session_token", sessionToken);
  } else {
    const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    await supabase
      .from("carts")
      .update({ items, total, updated_at: new Date().toISOString() })
      .eq("session_token", sessionToken);
  }
}

export async function getCart(sessionToken: string): Promise<CartItem[]> {
  const existing = await getExistingCart(sessionToken);
  if (!existing) return [];
  return parseItems(existing.items);
}