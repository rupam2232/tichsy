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
    title: `Orders | ${restaurant.restaurantName} - Tichsy`,
    description: `Manage orders, view order details, and update order status.`,
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

  let initialOrders = null;

  try {
    const { default: serverAxios } = await import("@/utils/server-axios");

    let query = "";
    switch (tab) {
      case "all":
        query = "";
        break;
      case "new":
        query = "status=pending";
        break;
      case "inProgress":
        query = "status=preparing";
        break;
      case "ready":
        query = "status=ready";
        break;
      case "unPaid":
        query = "isPaid=false";
        break;
      case "completed":
        query = "status=completed&status=cancelled";
        break;
      case "search":
        query = `search=${search}`;
        break;
      default:
        query = "";
        break;
    }

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

  return <ClientPage initialOrders={initialOrders} slug={slug} />;
}
