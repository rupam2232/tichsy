import type { Metadata } from "next";
import { fetchRestaurantMetadata } from "@/utils/fetchRestaurantMetadata";
import {
  buildOgImageUrl,
  getRestaurantIcons,
  notFoundMeta,
} from "@/utils/og-utils";
import MenuClientPage from "./clientPage";

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

  const title = `Menu | ${restaurant.restaurantName}`;
  const description =
    `Explore the full menu at ${restaurant.restaurantName}. Browse categories, view dishes, and place your order instantly from your table.`;
  const ogImageUrl = buildOgImageUrl(slug, "menu");

  return {
    title,
    description,
    keywords: [
      restaurant.restaurantName,
      ...(restaurant.categories || []),
      "food menu",
      "restaurant menu",
      "QR ordering",
      "digital menu",
      "order food",
    ],
    icons: getRestaurantIcons(restaurant.logoUrl),
    openGraph: {
      type: "website",
      locale: "en_US",
      url: `${process.env.NEXT_PUBLIC_APP_URL}/${slug}/menu`,
      title,
      description,
      siteName: "Tichsy",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${restaurant.restaurantName} – Browse Menu`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

export default function page() {
  return <MenuClientPage />;
}
