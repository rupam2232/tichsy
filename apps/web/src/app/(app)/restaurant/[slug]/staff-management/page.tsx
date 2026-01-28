import type { Metadata } from "next";
import { fetchRestaurantDetails } from "@/utils/fetchRestaurantDetails";
import ClientPage from "./clientPage";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const restaurant = await fetchRestaurantDetails(slug);
  if (!restaurant) {
    return {
      title: "Restaurant not found",
      description: "The requested restaurant could not be found.",
    };
  }
  return {
    title: `Staff Management | ${restaurant.restaurantName} - ${process.env.NEXT_PUBLIC_APP_NAME}`,
    description: `Manage your restaurant's staff.`,
  };
}

export default function page() {
  return <ClientPage />;
}
