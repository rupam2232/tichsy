import type { Metadata } from "next";
import { fetchRestaurantMetadata } from "@/utils/fetchRestaurantMetadata";
import MenuTabList from "./tablist";
import SearchInput from "@/components/shared/search-input";
import AddFoodItemButton from "./add-food-item-button";
import MenuList from "./menu-list";

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
  const { slug } = await props.params;
  const { tab = "all", search = "" } = await props.searchParams;

  let initialFoodItems = null;

  try {
    const { default: serverAxios } = await import("@/utils/server-axios");
    const response = await serverAxios.get(`/food-item/${slug}`, {
      params: {
        limit: 20,
        tab: tab !== "search" ? tab : "",
        search,
        includeArchived: "true",
      },
    });
    if (response.data.success) {
      initialFoodItems = response.data.data;
    }
  } catch (error) {
    console.error("Failed to fetch menu data server-side:", error);
  }

  return (
    <section className="flex flex-1 flex-col p-4 gap-4 lg:p-6 @container/main">
      <div className="flex flex-wrap items-center sm:items-start justify-between gap-2">
        <MenuTabList />
        <SearchInput
          placeholder="Search food items by name, category, tags..."
          className="w-full sm:w-auto sm:min-w-[200px]"
        />
        <AddFoodItemButton slug={slug} />
      </div>
      <MenuList initialFoodItems={initialFoodItems} slug={slug} />
    </section>
  );
}
