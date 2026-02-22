"use client";
import { useParams } from "next/navigation";
import StaffOrderDialog from "@/components/features/orders/staff-order-dialog";
import { MetricsOverview } from "@/components/features/dashboard/metrics-overview";
import { LiveTableStatus } from "@/components/features/dashboard/live-table-status";
import { ActiveOrdersFeed } from "@/components/features/dashboard/active-orders-feed";

const ClientPage = () => {
  const { slug } = useParams<{ slug: string }>();

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 lg:p-6">
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            Dashboard Overview
          </h3>
          <StaffOrderDialog />
        </div>

        {/* Aggregate Metrics Cards */}
        <MetricsOverview slug={slug} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-4">
          {/* Left Column: Live Table Status */}
          <LiveTableStatus slug={slug} />

          {/* Right Column: Active Orders */}
          <ActiveOrdersFeed slug={slug} />
        </div>
      </div>
    </div>
  );
};

export default ClientPage;
