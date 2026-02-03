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
      title: "Restaurant not found",
      description: "The requested restaurant could not be found.",
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
          `${process.env.NEXT_PUBLIC_CLIENT_BASE_URL}/favicon.ico`,
      },
    ],
  };
}

export default function OrderDetailsPage() {
  return <CustomerOrderDetailsClientPage />;
}
