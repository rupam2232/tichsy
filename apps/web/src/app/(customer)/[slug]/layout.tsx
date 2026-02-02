import type { Metadata } from "next";
import { RestaurantHeader } from "@/components/restaurant-header";
import { fetchRestaurantMetadata } from "@/utils/fetchRestaurantMetadata";
import { headers } from "next/headers";

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
  const headersList = await headers();
  const url = headersList.get("x-current-path") || "";

  const isBillPage = url
    .slice(1)
    .split("/")
    .some((p) => p === "bill");

  const restaurant = await fetchRestaurantMetadata(slug);

  if (!restaurant) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-lg text-gray-500">Restaurant not found.</p>
      </div>
    );
  }
  return (
    <>
      {!isBillPage && <RestaurantHeader restaurant={restaurant} />}
      {children}
      {modal}
    </>
  );
}
