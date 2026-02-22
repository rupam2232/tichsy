"use client";
import { useCallback, useEffect, useState, useRef } from "react";
import axios from "@/utils/axiosInstance";
import { BellRing, Loader2 } from "lucide-react";
import { ScrollArea } from "@repo/ui/components/scroll-area";
import OrderCard from "@/components/features/orders/order-card";
import type { OrderDetails, Order, ApiResponse } from "@repo/types";
import { useSocket } from "@/context/SocketContext";
import Link from "next/link";

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
          }
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
    <section className="col-span-1 lg:col-span-7 flex flex-col gap-4 md:gap-6 relative bg-card p-6 md:p-8 pr-0! rounded-[2rem] shadow-sm border border-border">
      <div className="flex items-center justify-between px-1 pr-4">
        <h2 className="text-xl font-800 text-foreground">
          Active Orders
        </h2>
        <Link
          href={`/restaurant/${slug}/orders`}
          className="font-medium text-sm hover:underline"
        >
          View All Orders
        </Link>
      </div>

      <ScrollArea className="lg:h-[450px] w-full pr-8">
        <div className="flex flex-col gap-4 pb-1">
          {!ordersData?.orders || ordersData.orders.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center gap-3">
              <div className="size-16 rounded-full bg-muted flex items-center justify-center">
                <BellRing className="size-8" />
              </div>
              <p className="text-lg font-bold">
                No active order
              </p>
              <p className="text-sm text-muted-foreground">
                When new orders arrive, they will appear here
              </p>
            </div>
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
                className="rounded-[2rem] border-border shadow-sm hover:shadow-md transition-shadow hover:scale-none bg-card/80"
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
      </ScrollArea>
      <div className="bg-gradient-to-b from-background/50 to-background absolute bottom-0 h-10"></div>
    </section>
  );
}
