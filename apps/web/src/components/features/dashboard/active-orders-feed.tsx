"use client";
import { useCallback, useEffect, useState, useRef } from "react";
import axios from "@/utils/axiosInstance";
import { BellRing, Loader2 } from "lucide-react";
import { ScrollArea, ScrollBar } from "@repo/ui/components/scroll-area";
import OrderCard from "@/components/features/orders/order-card";
import type { OrderDetails, Order, ApiResponse } from "@repo/types";
import { useSocket } from "@/context/SocketContext";
import Link from "next/link";
import { cn } from "@repo/ui/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@repo/ui/components/empty";

interface ActiveOrdersFeedProps {
  slug: string;
}

export function ActiveOrdersFeed({ slug }: ActiveOrdersFeedProps) {
  const [ordersData, setOrdersData] = useState<OrderDetails | null>(null);
  const [orderPage, setOrderPage] = useState<number>(1);
  const [isPageChanging, setIsPageChanging] = useState<boolean>(false);
  const orderObserver = useRef<IntersectionObserver>(null);
  const socket = useSocket();

  const fetchOrders = useCallback(
    async (page: number, append = false) => {
      if (!slug) return;
      try {
        if (append) setIsPageChanging(true);
        const res = await axios.get<ApiResponse<OrderDetails>>(
          `/order/${slug}`,
          {
            params: {
              page,
              limit: 10,
              status: "pending,preparing,ready,served",
            },
          },
        );

        if (res.data?.data) {
          setOrdersData((prev) => {
            if (append && prev && res.data?.data) {
              return {
                ...res.data.data,
                orders: [...prev.orders, ...res.data.data.orders],
              };
            }
            return res.data?.data || null;
          });
        }
      } catch (error) {
        console.error("Failed to fetch orders:", error);
      } finally {
        setIsPageChanging(false);
      }
    },
    [slug],
  );

  useEffect(() => {
    fetchOrders(1);
  }, [fetchOrders]);

  useEffect(() => {
    if (orderPage > 1) fetchOrders(orderPage, true);
  }, [orderPage, fetchOrders]);

  // Compatibility proxy for OrderCard's setOrders prop
  const setOrdersProxy = useCallback(
    (action: React.SetStateAction<OrderDetails>) => {
      setOrdersData((prev) => {
        if (!prev) return prev;
        const newOrderDetails =
          typeof action === "function" ? action(prev) : action;
        return newOrderDetails;
      });
    },
    [],
  );

  const handleNewOrder = useCallback(({ order }: { order: Order }) => {
    setOrdersData((prev) => {
      if (!prev) return prev;
      // Optimistically unshift the new order to the top of the feed
      return {
        ...prev,
        totalOrders: prev.totalOrders + 1,
        orders: [order, ...prev.orders],
      };
    });
  }, []);

  const handleOrderUpdated = useCallback(({ order }: { order: Order }) => {
    setOrdersData((prev) => {
      if (!prev) return prev;
      const orderIndex = prev.orders.findIndex((o) => o._id === order._id);

      // If we don't have this order in our feed, ignore the update
      if (orderIndex === -1) return prev;

      const newOrders = [...prev.orders];

      // If the order was moved to completed/cancelled, gracefully remove it from this active feed
      if (order.status === "completed" || order.status === "cancelled") {
        newOrders.splice(orderIndex, 1);
        return {
          ...prev,
          totalOrders: Math.max(0, prev.totalOrders - 1),
          orders: newOrders,
        };
      }

      newOrders[orderIndex] = { ...newOrders[orderIndex], ...order };
      return { ...prev, orders: newOrders };
    });
  }, []);

  useEffect(() => {
    if (!socket) return;
    socket.on("newOrder", handleNewOrder);
    socket.on("orderUpdated", handleOrderUpdated);
    return () => {
      socket.off("newOrder", handleNewOrder);
      socket.off("orderUpdated", handleOrderUpdated);
    };
  }, [socket, handleNewOrder, handleOrderUpdated]);

  const lastOrderElementRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (orderObserver.current) orderObserver.current.disconnect();
      orderObserver.current = new IntersectionObserver((entries) => {
        if (
          entries &&
          entries.length > 0 &&
          entries[0]?.isIntersecting &&
          ordersData &&
          ordersData.page < ordersData.totalPages
        ) {
          if (!isPageChanging) {
            setOrderPage((prev) => prev + 1);
          }
        }
      });
      if (node) orderObserver.current.observe(node);
    },
    [ordersData, isPageChanging],
  );

  return (
    <Card className="@container/active-orders shadow-xs hover:shadow-md transition-shadow pb-2 gap-0">
      <CardHeader className="flex flex-row items-center justify-between pb-0">
        <CardTitle className="text-lg">Active Orders</CardTitle>
        <Link
          href={`/restaurant/${slug}/orders`}
          className="font-medium text-sm hover:underline"
        >
          View All Orders
        </Link>
      </CardHeader>
      <CardContent className="px-0! pb-0! relative">
        <ScrollArea className="lg:h-[450px] w-full pl-5 pr-8">
          <div
            className={cn(
              "grid grid-cols-1 @2xl/active-orders:grid-cols-2 gap-4 py-6",
              (!ordersData?.orders || ordersData.orders.length === 0) &&
                "flex flex-col justify-center",
            )}
          >
            {!ordersData?.orders || ordersData.orders.length === 0 ? (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon" className="size-9">
                    <BellRing className="size-4" />
                  </EmptyMedia>
                  <EmptyTitle>No active orders</EmptyTitle>
                  <EmptyDescription>
                    When new orders arrive, they will appear here
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              ordersData.orders.map((order, index) => (
                <OrderCard
                  key={order._id}
                  order={order}
                  ref={
                    index === ordersData.orders.length - 1
                      ? lastOrderElementRef
                      : null
                  }
                  restaurantSlug={slug}
                  setOrders={setOrdersProxy}
                  className="border-border hover:scale-none bg-card/80 shadow-none hover:shadow-none"
                  cardContentClassName="p-5 md:p-6"
                />
              ))
            )}
            {isPageChanging && (
              <div className="w-full flex justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
          <ScrollBar className="z-6" />
        </ScrollArea>
      <div className="bg-gradient-to-b from-transparent via-card/80 to-card absolute bottom-0 rounded-b-xl h-8 z-5 w-full"></div>
      <div className="bg-gradient-to-t from-transparent via-card/80 to-card absolute top-0 rounded-t-xl h-8 z-5 w-full"></div>
      </CardContent>
    </Card>
  );
}
