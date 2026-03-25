"use client";

import axios from "@/utils/axiosInstance";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import { ApiResponse, FullOrderDetailsType } from "@repo/types";
import { AxiosError } from "axios";
import {
  ArrowLeft,
  CheckCircle2,
  ChefHat,
  Download,
  Loader2,
  Utensils,
  UtensilsCrossed,
  XCircle,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { cn } from "@repo/ui/lib/utils";
import { useSocket } from "@/context/SocketContext";
import VegNonVegTooltip from "@/components/shared/veg-nonveg-tooltip";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@repo/ui/components/avatar";
import { IconReceipt, IconSalad } from "@tabler/icons-react";
import { getOptimizedUrl } from "@/utils/imageOptimizer";

const CustomerOrderDetailsClientPage = () => {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const orderId = params.orderId as string;
  const socket = useSocket();

  const [order, setOrder] = useState<FullOrderDetailsType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrderDetails = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`/order/${slug}/${orderId}`);
      if (response.data.success) {
        setOrder(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching order details:", error);
      const axiosError = error as AxiosError<ApiResponse>;
      toast.error(
        axiosError.response?.data.message || "Failed to load order details",
      );
    } finally {
      setIsLoading(false);
    }
  }, [slug, orderId]);

  useEffect(() => {
    if (slug && orderId) {
      fetchOrderDetails();
    }
  }, [fetchOrderDetails, slug, orderId]);

  useEffect(() => {
    if (!socket || !orderId) return;

    const handleConnect = () => {
      socket.emit("joinOrderRoom", orderId);
      console.log("Emitted joinOrderRoom event with order ID:", orderId);
    };

    if (socket.connected) {
      handleConnect();
    }

    // Always listen for "connect" to handle reconnects cleanly
    socket.on("connect", handleConnect);

    const handleOrderUpdate = (socketData: FullOrderDetailsType) => {
      setOrder((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          status: socketData.status,
          isPaid: socketData.isPaid,
        };
      });
    };

    socket.on("orderUpdate", handleOrderUpdate);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("orderUpdate", handleOrderUpdate);
    };
  }, [socket, orderId]);

  // Order Progress Steps
  const orderSteps = useMemo(() => {
    const steps = [
      { id: "pending", label: "Placed", icon: IconReceipt, isError: false },
      { id: "preparing", label: "Preparing", icon: ChefHat, isError: false },
      { id: "ready", label: "Ready", icon: Utensils, isError: false },
      {
        id: "completed",
        label: "Completed",
        icon: CheckCircle2,
        isError: false,
      },
    ];

    if (order?.status === "cancelled") {
      return [
        { id: "pending", label: "Placed", icon: IconReceipt, isError: false },
        { id: "cancelled", label: "Cancelled", icon: XCircle, isError: true },
      ];
    }
    return steps;
  }, [order?.status]);

  const currentStepIndex = useMemo(() => {
    if (!order) return 0;
    if (order.status === "cancelled") return 1;
    if (order.status === "served") return 3; // Treat served as completed for customer view
    const statusMap: Record<string, number> = {
      pending: 0,
      preparing: 1,
      ready: 2,
      completed: 3,
    };
    return statusMap[order.status] ?? 0;
  }, [order]);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <h2 className="text-2xl font-semibold">Order not found</h2>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-6 md:py-10">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>

      <Card className="mb-6 overflow-hidden border-none shadow-sm ring-1 ring-border">
        <CardHeader className="gap-0">
          <CardTitle className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Order Details</h1>
            <Button
              variant="ghost"
              onClick={() =>
                window.open(
                  `/${slug}/bill/${orderId}`,
                  "PRINT",
                  "height=600,width=800",
                )
              }
            >
              <Download />
            </Button>
          </CardTitle>
        </CardHeader>

        {/* Progress Bar */}
        <CardContent>
          <div className="relative flex justify-between">
            {/* Connecting Line */}
            <div className="absolute top-5 left-0 h-[2px] w-full bg-muted/50 -z-0 block" />
            <div
              className={cn(
                "absolute top-5 left-0 h-[2px] dark:bg-green-700 bg-green-400 -z-0 block transition-all duration-300 ease-in-out",
                order.status === "cancelled" &&
                  "bg-destructive dark:bg-destructive",
              )}
              style={{
                width: `${orderSteps.length === currentStepIndex + 1 ? 100 : ((currentStepIndex + 0.5) / orderSteps.length) * 100}%`,
              }}
            />

            {orderSteps.map((step, index) => {
              const isCompleted = index <= currentStepIndex;
              const Icon = step.icon;

              return (
                <div
                  key={step.id}
                  className="flex flex-1 flex-col items-center gap-2 z-10"
                >
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300 bg-background",
                      isCompleted && !step.isError
                        ? "dark:border-green-600 dark:bg-green-600 border-green-300 bg-green-300 text-primary-foreground"
                        : "border-muted text-muted-foreground",
                      step.isError && isCompleted
                        ? "border-destructive bg-destructive text-destructive-foreground"
                        : "",
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <span
                    className={cn(
                      "text-xs font-medium text-center",
                      isCompleted
                        ? "text-primary-foreground"
                        : "dark:text-muted-foreground text-muted-foreground/70",
                    )}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>

        <CardContent className="flex items-center justify-between">
          <div>
            <p className="font-medium">Order #{order.orderNo}</p>
            <div className="text-sm text-muted-foreground flex flex-col justify-between">
              <p>
                {new Date(order.createdAt).toLocaleDateString("en-US", {
                  weekday: "short",
                  year: "numeric",
                  month: "long",
                  day: "2-digit",
                })}
              </p>
              <p>
                {new Date(order.createdAt)
                  .toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  })
                  .toUpperCase()}
              </p>
            </div>
          </div>
          <div className="ml-auto">
            <Badge variant={order.isPaid ? "default" : "destructive"}>
              {order.isPaid ? "Paid" : "Unpaid"}
            </Badge>
          </div>
        </CardContent>

        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <UtensilsCrossed className="w-5 h-5" />
            Items Ordered
          </CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          {order.orderedFoodItems.map((item, idx) => (
            <div key={idx} className="flex py-4 first:pt-0 last:pb-0">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <div className="font-medium flex items-center gap-2">
                    <Avatar className="size-12 lg:size-16 rounded-lg">
                      <AvatarImage
                        src={getOptimizedUrl(item.firstImageUrl, 300, 300)}
                        alt={item.foodName}
                        className="object-cover"
                        draggable={false}
                      />
                      <AvatarFallback className="rounded-lg">
                        <IconSalad />
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-lg flex flex-col">
                      <span className="flex items-baseline gap-1">
                        <VegNonVegTooltip
                          foodType={item.foodType}
                          innerClassName="size-1"
                        />
                        {item.foodName}
                        {item.isVariantOrder && item.variantDetails
                          ? ` (${item.variantDetails.variantName})`
                          : ""}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        Qty: {item.quantity} x ₹{item.finalPrice ?? item.price}{" "}
                        {item.finalPrice !== item.price ? (
                          <span className="text-xs font-normal line-through">
                            ₹{item.price}
                          </span>
                        ) : (
                          ""
                        )}
                      </span>
                    </div>
                  </div>
                  {item.finalPrice < item.price ? (
                    <div className="flex items-center flex-col">
                      <span className="text-xs font-normal line-through text-muted-foreground">
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </span>
                      <span className="font-semibold">
                        ₹
                        {(
                          (item.finalPrice ?? item.price) * item.quantity
                        ).toFixed(2)}
                      </span>
                    </div>
                  ) : (
                    <span className="font-semibold">
                      ₹
                      {(
                        (item.finalPrice ?? item.price) * item.quantity
                      ).toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Bill Details */}
      <Card className="border-none shadow-sm ring-1 ring-border gap-3">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <IconReceipt className="w-5 h-5" />
            Bill Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm items-end">
            <span className="text-muted-foreground">Item Total</span>
            {order.orderedFoodItems.reduce(
              (acc, item) => acc + item.price * item.quantity,
              0,
            ) > order.subtotal ? (
              <div className="flex flex-col items-end">
                <span className="line-through text-muted-foreground text-xs">
                  ₹
                  {order.orderedFoodItems
                    .reduce((acc, item) => acc + item.price * item.quantity, 0)
                    .toFixed(2)}
                </span>
                <span className="font-semibold">
                  ₹{order.subtotal.toFixed(2)}
                </span>
              </div>
            ) : (
              <span className="font-semibold">
                ₹{order.subtotal.toFixed(2)}
              </span>
            )}
          </div>
          {order.taxAmount && order.taxAmount > 0 ? (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                Tax {order.taxRate ? `(${order.taxRate}%)` : ""}
              </span>
              <span>+₹{order.taxAmount.toFixed(2)}</span>
            </div>
          ) : null}
          <div className="border-t pt-3 flex justify-between font-bold text-lg">
            <span>Total</span>
            <span>₹{order.totalAmount.toFixed(2)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerOrderDetailsClientPage;
