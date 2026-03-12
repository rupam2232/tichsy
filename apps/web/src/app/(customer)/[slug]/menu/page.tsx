import type { Metadata } from "next";
import { fetchRestaurantMetadata } from "@/utils/fetchRestaurantMetadata";
import MenuClientPage from "./clientPage";
import { getOptimizedUrl } from "@/utils/imageOptimizer";

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
    title: `Menu | ${restaurant.restaurantName}`,
    description:
      restaurant.description ||
      `See what's available at ${restaurant.restaurantName}.`,
    icons: [
      {
        rel: "icon",
        url: getOptimizedUrl(restaurant.logoUrl!, 40, 40, "r_max") || "",
      },
    ],
    openGraph: {
      title: `Menu | ${restaurant.restaurantName}`,
      description:
        restaurant.description ||
        `See what's available at ${restaurant.restaurantName}.`,
      images: [
        {
          url:
            restaurant.logoUrl?.replace("/upload/", "/upload/r_max/") ||
            `${process.env.NEXT_PUBLIC_APP_URL}/favicon.ico`,
          alt: restaurant.restaurantName,
        },
      ],
    },
    keywords: [
      restaurant.restaurantName,
      ...(Array.isArray(restaurant.categories) ? restaurant.categories : []),
      "Food",
      "Menu",
      "Restaurant",
    ],
  };
}

export default function page() {
  return <MenuClientPage />;
}
