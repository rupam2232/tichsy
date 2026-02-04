import type { Metadata } from "next";
import { fetchRestaurantMetadata } from "@/utils/fetchRestaurantMetadata";
import ClientPage from "./clientPage";

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
    title: `Owner Dashboard | ${restaurant.restaurantName} - ${process.env.NEXT_PUBLIC_APP_NAME}`,
    description: `Manage your restaurant's owner dashboard.`,
  };
}

export default async function page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const userTimezone = "Asia/Kolkata";
  let initialStats = null;

  try {
    const { default: serverAxios } = await import("@/utils/server-axios");
    const response = await serverAxios.get(
      `/restaurant/${slug}/owner-dashboard-stats?timezone=${userTimezone}`,
    );
    if (response.data.success) {
      initialStats = response.data.data;
    }
  } catch (error) {
    console.error("Failed to fetch dashboard stats server-side:", error);
  }

  return <ClientPage initialStats={initialStats} slug={slug} />;
}
