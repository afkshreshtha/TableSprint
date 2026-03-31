import { notFound } from "next/navigation";
import { getRestaurantBySlug } from "@/services/restaurantService";
import { getTableByNumber } from "@/services/tableServices";
import { getRestaurantMenu } from "@/services/menuServices";
import TableClient from "./TableClient";
import type { Metadata } from "next";

interface Props {
  params: {
    restaurantSlug: string;
    tableId: string;
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { restaurantSlug, tableId } = await params;
  const restaurant = await getRestaurantBySlug(restaurantSlug);

  return {
    title: `Order at ${restaurant?.name ?? "Restaurant"}`,
    description: `Scan to view menu and place your order at ${restaurant?.name ?? "this restaurant"}`,
    robots: {
      index: false, // ✅ Correct typed format instead of raw string
      follow: false,
    },
  };
}

export default async function Page({ params }: Props) {
  const { restaurantSlug, tableId } = await params;

  const restaurant = await getRestaurantBySlug(restaurantSlug);

  if (!restaurant) notFound();

  const table = await getTableByNumber(restaurant.id, Number(tableId));

  if (!table) notFound();

  const { categories, items } = await getRestaurantMenu(restaurant.id);

  return (
    <TableClient
      restaurant={restaurant}
      table={table}
      categories={categories ?? []}
      items={items ?? []}
    />
  );
}
