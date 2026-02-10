"use client";
import { useCallback, useEffect, useState } from "react";
import axios from "@/utils/axiosInstance";
import { toast } from "sonner";
import { useDispatch } from "react-redux";
import { signOut } from "@/store/authSlice";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import {
  Timer,
  Wallet,
  BellRing,
  CheckCheck,
  Loader2,
  RefreshCcw,
} from "lucide-react";
import { IconReceipt } from "@tabler/icons-react";
import { cn } from "@repo/ui/lib/utils";
import { ScrollArea } from "@repo/ui/components/scroll-area";
import Link from "next/link";
import OrderCard from "@/components/features/orders/order-card";
import type {
  DashboardOperations,
  AllTables,
  OrderDetails,
  ApiResponse,
} from "@repo/types";
import { useSocket } from "@/context/SocketContext";
import type { AxiosError } from "axios";
import { Button } from "@repo/ui/components/button";

interface OperationsTabProps {
  slug: string;
}

export function OperationsTab({ slug }: OperationsTabProps) {
  const [operationsData, setOperationsData] =
    useState<DashboardOperations | null>(null);
  const [allTables, setAllTables] = useState<AllTables | null>(null);
  const [latestOrders, setLatestOrders] = useState<OrderDetails>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const dispatch = useDispatch();
  const router = useRouter();
  const socket = useSocket();

  const fetchOperations = useCallback(
    async (showLoading = true) => {
      if (!slug) return;

      try {
        if (showLoading) setIsLoading(true);
        else setIsRefreshing(true);

        const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const [operationsRes, tablesRes, ordersRes] = await Promise.all([
          axios.get<ApiResponse<DashboardOperations>>(
            `/restaurant/${slug}/dashboard/operations?timezone=${userTimezone}`,
          ),
          axios.get<ApiResponse<AllTables>>(`/table/${slug}`),
          axios.get<ApiResponse<OrderDetails>>(`/order/${slug}?limit=5`),
        ]);

        setOperationsData(operationsRes.data.data || null);
        setAllTables(tablesRes.data.data || null);
        setLatestOrders(ordersRes.data.data || null);
      } catch (error) {
        const axiosError = error as AxiosError<ApiResponse>;
        console.error("Failed to fetch operations data:", error);
        toast.error(
          axiosError.response?.data.message ||
            "Failed to fetch operations data",
        );

        if (axiosError.response?.status === 401) {
          dispatch(signOut());
          router.push(`/signin?redirect=/restaurant/${slug}/dashboard`);
        }
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [slug, dispatch, router],
  );

  // Initial Load & Socket Listeners
  useEffect(() => {
    fetchOperations();

    if (socket) {
      socket.on("newOrder", () => fetchOperations(false));
      socket.on("orderUpdated", () => fetchOperations(false));
      socket.on("tableUpdated", () => fetchOperations(false));
    }

    return () => {
      if (socket) {
        socket.off("newOrder");
        socket.off("orderUpdated");
        socket.off("tableUpdated");
      }
    };
  }, [fetchOperations, socket]);

  if (isLoading && !operationsData) {
    return (
      <div className="h-[50vh] flex flex-col items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p>Loading operations...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <BellRing className="w-5 h-5" /> Live Operations
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => fetchOperations(false)}
          disabled={isRefreshing}
          className={cn(isRefreshing && "animate-pulse")}
        >
          <RefreshCcw
            className={cn("w-4 h-4 mr-2", isRefreshing && "animate-spin")}
          />
          {isRefreshing ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 *:data-[slot=card]:from-foreground/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs">
        <Card className="transition-all hover:shadow-md @container/card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              New Orders
            </CardTitle>
            <BellRing className="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold">
                {operationsData?.newOrders ?? 0}
              </h3>
              <p className="text-xs text-muted-foreground">
                Awaiting confirmation
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="transition-all hover:shadow-md @container/card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Kitchen
            </CardTitle>
            <Timer className="size-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold">
                {operationsData?.inProgressOrders ?? 0}
              </h3>
              <p className="text-xs text-muted-foreground">
                Orders properly cooking
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="transition-all hover:shadow-md @container/card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ready to Serve
            </CardTitle>
            <CheckCheck className="size-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold">
                {operationsData?.readyOrders ?? 0}
              </h3>
              <p className="text-xs text-muted-foreground">
                Waiting for pickup/delivery
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="transition-all hover:shadow-md @container/card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Payment
            </CardTitle>
            <Wallet className="size-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold">
                {operationsData?.unPaidCompletedOrders ?? 0}
              </h3>
              <p className="text-xs text-muted-foreground">
                Completed but unpaid
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Live Tables */}
        <Card className="flex flex-col h-full">
          <CardHeader className="flex flex-col sm:flex-row items-center justify-between text-muted-foreground text-sm pb-2">
            <CardTitle className="text-foreground">Table Status</CardTitle>
            <div className="flex items-center gap-3 text-xs bg-muted/50 p-1.5 rounded-md">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-green-500 ring-2 ring-green-500/20"></div>
                <span className="font-medium">
                  Available: {allTables?.availableTables ?? 0}
                </span>
              </div>
              <div className="w-px h-3 bg-border"></div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-red-500 ring-2 ring-red-500/20"></div>
                <span className="font-medium">
                  Occupied: {allTables?.occupiedTables ?? 0}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 min-h-[300px]">
            <ScrollArea className="h-[300px] w-full pr-4">
              <div className="flex flex-wrap gap-3">
                {allTables?.tables.map((t) => (
                  <div
                    key={t._id}
                    className={cn(
                      "rounded-lg p-3 flex flex-col items-center justify-center text-center border transition-all cursor-default shadow-sm aspect-square gap-1",
                      t.isOccupied
                        ? "bg-red-50 text-red-900 border-red-200 shadow-red-100"
                        : "bg-green-50 text-green-900 border-green-200 shadow-green-100",
                    )}
                  >
                    <span className="font-bold text-sm truncate w-full px-1">
                      {t.tableName}
                    </span>
                    <span
                      className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                        t.isOccupied
                          ? "bg-red-100 text-red-700"
                          : "bg-green-100 text-green-700",
                      )}
                    >
                      {t.isOccupied ? "Occupied" : "Available"}
                    </span>
                  </div>
                ))}
                {(!allTables?.tables || allTables.tables.length === 0) && (
                  <div className="col-span-full flex flex-col items-center justify-center h-40 text-muted-foreground border-2 border-dashed rounded-lg">
                    <p>No tables found</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Latest Orders */}
        <Card className="flex flex-col h-full">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-foreground">
              Latest Active Orders
            </CardTitle>
            {latestOrders && latestOrders.totalPages > 1 && (
              <Link
                href={`/restaurant/${slug}/orders`}
                className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
              >
                View all
              </Link>
            )}
          </CardHeader>
          <CardContent className="flex-1 min-h-[300px] p-0 relative">
            <div className="absolute inset-0 px-6 pb- pt-2">
              {latestOrders && latestOrders.orders.length > 0 ? (
                <ScrollArea className="h-full pr-4">
                  <div className="space-y-3 pb-2">
                    {latestOrders.orders.map((order) => (
                      <OrderCard
                        key={order._id}
                        order={order}
                        setOrders={setLatestOrders}
                        restaurantSlug={slug}
                        className="border shadow-sm hover:shadow-md transition-shadow hover:scale-100"
                        cardContentClassName="p-3"
                      />
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-2">
                  <div className="p-4 bg-muted/50 rounded-full">
                    <IconReceipt className="w-8 h-8 opacity-40" />
                  </div>
                  <p className="text-sm">No active orders right now</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
