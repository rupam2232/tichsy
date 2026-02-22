"use client";
import { useCallback, useEffect, useState, useMemo } from "react";
import axios from "@/utils/axiosInstance";
import { useDispatch } from "react-redux";
import { signOut } from "@/store/authSlice";
import { useRouter } from "next/navigation";
import {
  Timer,
  Wallet,
  CheckCheck,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { cn } from "@repo/ui/lib/utils";
import type { DashboardOperations, ApiResponse } from "@repo/types";
import { useSocket } from "@/context/SocketContext";
import type { AxiosError } from "axios";

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
      if (axiosError.response?.status === 401) {
        dispatch(signOut());
        router.push(`/signin?redirect=/restaurant/${slug}/dashboard`);
      } else {
        console.error(error);
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
    <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      <div className="bg-card p-6 md:p-8 rounded-3xl shadow-sm border border-border flex flex-col gap-4">
        <div className="flex justify-between items-start">
          <span className="text-muted-foreground font-medium">New Orders</span>
          <div
            className={cn(
              "px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1",
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
            {ordersTrend.change}
          </div>
        </div>
        <div className="text-5xl font-900 text-foreground">
          {operationsData?.newOrders ?? 0}
        </div>
      </div>

      <div className="bg-card p-6 md:p-8 rounded-3xl shadow-sm border border-border flex flex-col gap-4">
        <div className="flex justify-between items-start">
          <span className="text-muted-foreground font-medium">Preparing</span>
          <div className="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
            <Timer className="size-3.5" />
          </div>
        </div>
        <div className="text-5xl font-900 text-foreground">
          {operationsData?.preparingOrders ?? 0}
        </div>
      </div>

      <div className="bg-card p-6 md:p-8 rounded-3xl shadow-sm border border-border flex flex-col gap-4">
        <div className="flex justify-between items-start">
          <span className="text-muted-foreground font-medium">
            Ready to Serve
          </span>
          <div className="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
            <CheckCheck className="size-3.5" />
          </div>
        </div>
        <div className="text-5xl font-900 text-foreground">
          {operationsData?.readyOrders ?? 0}
        </div>
      </div>

      <div className="bg-card p-6 md:p-8 rounded-3xl shadow-sm border border-border flex flex-col gap-4">
        <div className="flex justify-between items-start">
          <span className="text-muted-foreground font-medium">
            Pending Payment
          </span>
          <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
            <Wallet className="size-3.5" />
          </div>
        </div>
        <div className="text-5xl font-900 text-foreground">
          {operationsData?.unpaidOrders ?? 0}
        </div>
      </div>
    </section>
  );
}
