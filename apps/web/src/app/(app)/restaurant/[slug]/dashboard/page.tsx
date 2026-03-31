import type { Metadata } from "next";
import { fetchRestaurantMetadata } from "@/utils/fetchRestaurantMetadata";
import StaffOrderDialog from "@/components/features/orders/staff-order-dialog";
import { MetricsOverview } from "@/components/features/dashboard/metrics-overview";
import { LiveTableStatus } from "@/components/features/dashboard/live-table-status";
import { ActiveOrdersFeed } from "@/components/features/dashboard/active-orders-feed";

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
    title: `Dashboard | ${restaurant.restaurantName} - Tichsy`,
    description: `View and manage your restaurant's operations and orders.`,
  };
}

export default async function page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <div className="flex flex-1 flex-col px-4 lg:px-6 @container/main">
      <div className="flex items-center justify-between py-3 gap-2">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Live overview of order metrics, table statuses, and active orders
          </p>
        </div>
        <StaffOrderDialog />
      </div>

      <div className="pt-3 pb-5 space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
        {/* Aggregate Metrics Cards */}
        <MetricsOverview slug={slug} />

        <div className="grid grid-cols-1 @4xl/main:grid-cols-2 gap-8">
          {/* Left Column: Live Table Status */}
          <LiveTableStatus slug={slug} />

          {/* Right Column: Active Orders */}
          <ActiveOrdersFeed slug={slug} />
        </div>
      </div>
    </div>
  );
}
