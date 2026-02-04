import type { Metadata } from "next";
import { fetchRestaurantMetadata } from "@/utils/fetchRestaurantMetadata";
import MenuClientPage from "./clientPage";

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
    title: `Menu | ${restaurant.restaurantName}`,
    description:
      restaurant.description ||
      `See what's available at ${restaurant.restaurantName}.`,
    icons: [
      {
        rel: "icon",
        url:
          restaurant.logoUrl?.replace("/upload/", "/upload/r_max/") ||
          `${process.env.NEXT_PUBLIC_CLIENT_BASE_URL}/favicon.ico`,
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
            `${process.env.NEXT_PUBLIC_CLIENT_BASE_URL}/favicon.ico`,
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
