// app/r/[restaurantSlug]/cart/page.tsx (SERVER)
import { supabase } from "@/lib/supabase/client"
import { notFound } from "next/navigation"
import CartUI from "@/components/CartUI"
// ❌ Remove SessionInitializer import

interface Props {
  params: Promise<{ restaurantSlug: string }>
}

export default async function CartPage({ params }: Props) {
  const { restaurantSlug } = await params

  const { data: restaurant, error } = await supabase
    .from("restaurants")
    .select("*")
    .eq("slug", restaurantSlug)
    .single()

  if (error || !restaurant) {
    notFound()
  }

  // ✅ No need to pass tableId - it comes from the session
  return <CartUI restaurant={restaurant} />
}