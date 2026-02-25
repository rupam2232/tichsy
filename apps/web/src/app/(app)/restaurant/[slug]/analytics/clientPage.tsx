"use client";
import { useParams } from "next/navigation";
import { useSelector } from "react-redux";
import type { RootState } from "@/store/store";
import { KpiCards } from "@/components/features/analytics/kpi-cards";
import { RevenueChart } from "@/components/features/analytics/revenue-chart";
import { TrendingItems } from "@/components/features/analytics/trending-items";
import { TopCategories } from "@/components/features/analytics/top-categories";
import { TopTables } from "@/components/features/analytics/top-tables";
import { Loader2 } from "lucide-react";

const ClientPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const role = useSelector((state: RootState) => state.auth.user?.role);

  if (!role) {
    return (
      <div className="flex flex-1 items-center justify-center p-4 h-[calc(100vh-5rem)]">
        <p className="text-muted-foreground text-center flex items-center gap-2">
          <Loader2 className="animate-spin" /> Loading...
        </p>
      </div>
    );
  }

  if (role !== "owner") {
    return (
      <div className="flex flex-1 items-center justify-center p-4 h-[calc(100vh-5rem)]">
        <p className="text-muted-foreground text-center">
          You do not have permission to view analytics.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 lg:p-6 @container/main">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight">Analytics</h2>
        <p className="text-sm text-muted-foreground">
          Monitor your restaurant&apos;s performance and track key metrics.
        </p>
      </div>

      <div className="space-y-4 pt-4">
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-10">
          <KpiCards slug={slug} />

          <div className="grid grid-cols-1 @4xl/main:grid-cols-12 gap-6">
            <div className="col-span-1 @4xl/main:col-span-8 relative w-full min-h-[400px] @3xl/main:min-h-[450px]">
              <RevenueChart slug={slug} />
            </div>
            <div className="col-span-1 @4xl/main:col-span-4 relative w-full min-h-[400px] @3xl/main:min-h-[450px]">
              <TopCategories slug={slug} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 @2xl/main:grid-cols-2">
            <TrendingItems slug={slug} />
            <TopTables slug={slug} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientPage;
