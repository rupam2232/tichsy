import BillReceipt from "@/components/features/orders/bill-receipt";
import { fetchRestaurantMetadata } from "@/utils/fetchRestaurantMetadata";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}): Promise<Metadata> {
  const { slug, id } = await params;
  const restaurant = await fetchRestaurantMetadata(slug);
  if (!restaurant) {
    return {
      title: "Restaurant not found",
      description: "The requested restaurant could not be found.",
    };
  }
  return {
    title: `${restaurant.restaurantName} | Bill - ID:${id}`,
    description: "Your bill receipt",
    icons: [
      {
        rel: "icon",
        url:
          restaurant.logoUrl?.replace("/upload/", "/upload/r_max/") ||
          `${process.env.NEXT_PUBLIC_CLIENT_BASE_URL}/favicon.ico`,
      },
    ],
  };
}

const billPage = async ({
  params,
}: {
  params: Promise<{ id: string; slug: string }>;
}) => {
  const { id, slug } = await params;
  return (
    <>
      <BillReceipt orderId={id} restaurantSlug={slug} />
    </>
  );
};

export default billPage;
