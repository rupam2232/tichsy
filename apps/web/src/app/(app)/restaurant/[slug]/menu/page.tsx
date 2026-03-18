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
    title: `Menu | ${restaurant.restaurantName} - Tichsy`,
    description: `Manage your restaurant ${restaurant.restaurantName} menu, and update settings.`,
  };
}

export default async function page(props: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  // const { params, searchParams } = props;
  const params = await props.params;
  const searchParams = await props.searchParams;
  const slug = params.slug;
  const { tab = "all", search = "" } = searchParams;
  let initialFoodItems = null;
  let initialCategories = [];

  try {
    const { default: serverAxios } = await import("@/utils/server-axios");
    const [categoriesResponse, foodItemsResponse] = await Promise.all([
      serverAxios.get(`/restaurant/${slug}/categories`),
      serverAxios.get(
        `/food-item/${slug}`,
      ), {
        params: {
          limit: 20,
          tab: tab !== "search" ? tab : "",
          search: search,
          includeArchived: "true",
        }
      }
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
      tab={tab}
      search={search}
      slug={slug}
      // searchParams={searchParams}
    />
  );
}
