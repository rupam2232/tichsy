import type { Metadata } from "next";
import { RestaurantHeader } from "@/components/layout/restaurant-header";
import { fetchRestaurantMetadata } from "@/utils/fetchRestaurantMetadata";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_APP_NAME,
  description: "See what's available at this restaurant.",
};

export default async function Layout({
  children,
  modal,
  params,
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
  params: Promise<{ slug: string }>;
}>) {
  const { slug } = await params;
  const restaurant = await fetchRestaurantMetadata(slug);

  if (!restaurant) {
    return notFound();
  }

  return (
    <>
      <RestaurantHeader restaurant={restaurant} />
      {modal}
      {children}
    </>
  );
}
