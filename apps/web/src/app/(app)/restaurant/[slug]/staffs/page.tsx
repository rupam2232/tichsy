import type { Metadata } from "next";
import { fetchRestaurantMetadata } from "@/utils/fetchRestaurantMetadata";
import ClientPage from "./clientPage";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const restaurant = await fetchRestaurantMetadata(slug);
  if (!restaurant) {
    return {
      title: "Restaurant not found",
      description: "The requested restaurant could not be found.",
    };
  }
  return {
    title: `Staffs | ${restaurant.restaurantName} - Tichsy`,
    description: `Manage staffs for your restaurant.`,
  };
}

export default function page() {
  return <ClientPage />;
}
