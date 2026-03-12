import type { Metadata } from "next";
import { fetchRestaurantMetadata } from "@/utils/fetchRestaurantMetadata";
import CheckoutClientPage from "./clientPage";

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
    title: `Cart | ${restaurant.restaurantName}`,
    description: "Review your cart before confirming your order.",
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

export default function page() {
  return <CheckoutClientPage />;
}
