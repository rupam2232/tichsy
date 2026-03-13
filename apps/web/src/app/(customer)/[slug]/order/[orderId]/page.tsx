import CustomerOrderDetailsClientPage from "./clientPage";
import type { Metadata } from "next";
import { fetchRestaurantMetadata } from "@/utils/fetchRestaurantMetadata";
import {
  buildOgImageUrl,
  getRestaurantIcons,
  notFoundMeta,
} from "@/utils/og-utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; orderId: string }>;
}): Promise<Metadata> {
  const { slug, orderId } = await params;
  const restaurant = await fetchRestaurantMetadata(slug);

  if (!restaurant) {
    return notFoundMeta();
  }

  const title = `Order Details | ${restaurant.restaurantName}`;
  const description = `Track your order status in real time at ${restaurant.restaurantName}.`;
  const ogImageUrl = buildOgImageUrl(slug, "order");

  return {
    title,
    description,
    icons: getRestaurantIcons(restaurant.logoUrl),
    openGraph: {
      type: "website",
      locale: "en_US",
      url: `${process.env.NEXT_PUBLIC_APP_URL}/${slug}/order/${orderId}`,
      title,
      description,
      siteName: "Tichsy",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${restaurant.restaurantName} – Order Details`,
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

export default function OrderDetailsPage() {
  return <CustomerOrderDetailsClientPage />;
}
