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
    title: `Dashboard | ${restaurant.restaurantName} - ${process.env.NEXT_PUBLIC_APP_NAME}`,
    description: `View your restaurant's performance and orders.`,
  };
}

export default function page() {
  return <ClientPage />;
}
