import type { Metadata } from "next";
import { fetchRestaurantMetadata } from "@/utils/fetchRestaurantMetadata";
import OrderTabList from "./tablist";
import SearchInput from "@/components/shared/search-input";
import OrderList from "./order-list";
import { buildOrderQuery } from "@/utils/buildQuery";

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
    title: `Orders | ${restaurant.restaurantName} - Tichsy`,
    description: `Manage orders, view order details, and update order status.`,
  };
}

export default async function page({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const { slug } = await params;
  const { tab = "all", search = "" } = await searchParams;

  let initialOrders = null;

  try {
    const { default: serverAxios } = await import("@/utils/server-axios");

    const query = buildOrderQuery(tab, search);

    const response = await serverAxios.get(`/order/${slug}?${query}`);
    if (
      response.data &&
      response.data.data &&
      Array.isArray(response.data.data.orders)
    ) {
      initialOrders = response.data.data;
    }
  } catch (error) {
    console.error("Failed to fetch orders server-side:", error);
  }

  return (
    <section className="flex flex-1 flex-col p-4 gap-4 lg:p-6 @container/main">
      <div className="flex flex-wrap items-center sm:items-start justify-between gap-2">
        <OrderTabList />
        <SearchInput
          placeholder="Search orders by No, table name, food item name..."
          className="w-full sm:w-auto sm:min-w-[300px]"
        />
      </div>
      <OrderList initialOrders={initialOrders} slug={slug} />
    </section>
  );
}
