import type { Metadata } from "next";
import { fetchRestaurantMetadata } from "@/utils/fetchRestaurantMetadata";
import {
  buildOgImageUrl,
  getRestaurantIcons,
  notFoundMeta,
} from "@/utils/og-utils";
import { notFound } from "next/navigation";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@repo/ui/components/empty";
import { Store } from "lucide-react";
import ClientFoodMenu from "@/components/features/menu/food-menu";

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
  const description = `Explore the full menu at ${restaurant.restaurantName}. Browse categories, view dishes, and place your order instantly from your table.`;
  const ogImageUrl = buildOgImageUrl(slug);

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

export default async function page({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tableId: string }>;
}) {
  const { slug } = await params;
  const { tableId } = await searchParams;
  const restaurant = await fetchRestaurantMetadata(slug);

  if (!restaurant) {
    return notFound();
  }
  if (restaurant.isArchived || !restaurant.isCurrentlyOpen) {
    return (
      <div className="flex flex-col flex-1 min-h-[calc(100vh-(var(--spacing)*16))]">
        <Empty className="animate-in fade-in slide-in-from-top-4 duration-500 p-0!">
          <EmptyHeader>
            <EmptyMedia variant="icon" className="size-9">
              <Store className="size-4" />
            </EmptyMedia>
            <EmptyTitle>Restaurant is closed</EmptyTitle>
            <EmptyDescription>
              Please try again later when the restaurant is open
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  return <ClientFoodMenu slug={slug} tableId={tableId} isStaffCreatingOrder={false} />;
}
