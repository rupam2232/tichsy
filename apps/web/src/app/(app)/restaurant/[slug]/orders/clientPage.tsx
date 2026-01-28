"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import { toast } from "sonner";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@repo/ui/components/tabs";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@repo/ui/components/input-group";
import axios from "@/utils/axiosInstance";
import { useDispatch } from "react-redux";
import { signOut } from "@/store/authSlice";
import { AxiosError } from "axios";
import { ApiResponse } from "@repo/ui/types/ApiResponse";
import type {
  OrderDetails as OrderDetailsType,
  Order,
} from "@repo/ui/types/Order";
import OrderCard from "@/components/order-card";
import { ScrollArea, ScrollBar } from "@repo/ui/components/scroll-area";
import { Card, CardFooter } from "@repo/ui/components/card";
import { Search, X } from "lucide-react";
import { useDebounceCallback } from "usehooks-ts";
import { cn } from "@repo/ui/lib/utils";
import { useSocket } from "@/context/SocketContext";

const Page = () => {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab");
  const search = searchParams.get("search");
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [tabName, setTabName] = useState<string>(tab || "all");
  const [allOrders, setAllOrders] = useState<OrderDetailsType>(null);
  const [tabPages, setTabPages] = useState<{ [key: string]: number }>({
    all: 1,
  });
  const [isPageChanging, setIsPageChanging] = useState<boolean>(false);
  const dispatch = useDispatch();
  const router = useRouter();
  const observer = useRef<IntersectionObserver>(null);
  const currentPage = tabPages[tabName] || 1;
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [searchInput, setSearchInput] = useState<string>(search || "");
  const debouncedSearchInput = useDebounceCallback(setSearchInput, 300);
  const socket = useSocket();

  const fetchOrders = useCallback(async () => {
    if (!slug) {
      toast.error("Restaurant slug is required to fetch orders");
      return;
    }

    if (tabName === "search" && searchInput.trim() === "") return;

    try {
      let query = "";
      switch (tabName) {
        case "all":
          query = "";
          break;
        case "new":
          query = "status=pending";
          break;
        case "inProgress":
          query = "status=preparing";
          break;
        case "ready":
          query = "status=ready";
          break;
        case "unPaid":
          query = "isPaid=false";
          break;
        case "completed":
          query = "status=completed&status=cancelled";
          break;
        case "search":
          query = `search=${searchInput}`;
          break;

        default:
          query = "";
          break;
      }
      if (currentPage === 1) {
        setIsLoading(true);
        const response = await axios.get(`/order/${slug}?${query}`);
        if (
          response.data &&
          response.data.data &&
          Array.isArray(response.data.data.orders)
        ) {
          setAllOrders(response.data.data);
        } else {
          setAllOrders({
            orders: [],
            totalOrders: 0,
            page: 1,
            limit: 1,
            totalPages: 1,
          });
          // Only show error if it's not a search that might just have no results yet
          if (tabName !== "search") {
            toast.error("Failed to fetch orders. Please try again later");
          }
        }
      } else {
        setIsPageChanging(true);
        const response = await axios.get(
          `/order/${slug}?page=${currentPage}&${query}`
        );
        if (
          response.data &&
          response.data.data &&
          Array.isArray(response.data.data.orders)
        ) {
          setAllOrders((prevOrders) => ({
            ...response.data.data,
            orders: [
              ...(prevOrders?.orders || []),
              ...response.data.data.orders,
            ],
          }));
        } else {
          setAllOrders({
            orders: [],
            totalOrders: 0,
            page: 1,
            limit: 1,
            totalPages: 1,
          });
          toast.error("Failed to fetch orders. Please try again later");
        }
      }
    } catch (error) {
      console.error("Failed to fetch orders. Please try again later:", error);
      const axiosError = error as AxiosError<ApiResponse>;
      toast.error(
        axiosError.response?.data.message ||
          "Failed to fetch orders. Please try again later"
      );
      if (axiosError.response?.status === 401) {
        dispatch(signOut());
        router.push(`/signin?redirect=${pathname}`);
      }
    } finally {
      setIsPageChanging(false);
      setIsLoading(false);
    }
  }, [slug, router, dispatch, currentPage, tabName, searchInput, pathname]);

  const lastElementRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries && Array.isArray(entries) && entries[0]?.isIntersecting) {
          if (
            allOrders &&
            allOrders?.totalPages > currentPage &&
            allOrders.page === currentPage
          ) {
            if (isPageChanging) return;
            setTabPages((prev) => ({
              ...prev,
              [tabName]: (prev[tabName] || 1) + 1,
            }));
          }
        }
      });
      if (node) observer.current.observe(node);
    },
    [allOrders, currentPage, tabName, isPageChanging]
  );

  const handleNewOrder = useCallback(
    ({ order }: { order: Order }) => {
      if (tabName !== "all" && tabName !== "new") return;
      setAllOrders((prevOrders) =>
        prevOrders
          ? {
              ...prevOrders,
              orders: [order, ...prevOrders.orders],
            }
          : {
              orders: [order],
              page: 1,
              limit: 10,
              totalOrders: 1,
              totalPages: 1,
            }
      );
    },
    [tabName]
  );

  useEffect(() => {
    if (!socket) return;
    socket.on("newOrder", handleNewOrder);

    return () => {
      socket.off("newOrder", handleNewOrder);
    };
  }, [socket, handleNewOrder]);

  useEffect(() => {
    if (!searchInputRef.current || !search) return;
    searchInputRef.current.value = search;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInputRef]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    setIsLoading(true);
    setAllOrders(null);
    setTabPages((prev) => ({
      ...prev,
      [tabName]: 1,
    }));
  }, [tabName]);

  useEffect(() => {
    const currentParams = new URLSearchParams(searchParams);
    currentParams.set("tab", tabName);
    if (tabName !== "search") {
      currentParams.delete("search");
      setSearchInput("");
      if (searchInputRef.current) {
        searchInputRef.current.value = "";
      }
    } else {
      currentParams.set("search", searchInput);
    }
    router.replace(`${pathname}?${currentParams.toString()}`);
  }, [tabName, searchInput, pathname, searchParams, router]);

  return (
    <div className="flex flex-1 flex-col p-4 md:gap-6 lg:p-6">
      <Tabs defaultValue="all" value={tabName} onValueChange={setTabName}>
        <div className="flex flex-wrap items-center sm:items-start justify-between gap-2">
          <ScrollArea className="w-full sm:w-0 flex-1 pb-2 max-w-[calc(100vw-2rem)] overflow-y-auto rounded-md">
            <TabsList>
              {[
                {
                  tab: "all",
                  label: "All",
                },
                {
                  tab: "new",
                  label: "New",
                },
                {
                  tab: "inProgress",
                  label: "In Progress",
                },
                {
                  tab: "ready",
                  label: "Ready",
                },
                {
                  tab: "unPaid",
                  label: "Unpaid",
                },
                {
                  tab: "completed",
                  label: "Completed",
                },
              ].map(({ tab, label }) => (
                <TabsTrigger
                  key={tab}
                  value={tab}
                  className="font-medium data-[state=active]:font-semibold data-[state=active]:bg-primary! data-[state=active]:text-primary-foreground! data-[state=active]:border-b-2 data-[state=active]:border-primary transition-all duration-200"
                >
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
            <ScrollBar orientation="horizontal" className="h-2" />
          </ScrollArea>
          <InputGroup className="w-full sm:w-auto sm:min-w-[300px] border-zinc-400 has-[[data-slot=input-group-control]:focus-visible]:border-foreground has-[[data-slot=input-group-control]:focus-visible]:ring-foreground has-[[data-slot=input-group-control]:focus-visible]:ring-1">
            <InputGroupInput
              placeholder="Search orders by ID, table name, food item name..."
              type="search"
              onChange={(e) => {
                debouncedSearchInput(e.target.value);
                if (e.target.value.trim() === "") {
                  setTabName("all");
                  setSearchInput("");
                } else {
                  setTabName("search");
                }
              }}
              ref={searchInputRef}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (searchInputRef.current?.value.trim() === "") {
                    toast.error("Search input cannot be empty");
                    return;
                  }
                  debouncedSearchInput.cancel();
                  setTabName("search");
                  setSearchInput(searchInputRef.current?.value || "");
                }
              }}
            />
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                className={cn(
                  "hover:opacity-100 hover:bg-accent h-6 w-6",
                  searchInputRef.current && searchInputRef.current.value !== ""
                    ? ""
                    : "hidden"
                )}
                onClick={() => {
                  if (searchInputRef.current) {
                    setSearchInput("");
                    searchInputRef.current.value = "";
                    setTabName("all");
                  }
                }}
              >
                <X />
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </div>

        <TabsContent value={tabName}>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 my-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className={`animate-pulse ${index > 0 ? `delay-${(index + 1) * 100}` : ""} h-80 border border-accent shadow-md rounded-md flex flex-col justify-between p-4`}
                >
                  <div className="flex flex-col gap-2 w-full">
                    <div className="animate-pulse bg-accent h-6 w-full rounded-md"></div>
                    <div className="animate-pulse bg-accent h-4 w-4/5 rounded-md"></div>
                  </div>
                  <div className="animate-pulse bg-accent h-15 w-full rounded-md"></div>
                  <div className="animate-pulse bg-accent h-8 w-1/3 rounded-md"></div>
                </div>
              ))}
            </div>
          ) : allOrders &&
            Array.isArray(allOrders.orders) &&
            allOrders.orders.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 my-4">
              {allOrders.orders.map((order, index) => (
                <OrderCard
                  key={order._id}
                  order={order}
                  ref={
                    index === allOrders.orders.length - 4
                      ? lastElementRef
                      : null
                  }
                  setOrders={setAllOrders}
                  restaurantSlug={slug}
                />
              ))}
              {isPageChanging ||
                (allOrders.totalPages > currentPage &&
                  Array.from({ length: 3 }).map((_, index) => (
                    <div
                      key={index}
                      className={`animate-pulse ${index > 0 ? `delay-${(index + 1) * 100}` : ""} h-80 border border-accent shadow-md rounded-md flex flex-col justify-between p-4`}
                    >
                      <div className="flex flex-col gap-2 w-full">
                        <div className="animate-pulse bg-accent h-6 w-full rounded-md"></div>
                        <div className="animate-pulse bg-accent h-4 w-4/5 rounded-md"></div>
                      </div>
                      <div className="animate-pulse bg-accent h-15 w-full rounded-md"></div>
                      <div className="animate-pulse bg-accent h-8 w-1/3 rounded-md"></div>
                    </div>
                  )))}
            </div>
          ) : (
            <Card className="@container/card mt-4">
              <CardFooter className="flex-col gap-4 text-sm flex justify-center">
                <div className="line-clamp-1 flex gap-2 font-medium text-center text-balance">
                  No orders found
                </div>
              </CardFooter>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Page;
