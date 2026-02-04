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
    title: `Menu | ${restaurant.restaurantName} - ${process.env.NEXT_PUBLIC_APP_NAME}`,
    description: `Manage your restaurant ${restaurant.restaurantName} menu, and update settings.`,
  };
}

export default async function page({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { slug } = await params;
  const { tab = "all", search = "" } = await searchParams;

  let initialFoodItems = null;
  let initialCategories = [];

  try {
    const { default: serverAxios } = await import("@/utils/server-axios");
    const [categoriesResponse, foodItemsResponse] = await Promise.all([
      serverAxios.get(`/restaurant/${slug}/categories`),
      serverAxios.get(
        `/food-item/${slug}?${tab !== "search" ? `tab=${tab}` : ""}${
          search ? `&search=${search}` : ""
        }&includeArchived=true`,
      ),
    ]);

    if (categoriesResponse.data.success) {
      initialCategories = categoriesResponse.data.data;
    }
    if (foodItemsResponse.data.success) {
      initialFoodItems = foodItemsResponse.data.data;
    }
  } catch (error) {
    console.error("Failed to fetch menu data server-side:", error);
  }

  return (
    <ClientPage
      initialFoodItems={initialFoodItems}
      initialCategories={initialCategories}
      slug={slug}
    />
  );
}
