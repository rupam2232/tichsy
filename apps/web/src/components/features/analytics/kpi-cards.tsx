"use client";

import { useEffect, useState } from "react";
import axios from "@/utils/axiosInstance";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import { IconChartBar, IconReceipt } from "@tabler/icons-react";
import {
  TrendingDown,
  TrendingUp,
  UtensilsCrossed,
  Wallet,
} from "lucide-react";
import type { DashboardAnalytics, ApiResponse } from "@repo/types";
import { cn } from "@repo/ui/lib/utils";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { useDispatch } from "react-redux";
import { signOut } from "@/store/authSlice";
import { useRouter } from "next/navigation";

export function KpiCards({ slug }: { slug: string }) {
  const [kpis, setKpis] = useState<DashboardAnalytics["kpis"] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const dispatch = useDispatch();
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;
    const fetchKPIs = async () => {
      try {
        setIsLoading(true);
        const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const res = await axios.get<ApiResponse<DashboardAnalytics["kpis"]>>(
          `/restaurant/${slug}/dashboard/analytics/kpis?timezone=${userTimezone}`,
        );
        if (isMounted) setKpis(res.data.data || null);
      } catch (error) {
        const axiosError = error as AxiosError<ApiResponse>;
        console.error(error);
        toast.error(
          axiosError.response?.data?.message || "Failed to fetch operations",
        );
        if (axiosError.response?.status === 401) {
          dispatch(signOut());
          router.push(`/signin?redirect=/restaurant/${slug}/analytics`);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    fetchKPIs();
    return () => {
      isMounted = false;
    };
  }, [slug, router, dispatch]);

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs *:data-[slot=card]:hover:shadow-md *:data-[slot=card]:border-border/70 *:data-[slot=card]:transition-shadow @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {/* 1. Total Revenue */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-semibold text-muted-foreground">
            Total Revenue
          </CardTitle>
          <div className="p-2 rounded-full bg-green-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
            <IconChartBar className="size-3.5" />
          </div>
        </CardHeader>
        <CardContent className="h-full">
          <div className="flex flex-col justify-between gap-1 h-full">
            <h3 className="text-3xl font-bold tracking-tight break-all">
              ₹{isLoading || !kpis ? 0 : kpis.allTimeSales.value.toFixed(2)}
            </h3>
            <p className="text-xs flex items-center gap-1 text-muted-foreground">
              {isLoading ||
              !kpis ? null : kpis.allTimeSales.description.startsWith("+") ? (
                <TrendingUp className={cn("w-3 h-3", "text-emerald-500")} />
              ) : kpis.allTimeSales.description.startsWith("-") ? (
                <TrendingDown className={cn("w-3 h-3", "text-red-500")} />
              ) : null}
              {isLoading || !kpis
                ? "Loading..."
                : kpis.allTimeSales.description}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 2. Total Orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-semibold text-muted-foreground">
            Total Orders
          </CardTitle>
          <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
            <IconReceipt className="size-3.5" />
          </div>
        </CardHeader>
        <CardContent className="h-full">
          <div className="flex flex-col justify-between gap-1 h-full">
            <h3 className="text-3xl font-bold tracking-tight break-all">
              {isLoading || !kpis ? 0 : kpis.allTimeOrders.value}
            </h3>
            <p className="text-xs flex items-center gap-1 text-muted-foreground">
              {isLoading ||
              !kpis ? null : kpis.allTimeOrders.description.startsWith("+") ? (
                <TrendingUp className={cn("w-3 h-3", "text-emerald-500")} />
              ) : kpis.allTimeOrders.description.startsWith("-") ? (
                <TrendingDown className={cn("w-3 h-3", "text-red-500")} />
              ) : null}
              {isLoading || !kpis
                ? "Loading..."
                : kpis.allTimeOrders.description}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 3. Average Order Value */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-semibold text-muted-foreground">
            Avg Order Value
          </CardTitle>
          <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
            <Wallet className="size-3.5" />
          </div>
        </CardHeader>
        <CardContent className="h-full">
          <div className="flex flex-col justify-between gap-1 h-full">
            <h3 className="text-3xl font-bold tracking-tight break-all">
              ₹
              {isLoading || !kpis ? 0 : kpis.averageOrderValue.value.toFixed(2)}
            </h3>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              {isLoading || !kpis
                ? "Loading..."
                : kpis.averageOrderValue.description}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 4. Active Menu Items */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-semibold text-muted-foreground">
            Active Menu Items
          </CardTitle>
          <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">
            <UtensilsCrossed className="size-3.5" />
          </div>
        </CardHeader>
        <CardContent className="h-full">
          <div className="flex flex-col justify-between gap-1 h-full">
            <h3 className="text-3xl font-bold tracking-tight break-all">
              {isLoading || !kpis ? 0 : kpis.activeMenuItems.value}
            </h3>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              {isLoading || !kpis
                ? "Loading..."
                : kpis.activeMenuItems.description}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
