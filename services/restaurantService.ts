// restaurantService.ts
import { createSupabaseServer } from "@/lib/supabase/server"

export async function getRestaurantBySlug(slug: string) {
  const supabase = await createSupabaseServer()

  const { data, error } = await supabase
    .from("restaurants")
    .select("*")
    .eq("slug", slug)
    .single()

  if (error) {
    console.log("Restaurant fetch error:", error)
    return null
  }

  return data
}