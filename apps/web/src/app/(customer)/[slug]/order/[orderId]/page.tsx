import CustomerOrderDetailsClientPage from "./clientPage";
import type { Metadata } from "next";
import { fetchRestaurantMetadata } from "@/utils/fetchRestaurantMetadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const restaurant = await fetchRestaurantMetadata(slug);
  if (!restaurant) {
    return {
      title: "Page not found",
      description:
        "Sorry, we couldn't find the page you're looking for. It might have been removed, had its name changed, or is temporarily unavailable.",
    };
  }
  return {
    title: `Order Details | ${restaurant.restaurantName}`,
    description: `View your order details from ${restaurant.restaurantName}.`,
    icons: [
      {
        rel: "icon",
        url:
          restaurant.logoUrl?.replace("/upload/", "/upload/r_max/") ||
          `${process.env.NEXT_PUBLIC_APP_URL}/favicon.ico`,
      },
    ],
  };
}

export default function OrderDetailsPage() {
  return <CustomerOrderDetailsClientPage />;
}
