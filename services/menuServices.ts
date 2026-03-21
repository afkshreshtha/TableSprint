// menuServices.ts
import { createSupabaseServer } from "@/lib/supabase/server"

export async function getRestaurantMenu(restaurantId: string) {
  const supabase = await createSupabaseServer()
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .eq("restaurant_id", restaurantId)

  const { data: items } = await supabase
    .from("menu_items")
    .select("*")
    .eq("restaurant_id", restaurantId)

  return { categories, items }
}