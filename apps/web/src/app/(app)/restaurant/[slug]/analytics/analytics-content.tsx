"use client";

import { KpiCards } from "@/components/features/analytics/kpi-cards";
import { RevenueChart } from "@/components/features/analytics/revenue-chart";
import { TrendingItems } from "@/components/features/analytics/trending-items";
import { TopTables } from "@/components/features/analytics/top-tables";

interface AnalyticsContentProps {
  slug: string;
}

export function AnalyticsContent({ slug }: AnalyticsContentProps) {
  return (
    <div className="flex flex-col gap-6">
      {/* 4. KPI Cards Row */}
      <KpiCards slug={slug} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="col-span-1 lg:col-span-8 relative w-full min-h-[400px] lg:min-h-[450px]">
          <RevenueChart slug={slug} />
        </div>
        <div className="col-span-1 lg:col-span-4 relative w-full min-h-[400px] lg:min-h-[450px]">
          <TopTables slug={slug} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-2">
        <div className="col-span-1 lg:col-span-12 relative w-full lg:h-[400px]">
          <TrendingItems slug={slug} />
        </div>
      </div>
    </div>
  );
}
