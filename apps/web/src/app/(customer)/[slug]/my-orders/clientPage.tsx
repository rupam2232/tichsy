"use client";

import { RootState } from "@/store/store";
import { useParams, useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import axios from "@/utils/axiosInstance";
import { useCallback, useEffect, useState } from "react";
import { AxiosError } from "axios";
import { ApiResponse, Order } from "@repo/types";
import { toast } from "sonner";
import { Card, CardContent, CardHeader } from "@repo/ui/components/card";
import { Loader2 } from "lucide-react";
import { Button } from "@repo/ui/components/button";

const MyOrdersClientPage = () => {
  const router = useRouter();
  const { slug } = useParams<{ slug: string }>();
  const orderHistory = useSelector((state: RootState) => state.orderHistory);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isPageLoading, setIsPageLoading] = useState<boolean>(true);

  const fetchMyOrderDetails = useCallback(async () => {
    const orderIds = Array.isArray(orderHistory)
      ? orderHistory.find((order) => order.restaurantSlug === slug)?.orderIds ||
        []
      : [];

    if (!orderIds || orderIds.length === 0) {
      setIsPageLoading(false);
      return;
    }
    setIsPageLoading(true);
    try {
      const response = await axios.get(
        `/order/by-ids?restaurantSlug=${slug}&orderIds=${orderIds.length > 0 ? orderIds.join(",") : orderIds}`,
      );
      setOrders(response.data.data);
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse>;
      console.error("Error fetching order details:", axiosError.response?.data);
      toast.error(
        axiosError.response?.data.message ||
          "Failed to fetch all food items. Please try again later",
      );
    } finally {
      setIsPageLoading(false);
    }
  }, [slug, orderHistory]);

  useEffect(() => {
    fetchMyOrderDetails();
  }, [fetchMyOrderDetails]);

  if (isPageLoading) {
    return (
      <div className="flex items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">My Orders</h1>
        <p className="text-muted-foreground">
          Track your order history and status
        </p>
      </div>
      {orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card
              key={order._id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push(`/${slug}/order/${order._id}`)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div>
                      <h3 className="font-semibold text-foreground">
                        Order #{order.orderNo}
                      </h3>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>
                      {order.orderedFoodItems.length} item
                      {order.orderedFoodItems.length !== 1 ? "s" : ""}
                    </span>
                    <span>•</span>
                    <span
                      className={
                        order.isPaid ? "text-green-600" : "text-red-600"
                      }
                    >
                      {order.isPaid ? "Paid" : "Unpaid"}
                    </span>
                  </div>
                  <div className="text-lg font-semibold text-foreground">
                    ₹{order.totalAmount.toFixed(2)}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    {order.orderedFoodItems.slice(0, 3).map((item, index) => (
                      <span
                        key={index}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium`}
                      >
                        {item.foodName}
                        {item.quantity > 1 && ` x${item.quantity}`}
                      </span>
                    ))}
                    {order.orderedFoodItems.length > 3 && (
                      <span className="text-xs text-muted-foreground px-2 py-1">
                        +{order.orderedFoodItems.length - 3} more
                      </span>
                    )}
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-primary hover:text-primary/80"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/${slug}/order/${order._id}`);
                    }}
                  >
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-muted-foreground text-lg mb-2">
            No orders found
          </div>
          <p className="text-sm text-muted-foreground">
            Your order history will appear here once you place your first order.
          </p>
        </div>
      )}
    </div>
  );
};

export default MyOrdersClientPage;
