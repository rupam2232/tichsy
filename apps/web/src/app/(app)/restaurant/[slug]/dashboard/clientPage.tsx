"use client";
import axios from "@/utils/axiosInstance";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useDispatch } from "react-redux";
import { signOut } from "@/store/authSlice";
import { useRouter } from "next/navigation";
import type { AxiosError } from "axios";
import type { ApiResponse } from "@repo/ui/types/ApiResponse";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import { Button } from "@repo/ui/components/button";
import {
  Timer,
  Wallet,
  BellRing,
  TrendingUp,
  TrendingDown,
  LineChart,
  CheckCheck,
} from "lucide-react";
import { IconReceipt, IconTable } from "@tabler/icons-react";
import { useSocket } from "@/context/SocketContext";
import { OrderDetails } from "@repo/ui/types/Order";
import { Skeleton } from "@repo/ui/components/skeleton";
import OrderCard from "@/components/order-card";
import { cn } from "@repo/ui/lib/utils";
import { AllTables } from "@repo/ui/types/Table";
import Link from "next/link";
import { ScrollArea } from "@repo/ui/components/scroll-area";
import type { AppDispatch } from "@/store/store";
import type { StaffDashboardStats } from "@repo/ui/types/Stats";
import StaffOrderDialog from "@/components/staff-order-dialog";

const ClientPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [isPageLoading, setIsPageLoading] = useState<boolean>(true);
  const [latestOrders, setLatestOrders] = useState<OrderDetails>(null);
  const [stats, setStats] = useState<StaffDashboardStats>({
    newOrders: 0,
    inProgressOrders: 0,
    occupiedTables: 0,
    freeTables: 0,
    todayTotalOrders: 0,
    yesterdayTotalOrders: 0,
    totalOrderChangePercent: 0,
    unPaidCompletedOrders: 0,
    readyOrders: 0,
  });
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const socket = useSocket();
  const [allTables, setAllTables] = useState<AllTables | null>(null);

  const fetchDashboardStats = useCallback(async () => {
    try {
      setIsPageLoading(true);
      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const [orderResponse, statsResponse] = await Promise.all([
        axios.get(`/order/${slug}`),
        axios.get(`/restaurant/${slug}/staff-dashboard-stats?timezone=${userTimezone}`),
      ]);
      if (orderResponse.data.success) {
        setLatestOrders(orderResponse.data.data);
      } else {
        setLatestOrders(null);
        toast.error(orderResponse.data.message);
      }

      if (statsResponse.data.success) {
        setStats(statsResponse.data.data);
      } else {
        toast.error(statsResponse.data.message);
      }

      const tableResponse = await axios.get(`/table/${slug}`);
      setAllTables(tableResponse.data.data);
    } catch (error) {
      console.error(
        "Failed to fetch dashboard stats. Please try again later:",
        error
      );
      const axiosError = error as AxiosError<ApiResponse>;
      toast.error(
        axiosError.response?.data.message ||
          "Failed to fetch dashboard stats. Please try again later"
      );
      if (axiosError.response?.status === 401) {
        dispatch(signOut());
        router.push("/signin?redirect=/restaurant/" + slug + "/dashboard");
      }
    } finally {
      setIsPageLoading(false);
    }
  }, [slug, dispatch, router]);

  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  const handleNewOrder = useCallback(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  useEffect(() => {
    if (!socket) return;
    socket.on("newOrder", handleNewOrder);

    return () => {
      socket.off("newOrder", handleNewOrder);
    };
  }, [socket, handleNewOrder]);

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col">
        <div className="flex justify-end items-center px-6 pt-2">
          <StaffOrderDialog/>
        </div>
        <div className="flex flex-col gap-4 md:gap-6 p-4 pt-2! lg:p-6">
          <div className="grid grid-cols-1 @2xl/main:grid-cols-2 @5xl/main:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  New Orders
                </CardTitle>
                <BellRing className="size-4" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold">{stats.newOrders}</h3>
                  <p className="text-xs text-muted-foreground">
                    *Updates in real-time
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  In Progress
                </CardTitle>
                <Timer className="size-4" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold">
                    {stats.inProgressOrders}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    *Orders that are in preparing status
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Occupied Tables
                </CardTitle>
                <IconTable className="size-4" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold">{stats.occupiedTables}</h3>
                  <p className="text-xs text-muted-foreground">
                    {stats.freeTables} Tables Available
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Today&apos;s Total Orders
                </CardTitle>
                <IconReceipt className="size-4" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold">
                    {stats.todayTotalOrders}
                  </h3>
                  <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                    {stats.totalOrderChangePercent > 0 ? (
                      <TrendingUp className="inline size-4 text-green-500" />
                    ) : stats.totalOrderChangePercent < 0 ? (
                      <TrendingDown className="inline size-4 text-red-500" />
                    ) : (
                      <LineChart className="inline size-4" />
                    )}
                    <span
                      className={cn("text-xs", {
                        "text-green-500": stats.totalOrderChangePercent > 0,
                        "text-red-500": stats.totalOrderChangePercent < 0,
                      })}
                    >
                      {stats.totalOrderChangePercent > 0 ? "+" : ""}
                      {stats.totalOrderChangePercent.toFixed(0)}%
                    </span>
                    <span className="text-xs text-muted-foreground">
                      vs yesterday
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-4">
              <Card>
                <CardHeader className="flex items-center justify-between pb-2">
                  <CardTitle className="text-sm text-muted-foreground">
                    Ready to Serve
                  </CardTitle>
                  <CheckCheck className="size-4" />
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-bold">
                        {stats.readyOrders}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Orders ready and awaiting service
                      </p>
                    </div>
                    <Link href={`/restaurant/${slug}/orders?tab=ready`}>
                      <Button size="sm">View</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex items-center justify-between pb-2">
                  <CardTitle className="text-sm text-muted-foreground">
                    Pending Payments
                  </CardTitle>
                  <Wallet className="size-4" />
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-bold">
                        {stats.unPaidCompletedOrders}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Orders completed but not paid
                      </p>
                    </div>
                    <Link href={`/restaurant/${slug}/orders?tab=unPaid`}>
                      <Button size="sm" variant="outline">View</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-col sm:flex-row items-center justify-between text-muted-foreground text-sm">
                  <CardTitle>Table Map</CardTitle>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-400"></div>
                      <span>
                        Available: {allTables ? allTables.availableTables : 0}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-400"></div>
                      <span>
                        Occupied: {allTables ? allTables.occupiedTables : 0}
                      </span>
                    </div>
                  </div>
                  {allTables?.totalPages && allTables?.totalPages > 1 && (
                    <Link
                      href={`/restaurant/${slug}/tables`}
                      className="text-sm text-primary hover:underline"
                    >
                      View all tables
                    </Link>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {allTables?.tables.map((t) => (
                      <div
                        key={t._id}
                        className={cn(
                          "rounded-md p-3 flex flex-col items-center justify-center text-sm truncate",
                          t.isOccupied
                            ? "bg-red-50 text-red-700 border border-red-100"
                            : "bg-green-50 text-green-700 border border-green-100"
                        )}
                      >
                        <h3 className="font-medium">{t.tableName}</h3>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="flex items-center justify-between">
                <CardTitle className="text-sm text-muted-foreground">
                  Latest Orders
                </CardTitle>
                {latestOrders && latestOrders.totalPages > 1 && (
                  <Link
                    href={`/restaurant/${slug}/orders`}
                    className="text-sm text-primary hover:underline"
                  >
                    View all orders
                  </Link>
                )}
              </CardHeader>
              <CardContent className="px-0 sm:px-3 md:px-6">
                {isPageLoading ? (
                  <ScrollArea className="h-auto lg:h-[calc(100vh-140px)]">
                    <div className="space-y-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton
                          key={i + Math.random()}
                          className="h-80 w-full rounded-xl"
                        />
                      ))}
                    </div>
                  </ScrollArea>
                ) : latestOrders && latestOrders.orders.length > 0 ? (
                  <ScrollArea className="h-auto lg:h-[calc(100vh-140px)]">
                    <div className="space-y-2">
                      {latestOrders?.orders.map((order) => (
                        <OrderCard
                          key={order._id}
                          order={order}
                          setOrders={setLatestOrders}
                          restaurantSlug={slug}
                          className="hover:scale-100"
                          cardContentClassName="px-2 sm:px-3 md:px-6"
                        />
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="flex justify-between items-center">
                    <span>No orders found</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientPage;
