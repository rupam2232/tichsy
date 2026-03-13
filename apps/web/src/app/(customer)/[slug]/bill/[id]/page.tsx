import BillReceipt from "@/components/features/orders/bill-receipt";
import { fetchRestaurantMetadata } from "@/utils/fetchRestaurantMetadata";
import {
  buildOgImageUrl,
  getRestaurantIcons,
  notFoundMeta,
} from "@/utils/og-utils";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}): Promise<Metadata> {
  const { slug, id } = await params;
  const restaurant = await fetchRestaurantMetadata(slug);

  if (!restaurant) {
    return notFoundMeta();
  }

  const title = `Bill | ${restaurant.restaurantName}`;
  const description = `View and print your bill from ${restaurant.restaurantName}.`;
  const ogImageUrl = buildOgImageUrl(slug, "bill");

  return {
    title,
    description,
    icons: getRestaurantIcons(restaurant.logoUrl),
    openGraph: {
      type: "website",
      locale: "en_US",
      url: `${process.env.NEXT_PUBLIC_APP_URL}/${slug}/bill/${id}`,
      title,
      description,
      siteName: "Tichsy",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${restaurant.restaurantName} – Bill`,
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

const billPage = async ({
  params,
}: {
  params: Promise<{ id: string; slug: string }>;
}) => {
  const { id, slug } = await params;
  return (
    <>
      <BillReceipt orderId={id} restaurantSlug={slug} />
    </>
  );
};

export default billPage;
