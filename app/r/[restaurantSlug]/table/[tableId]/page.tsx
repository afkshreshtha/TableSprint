import { notFound } from "next/navigation";
import { getRestaurantBySlug } from "@/services/restaurantService";
import { getTableByNumber } from "@/services/tableServices";
import { getRestaurantMenu } from "@/services/menuServices";
import TableClient from "./TableClient";

interface Props {
  params: {
    restaurantSlug: string;
    tableId: string;
  };
}

export async function generateMetadata({ params }: Props) {
  const { restaurantSlug, tableId } = await params;
  const restaurant = await getRestaurantBySlug(restaurantSlug);
  return {
    title: `Order at ${restaurant.name}`,
    description: `Scan to view menu and place your order at ${restaurant.name}`,
    robots: "noindex", // Don't want individual table pages indexed
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
