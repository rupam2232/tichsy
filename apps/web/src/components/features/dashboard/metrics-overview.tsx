"use client";
import { useCallback, useEffect, useState, useMemo } from "react";
import axios from "@/utils/axiosInstance";
import { useDispatch } from "react-redux";
import { signOut } from "@/store/authSlice";
import { useRouter } from "next/navigation";
import {
  Wallet,
  TrendingDown,
  TrendingUp,
  ChefHat,
  Utensils,
} from "lucide-react";
import { cn } from "@repo/ui/lib/utils";
import type { DashboardOperations, ApiResponse } from "@repo/types";
import { useSocket } from "@/context/SocketContext";
import type { AxiosError } from "axios";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import { AnimatedNumber } from "@/components/shared/animated-odometer";

interface MetricsOverviewProps {
  slug: string;
}

export function MetricsOverview({ slug }: MetricsOverviewProps) {
  const [operationsData, setOperationsData] =
    useState<DashboardOperations | null>(null);
  const dispatch = useDispatch();
  const router = useRouter();
  const socket = useSocket();

  const fetchOperations = useCallback(async () => {
    if (!slug) return;
    try {
      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const operationsRes = await axios.get<ApiResponse<DashboardOperations>>(
        `/restaurant/${slug}/dashboard/operations?timezone=${userTimezone}`,
      );
      setOperationsData(operationsRes.data.data || null);
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse>;
      console.error(error);
      toast.error(
        axiosError.response?.data?.message || "Failed to fetch operations",
      );
      if (axiosError.response?.status === 401) {
        dispatch(signOut());
        router.push(`/signin?redirect=/restaurant/${slug}/dashboard`);
      }
    }
  }, [slug, dispatch, router]);

  useEffect(() => {
    fetchOperations();
  }, [fetchOperations]);

  useEffect(() => {
    if (!socket) return;
    socket.on("newOrder", fetchOperations);
    socket.on("orderUpdated", fetchOperations);
    socket.on("tableUpdated", fetchOperations);

    return () => {
      socket.off("newOrder", fetchOperations);
      socket.off("orderUpdated", fetchOperations);
      socket.off("tableUpdated", fetchOperations);
    };
  }, [socket, fetchOperations]);

  const ordersTrend = useMemo(() => {
    const current = operationsData?.todayTotalOrders ?? 0;
    const past = operationsData?.yesterdayTotalOrders ?? 0;

    if (past === 0)
      return { change: current > 0 ? "+100%" : "0%", isUp: current > 0 };
    const diff = current - past;
    const percent = Math.round((diff / past) * 100);
    return {
      change: `${percent > 0 ? "+" : ""}${percent}%`,
      isUp: percent > 0,
    };
  }, [operationsData?.todayTotalOrders, operationsData?.yesterdayTotalOrders]);

  return (
    <section className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs *:data-[slot=card]:hover:shadow-md *:data-[slot=card]:border-border/70 *:data-[slot=card]:transition-shadow @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {/* New Orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-semibold text-muted-foreground">
            New Orders
          </CardTitle>
          <div
            className={cn(
              "p-2 rounded-full",
              ordersTrend.isUp
                ? "bg-green-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                : "bg-muted dark:bg-slate-800 text-foreground/60 dark:text-slate-400",
            )}
          >
            {ordersTrend.isUp ? (
              <TrendingUp className="size-3.5" />
            ) : (
              <TrendingDown className="size-3.5" />
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col justify-between gap-1">
            <h3 className="text-4xl font-bold tracking-tight break-all">
              <AnimatedNumber value={operationsData?.newOrders ?? 0} />
            </h3>
            <p className="text-xs text-muted-foreground">
              Orders with pending status
            </p>
          </div>
        </CardContent>
      </Card>
      {/* Preparing */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-semibold text-muted-foreground">
            Preparing
          </CardTitle>
          <div className="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 p-2 rounded-full">
            <ChefHat className="size-3.5" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col justify-between gap-1">
            <h3 className="text-4xl font-bold tracking-tight break-all">
              <AnimatedNumber value={operationsData?.preparingOrders ?? 0} />
            </h3>
            <p className="text-xs text-muted-foreground">
              Orders with preparing status
            </p>
          </div>
        </CardContent>
      </Card>
      {/* Ready to Serve */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-semibold text-muted-foreground">
            Ready to Serve
          </CardTitle>
          <div className="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 p-2 rounded-full">
            <Utensils className="size-3.5" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col justify-between gap-1">
            <h3 className="text-4xl font-bold tracking-tight break-all">
              <AnimatedNumber value={operationsData?.readyOrders ?? 0} />
            </h3>
            <p className="text-xs text-muted-foreground">
              Orders with ready status
            </p>
          </div>
        </CardContent>
      </Card>
      {/* Pending Payment */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-semibold text-muted-foreground">
            Pending Payment
          </CardTitle>
          <div className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-2 rounded-full">
            <Wallet className="size-3.5" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col justify-between gap-1">
            <h3 className="text-4xl font-bold tracking-tight break-all">
              <AnimatedNumber value={operationsData?.unpaidOrders ?? 0} />
            </h3>
            <p className="text-xs text-muted-foreground">
              Unpaid active orders
            </p>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
