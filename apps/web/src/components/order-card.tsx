import type {
  Order,
  OrderDetails as OrderDetailsType,
} from "@repo/ui/types/Order";
import { Badge } from "@repo/ui/components/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@repo/ui/components/tooltip";
import {
  BellRing,
  BookCheck,
  CheckCheck,
  Loader2,
  Soup,
  Timer,
} from "lucide-react";
import { IconReceipt, IconReceiptOff } from "@tabler/icons-react";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent } from "@repo/ui/components/card";
import OrderDetails from "@/components/order-details";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import axios from "@/utils/axiosInstance";
import { toast } from "sonner";
import { useDispatch } from "react-redux";
import { signOut } from "@/store/authSlice";
import { useRouter } from "next/navigation";
import { AxiosError } from "axios";
import { ApiResponse } from "@repo/ui/types/ApiResponse";
import { useState } from "react";
import { cn } from "@repo/ui/lib/utils";
import VegNonVegTooltip from "./veg-nonveg-tooltip";

const OrderCard = ({
  order,
  restaurantSlug,
  ref,
  className,
  cardContentClassName,
  setOrders,
}: {
  order: Order;
  restaurantSlug: string;
  ref?: React.Ref<HTMLDivElement>;
  className?: string;
  cardContentClassName?: string;
  setOrders: React.Dispatch<React.SetStateAction<OrderDetailsType>>;
}) => {
  const dispatch = useDispatch();
  const router = useRouter();
  const [status, setStatus] = useState(order.status);
  const [isBtnLoading, setIsBtnLoading] = useState(false);

  const orderStatusIcons = [
    {
      status: "pending",
      icon: <BellRing />,
      message: "New Order",
      color: "bg-yellow-500 text-white",
      actionLabel: "Mark as Pending",
    },
    {
      status: "preparing",
      icon: <Timer />,
      message: "Cooking now",
      color: "bg-orange-500 text-white",
      actionLabel: "Mark as Preparing",
    },
    {
      status: "ready",
      icon: <CheckCheck />,
      message: "Ready to serve",
      color: "bg-green-500 text-white",
      actionLabel: "Mark as Ready",
    },
    {
      status: "served",
      icon: <Soup />,
      message: "Food on the table",
      color: "bg-blue-500 text-white",
      actionLabel: "Mark as Served",
    },
    {
      status: "completed",
      icon: <BookCheck />,
      message: "Payment done. \nOrder completed",
      color: "bg-purple-500 text-white",
      actionLabel: "Mark as Completed",
    },
    {
      status: "cancelled",
      icon: <IconReceiptOff />,
      message: "Order cancelled",
      color: "bg-red-500 text-white",
      actionLabel: "Cancel Order",
    },
  ];

  const currentStatusIndex = orderStatusIcons.findIndex(
    (item) => item.status === status
  );

  // Only show statuses after current one (excluding itself)
  const availableNextStatuses = orderStatusIcons.slice(currentStatusIndex + 1);

  const handleUpdateStatus = async (status: string) => {
    if (!availableNextStatuses.some((item) => item.status === status)) {
      toast.error("Invalid status update");
      return;
    }
    if (status === order.status) {
      toast.info("Order status is already " + status);
      return;
    }
    const prevStatus = order.status;
    setStatus(status as Order["status"]);
    try {
      const response = await axios.patch(
        `/order/${restaurantSlug}/${order._id}/status`,
        { status }
      );

      if (!response.data || !response.data.data || !response.data.data.status) {
        console.error("Invalid response data:", response.data);
        toast.error("Failed to update order status. Please try again later");
        return;
      }
      setStatus(response.data.data.status);
      toast.success("Order status updated successfully");
    } catch (error) {
      setStatus(prevStatus);
      console.error(
        "Failed to fetch un paid orders. Please try again later:",
        error
      );
      const axiosError = error as AxiosError<ApiResponse>;
      toast.error(
        axiosError.response?.data.message ||
          "Failed to fetch un paid orders. Please try again later"
      );
      if (axiosError.response?.status === 401) {
        dispatch(signOut());
        router.push("/signin");
      }
    } finally {
      // setIsLoading(false);
    }
  };

  const handleUpdatePaidStatus = async () => {
    setIsBtnLoading(true);
    try {
      const response = await axios.patch(
        `/order/${restaurantSlug}/${order._id}/paid-status`
      );

      if (!response.data || !response.data.data) {
        console.error("Invalid response data:", response.data);
        toast.error(
          "Failed to update order paid status. Please try again later"
        );
        return;
      }
      setOrders((prev) =>
        prev
          ? {
              ...prev,
              orders: prev.orders.map((o) =>
                o._id === order._id ? { ...o, ...response.data.data } : o
              ),
            }
          : null
      );
      toast.success(`Order payment status updated successfully`);
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse>;
      toast.error(
        axiosError.response?.data.message ||
          "Failed to fetch un paid orders. Please try again later"
      );
      if (axiosError.response?.status === 401) {
        dispatch(signOut());
        router.push(`/signin?redirect=${window.location.pathname}`);
      }
    } finally {
      setIsBtnLoading(false);
    }
  };

  return (
    <Card
      ref={ref}
      className={cn(
        "overflow-hidden transition-all duration-200 hover:scale-101 hover:shadow-md",
        className
      )}
    >
      <CardContent className={cn("flex flex-col justify-between h-full", cardContentClassName)}>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm font-medium">
            <span>Table: {order.table.tableName}</span>

            <div className="relative">
              {availableNextStatuses.length > 0 &&
              availableNextStatuses[0]?.status !== "cancelled" ? (
                <DropdownMenu>
                  <DropdownMenuTrigger>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge
                          variant="default"
                          className={`cursor-pointer ${
                            orderStatusIcons.find(
                              (icon) => icon.status === status
                            )?.color || ""
                          }`}
                        >
                          {orderStatusIcons.find(
                            (icon) => icon.status === status
                          )?.icon || "❓"}
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        Click to Change Order Status
                      </TooltipContent>
                    </Tooltip>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {availableNextStatuses.map((status) => {
                      return (
                        <DropdownMenuItem
                          key={status.status}
                          className="cursor-pointer"
                          onClick={() => {
                            handleUpdateStatus(status.status);
                          }}
                        >
                          {status.icon}{" "}
                          {status.actionLabel ||
                            status.status.charAt(0).toUpperCase() +
                              status.status.slice(1)}
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Badge
                  variant="default"
                  className={`cursor-pointer ${
                    orderStatusIcons.find((icon) => icon.status === status)
                      ?.color || ""
                  }`}
                >
                  {orderStatusIcons.find((icon) => icon.status === status)
                    ?.icon || "❓"}
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Badge>
              )}
              <div
                className={`absolute ${status === "completed" ? "-bottom-7.5" : "-bottom-5"} right-0 text-[10px] flex items-center gap-1 text-muted-foreground w-max whitespace-pre-line`}
              >
                <span
                  className={`${
                    orderStatusIcons.find((icon) => icon.status === status)
                      ?.color || ""
                  } w-1 h-1 rounded-full block`}
                ></span>
                {orderStatusIcons.find((icon) => icon.status === status)
                  ?.message || ""}
              </div>
            </div>
          </div>
          <p className="text-muted-foreground text-xs mt-0.5">
            Order #{order.orderNo}
          </p>

          <div className="flex items-center justify-between">
            <p className="text-xs font-medium">Payment Status</p>
            <Badge
              variant={order.isPaid ? "success" : "destructive"}
              className="text-xs"
            >
              {order.isPaid ? "Paid" : "Unpaid"}
            </Badge>
          </div>

          <div className="text-right text-xs text-muted-foreground flex items-center justify-between">
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

          <div className="pt-2 text-sm space-y-1">
            <Table>
              <TableHeader className="border-t">
                <TableRow>
                  <TableHead className="text-left">Items</TableHead>
                  <TableHead className="text-center">Qty</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.orderedFoodItems.map((item, index) => (
                  <TableRow
                    key={item.foodItemId + index + order._id}
                    className="text-foreground/80"
                  >
                    <TableCell className="font-medium flex items-center gap-2 text-left whitespace-pre-wrap">
                      <VegNonVegTooltip foodType={item.foodType} innerClassName="size-1" />
                      <span>
                        {item.foodName}
                        {item.isVariantOrder ? ` (${item.variantName})` : ""}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      {item.quantity}
                    </TableCell>
                    <TableCell className="text-right">
                      ₹{(item.finalPrice * item.quantity).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell className="text-left">Total</TableCell>
                  <TableCell className="text-center">
                    {order.orderedFoodItems.reduce(
                      (prv, item) => prv + item.quantity,
                      0
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    ₹{order.totalAmount.toFixed(2)}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </div>
        <div className="flex gap-2 pt-3 justify-between sm:flex-row flex-col">
          <OrderDetails
            order={order}
            restaurantSlug={restaurantSlug}
            orderStatusIcons={orderStatusIcons}
            status={status}
            handleUpdateStatus={handleUpdateStatus}
          >
            <Button variant="outline" className="border bg-background hover:bg-accent">See Details</Button>
          </OrderDetails>
          {order.isPaid ? (
            <Button
              onClick={() =>
                window.open(
                  `/${restaurantSlug}/bill/${order._id}`,
                  "PRINT",
                  "height=600,width=800"
                )
              }
            >
              <IconReceipt /> See Bill
            </Button>
          ) : (
            <Button onClick={handleUpdatePaidStatus} disabled={isBtnLoading}>
              {isBtnLoading ? (
                <>
                  <Loader2 className="animate-spin" />
                  Loading...
                </>
              ) : (
                "Mark as Paid"
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderCard;
