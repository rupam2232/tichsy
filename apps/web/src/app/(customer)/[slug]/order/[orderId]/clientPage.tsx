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
import { ApiResponse } from "@repo/ui/types/ApiResponse";
import { FullOrderDetailsType } from "@repo/ui/types/Order";
import { AxiosError } from "axios";
import {
  ArrowLeft,
  CheckCircle2,
  ChefHat,
  Clock,
  Loader2,
  MapPin,
  Receipt,
  UtensilsCrossed,
  XCircle,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { cn } from "@repo/ui/lib/utils";
import { useSocket } from "@/context/SocketContext";
import VegNonVegTooltip from "@/components/veg-nonveg-tooltip";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@repo/ui/components/avatar";
import { IconSalad } from "@tabler/icons-react";

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

    socket.emit("joinOrderRoom", orderId);

    const handleOrderUpdate = (socketData: FullOrderDetailsType) => {
      setOrder((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          status: socketData.status,
          isPaid: socketData.isPaid,
        };
      });
      toast.info(`Order status updated: ${socketData.status}`);
    };

    socket.on("orderUpdate", handleOrderUpdate);

    return () => {
      socket.off("orderUpdate", handleOrderUpdate);
    };
  }, [socket, orderId]);

  // Order Progress Steps
  const orderSteps = useMemo(() => {
    const steps = [
      { id: "pending", label: "Order Placed", icon: Receipt },
      { id: "preparing", label: "Preparing", icon: ChefHat },
      { id: "ready", label: "Ready", icon: UtensilsCrossed },
      { id: "completed", label: "Completed", icon: CheckCircle2 },
    ];

    if (order?.status === "cancelled") {
      return [
        { id: "pending", label: "Order Placed", icon: Receipt },
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
        <div>
          <h1 className="text-2xl font-bold">Order Details</h1>
          <p className="text-sm text-muted-foreground">
            Order #{order.orderNo} •{" "}
            {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>
        <div className="ml-auto">
          <Badge variant={order.isPaid ? "default" : "destructive"}>
            {order.isPaid ? "Paid" : "Unpaid"}
          </Badge>
        </div>
      </div>

      {/* Progress Bar */}
      <Card className="mb-6 overflow-hidden border-none shadow-sm ring-1 ring-border">
        <CardContent className="p-6">
          <div className="relative flex justify-between">
            {/* Connecting Line */}
            <div className="absolute top-5 left-0 h-[2px] w-full bg-muted/50 -z-0 hidden md:block" />

            {orderSteps.map((step, index) => {
              const isCompleted = index <= currentStepIndex;
              const isCurrent = index === currentStepIndex;
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
                        ? "border-primary bg-primary text-primary-foreground"
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
                      isCurrent ? "text-foreground" : "text-muted-foreground",
                      step.isError ? "text-destructive" : "",
                    )}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
          {/* Mobile Progress Bar (Simple Text) */}
          <div className="mt-6 md:hidden text-center">
            <p className="font-semibold text-lg flex items-center justify-center gap-2">
              Current Status:
              <span
                className={cn(
                  "text-primary capitalize",
                  order.status === "cancelled" && "text-destructive",
                )}
              >
                {order.status}
              </span>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Order Items */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Column: Items */}
        <div className="md:col-span-2 space-y-6">
          <Card className="border-none shadow-sm ring-1 ring-border">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <UtensilsCrossed className="w-5 h-5 text-primary" />
                Items Ordered
              </CardTitle>
            </CardHeader>
            <CardContent className="divide-y">
              {order.orderedFoodItems.map((item, idx) => (
                <div key={idx} className="flex py-4 first:pt-0 last:pb-0">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-1">
                      <div className="font-medium flex items-center gap-2">
                        <Avatar className="size-16 rounded-lg">
                          <AvatarImage
                            src={item.firstImageUrl}
                            alt={item.foodName}
                            className="object-cover"
                            draggable={false}
                          />
                          <AvatarFallback className="rounded-lg">
                            <IconSalad />
                          </AvatarFallback>
                        </Avatar>
                        <div className="text-lg flex flex-col">
                          <span className="flex items-center gap-1">
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
                            Qty: {item.quantity} x ₹{item.finalPrice ?? item.price} {item.finalPrice !== item.price ? <span className="text-xs font-normal line-through">₹{item.price}</span> : ""}
                          </span>
                        </div>
                      </div>
                      <span className="font-semibold">
                        ₹
                        {(
                          (item.finalPrice ?? item.price) * item.quantity
                        ).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Bill Details */}
        <div className="space-y-6">
          <Card className="border-none shadow-sm ring-1 ring-border">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Receipt className="w-5 h-5 text-primary" />
                Bill Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Item Total</span>
                <span>₹{order.subtotal?.toFixed(2) || "0.00"}</span>
              </div>
              {order.taxAmount && order.taxAmount > 0 ? (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Tax{" "}
                    {order.restaurant.taxRate
                      ? `(${order.restaurant.taxRate}%)`
                      : ""}
                  </span>
                  <span>+₹{order.taxAmount.toFixed(2)}</span>
                </div>
              ) : null}
              {order.discountAmount && order.discountAmount > 0 ? (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount</span>
                  <span>-₹{order.discountAmount.toFixed(2)}</span>
                </div>
              ) : null}
              <div className="border-t pt-3 flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>₹{order.totalAmount.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm ring-1 ring-border">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Table Details</p>
                    <p className="text-sm text-muted-foreground">
                      {order.table?.tableName || "N/A"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Estimate Time</p>
                    <p className="text-sm text-muted-foreground">20-30 mins</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CustomerOrderDetailsClientPage;
