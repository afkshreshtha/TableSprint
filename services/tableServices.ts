// tableServices.ts
import { createSupabaseServer } from "@/lib/supabase/server"

export async function getTableByNumber(restaurantId: string, tableNumber: number) {
  const supabase = await createSupabaseServer()
  const { data, error } = await supabase
    .from("tables")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .eq("table_number", tableNumber)
    .maybeSingle()

  if (error) {
    console.error(error)
    return null
  }
  return data
}