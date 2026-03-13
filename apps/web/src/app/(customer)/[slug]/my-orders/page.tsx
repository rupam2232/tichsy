import type { Metadata } from "next";
import { fetchRestaurantMetadata } from "@/utils/fetchRestaurantMetadata";
import {
  buildOgImageUrl,
  getRestaurantIcons,
  notFoundMeta,
} from "@/utils/og-utils";
import MyOrderClientPage from "./clientPage";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const restaurant = await fetchRestaurantMetadata(slug);

  if (!restaurant) {
    return notFoundMeta();
  }

  const title = `My Orders | ${restaurant.restaurantName}`;
  const description = `View your order history and track active orders at ${restaurant.restaurantName}.`;
  const ogImageUrl = buildOgImageUrl(slug, "my-orders");

  return {
    title,
    description,
    icons: getRestaurantIcons(restaurant.logoUrl),
    openGraph: {
      type: "website",
      locale: "en_US",
      url: `${process.env.NEXT_PUBLIC_APP_URL}/${slug}/my-orders`,
      title,
      description,
      siteName: "Tichsy",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${restaurant.restaurantName} – My Orders`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default function page() {
  return <MyOrderClientPage />;
}
