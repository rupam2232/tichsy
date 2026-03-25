"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useDispatch } from "react-redux";
import { useSocket } from "@/context/SocketContext";
import axios from "@/utils/axiosInstance";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { signOut } from "@/store/authSlice";
import { markNotificationAsReadByMergeKey } from "@/store/notificationSlice";
import { AppDispatch } from "@/store/store";
import { Order, OrderDetails, ApiResponse } from "@repo/types";
import OrderCard from "@/components/features/orders/order-card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@repo/ui/components/empty";
import { IconReceipt } from "@tabler/icons-react";
import { buildOrderQuery } from "@/utils/buildQuery";

interface OrderListProps {
  initialOrders: OrderDetails | null;
  slug: string;
}

// function buildQuery(tab: string, search: string): string {
//   switch (tab) {
//     case "new":
//       return "status=pending";
//     case "inProgress":
//       return "status=preparing";
//     case "ready":
//       return "status=ready";
//     case "unPaid":
//       return "isPaid=false&status=pending,preparing,ready,served";
//     case "completed":
//       return "status=completed";
//     case "search":
//       return `search=${encodeURIComponent(search)}`;
//     default:
//       return "";
//   }
// }

export default function OrderList({ initialOrders, slug }: OrderListProps) {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") || "all";
  const search = searchParams.get("search") ?? "";

  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const socket = useSocket();

  const [allOrders, setAllOrders] = useState<OrderDetails | null>(initialOrders);
  const [isLoading, setIsLoading] = useState<boolean>(initialOrders === null);
  const [isPageChanging, setIsPageChanging] = useState<boolean>(false);
  const [tabPages, setTabPages] = useState<Record<string, number>>({ all: 1 });

  const observer = useRef<IntersectionObserver | null>(null);
  const isFirstRender = useRef(true);
  const currentPage = tabPages[tab] ?? 1;

  const fetchOrders = useCallback(async () => {
    if (isFirstRender.current && initialOrders !== null) {
      if (tab === "all" || tab === "new") {
        dispatch(markNotificationAsReadByMergeKey(`new_order_${slug}`));
      }
      return;
    }

    if (tab === "search" && search.trim() === "") return;

    const query = buildOrderQuery(tab, search);

    try {
      if (currentPage === 1) {
        setIsLoading(true);
        const response = await axios.get<{ data: OrderDetails }>(
          `/order/${slug}?${query}`,
        );
        if (response.data.data && Array.isArray(response.data.data.orders)) {
          setAllOrders(response.data.data);
        } else {
          setAllOrders({ orders: [], totalOrders: 0, page: 1, limit: 10, totalPages: 1 });
        }
      } else {
        setIsPageChanging(true);
        const response = await axios.get<{ data: OrderDetails }>(
          `/order/${slug}?page=${currentPage}&${query}`,
        );
        if (response.data.data && Array.isArray(response.data.data.orders)) {
          const data: OrderDetails = response.data.data;
          setAllOrders((prev) => ({
            ...data,
            orders: [...(prev?.orders ?? []), ...data.orders],
          }));
        }
      }
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse>;
      toast.error(
        axiosError.response?.data.message ??
          "Failed to fetch orders. Please try again later.",
      );
      if (axiosError.response?.status === 401) {
        dispatch(signOut());
        router.push(`/signin?redirect=${pathname}`);
      }
    } finally {
      setIsLoading(false);
      setIsPageChanging(false);
    }
  }, [slug, tab, search, currentPage, initialOrders, dispatch, router, pathname]);

  // Skip initial fetch if server data was provided; set flag to false afterwards
  useEffect(() => {
    fetchOrders();
    isFirstRender.current = false;
  }, [fetchOrders]);

  // When tab changes, reset page and clear list so we fetch fresh data
  const prevTab = useRef(tab);
  useEffect(() => {
    if (prevTab.current === tab) return;
    prevTab.current = tab;
    setIsLoading(true);
    setAllOrders(null);
    setTabPages((prev) => ({ ...prev, [tab]: 1 }));
  }, [tab]);

  const lastElementRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        const entry = entries[0];
        if (
          entry?.isIntersecting &&
          allOrders &&
          allOrders.totalPages > currentPage &&
          allOrders.page === currentPage &&
          !isPageChanging
        ) {
          setTabPages((prev) => ({ ...prev, [tab]: (prev[tab] ?? 1) + 1 }));
        }
      });
      if (node) observer.current.observe(node);
    },
    [allOrders, currentPage, tab, isPageChanging],
  );

  const handleNewOrder = useCallback(
    ({ order }: { order: Order }) => {
      if (tab !== "all" && tab !== "new") return;
      setAllOrders((prev) =>
        prev
          ? { ...prev, orders: [order, ...prev.orders] }
          : { orders: [order], page: 1, limit: 10, totalOrders: 1, totalPages: 1 },
      );
    },
    [tab],
  );

  useEffect(() => {
    if (!socket) return;
    socket.on("newOrder", handleNewOrder);
    return () => {
      socket.off("newOrder", handleNewOrder);
    };
  }, [socket, handleNewOrder]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 @2xl/main:grid-cols-2 @5xl/main:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse h-80 border border-accent shadow-md rounded-md flex flex-col justify-between p-4"
          >
            <div className="flex flex-col gap-2 w-full">
              <div className="bg-accent h-6 w-full rounded-md" />
              <div className="bg-accent h-4 w-4/5 rounded-md" />
            </div>
            <div className="bg-accent h-15 w-full rounded-md" />
            <div className="bg-accent h-8 w-1/3 rounded-md" />
          </div>
        ))}
      </div>
    );
  }

  if (allOrders && allOrders.orders.length > 0) {
    return (
      <div className="grid grid-cols-1 @2xl/main:grid-cols-2 @5xl/main:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
        {allOrders.orders.map((order, index) => (
          <OrderCard
            key={order._id}
            order={order}
            ref={index === allOrders.orders.length - 4 ? lastElementRef : null}
            setOrders={(updater) => {
              setAllOrders((prev) => {
                if (!prev) return prev;
                return typeof updater === "function" ? updater(prev) : updater;
              });
            }}
            restaurantSlug={slug}
          />
        ))}
        {(isPageChanging || allOrders.totalPages > currentPage) &&
          Array.from({ length: 3 }).map((_, i) => (
            <div
              key={`loading-more-${i}`}
              className="animate-pulse h-80 border border-accent shadow-md rounded-md flex flex-col justify-between p-4"
            >
              <div className="flex flex-col gap-2 w-full">
                <div className="bg-accent h-6 w-full rounded-md" />
                <div className="bg-accent h-4 w-4/5 rounded-md" />
              </div>
              <div className="bg-accent h-15 w-full rounded-md" />
              <div className="bg-accent h-8 w-1/3 rounded-md" />
            </div>
          ))}
      </div>
    );
  }

  return (
    <Empty className="animate-in fade-in slide-in-from-top-4 duration-500 mt-12">
      <EmptyHeader>
        <EmptyMedia variant="icon" className="size-9">
          <IconReceipt className="size-4" />
        </EmptyMedia>
        <EmptyTitle>No orders found</EmptyTitle>
        <EmptyDescription>
          {tab === "all"
            ? "No orders received yet. Get started by taking or creating the first order."
            : tab === "search"
              ? "No orders found with this search."
              : "No orders found with this filter."}
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
