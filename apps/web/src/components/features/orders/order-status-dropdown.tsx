"use client";

import { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@repo/ui/components/tooltip";
import { Badge } from "@repo/ui/components/badge";
import {
  BellRing,
  ChefHat,
  Utensils,
  Soup,
  CheckCheck,
  ChevronDownIcon,
} from "lucide-react";
import { IconReceiptOff } from "@tabler/icons-react";
import { toast } from "sonner";
import { Order, OrderDetails, ApiResponse } from "@repo/types";
import axios from "@/utils/axiosInstance";
import { AxiosError } from "axios";
import { signOut } from "@/store/authSlice";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";

const OrderStatusDropdown = ({
  orderId,
  orderInitialStatus,
  restaurantSlug,
  setOrders,
}: {
  orderId: Order["_id"];
  orderInitialStatus: Order["status"];
  restaurantSlug: string;
  setOrders?: React.Dispatch<React.SetStateAction<OrderDetails>>;
}) => {
  const [status, setStatus] = useState(orderInitialStatus);
  const router = useRouter();
  const dispatch = useDispatch();
  const orderStatusIcons = [
    {
      status: "pending",
      icon: <BellRing />,
      message: "New Order",
      color: "bg-yellow-500 text-white",
      actionLabel: "Pending",
    },
    {
      status: "preparing",
      icon: <ChefHat />,
      message: "Cooking now",
      color: "bg-orange-500 text-white",
      actionLabel: "Preparing",
    },
    {
      status: "ready",
      icon: <Utensils />,
      message: "Ready to serve",
      color: "bg-green-500 text-white",
      actionLabel: "Ready",
    },
    {
      status: "served",
      icon: <Soup />,
      message: "Food on the table",
      color: "bg-blue-500 text-white",
      actionLabel: "Served",
    },
    {
      status: "completed",
      icon: <CheckCheck />,
      message: "Payment done. \nOrder completed",
      color: "bg-purple-500 text-white",
      actionLabel: "Completed",
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
    (item) => item.status === status,
  );

  // Only show statuses after current one (excluding itself)
  const availableNextStatuses = orderStatusIcons.slice(currentStatusIndex + 1);

  useEffect(() => {
    setStatus(orderInitialStatus);
  }, [orderInitialStatus]);

  const handleUpdateStatus = async (newStatus: string) => {
    if (!availableNextStatuses.some((item) => item.status === newStatus)) {
      toast.error("Invalid status update");
      return;
    }
    if (newStatus === status) {
      toast.info("Order status is already " + status);
      return;
    }
    const prevStatus = status;
    setStatus(newStatus as Order["status"]);
    try {
      const response = await axios.patch(
        `/order/${restaurantSlug}/${orderId}/status`,
        { status: newStatus },
      );

      if (!response.data || !response.data.data || !response.data.data.status) {
        console.error("Invalid response data:", response.data);
        toast.error("Failed to update order status. Please try again later");
        return;
      }
      setStatus(response.data.data.status);
      if (setOrders) {
        setOrders((prevOrders) => {
          if (!prevOrders) return prevOrders;
          return {
            ...prevOrders,
            orders: prevOrders.orders.map((order) => {
              if (order._id === orderId) {
                return {
                  ...order,
                  status: response.data.data.status,
                };
              }
              return order;
            }),
          };
        });
      }
      toast.success("Order status updated successfully");
    } catch (error) {
      setStatus(prevStatus);
      console.error(
        "Failed to update order status. Please try again later:",
        error,
      );
      const axiosError = error as AxiosError<ApiResponse>;
      toast.error(
        axiosError.response?.data.message ||
          "Failed to update order status. Please try again later",
      );
      if (axiosError.response?.status === 401) {
        dispatch(signOut());
        router.push("/signin?redirect=" + window.location.pathname);
      }
    }
  };

  return (
    <div className="relative">
      {availableNextStatuses.length > 0 &&
      availableNextStatuses[0]?.status !== "cancelled" ? (
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge
                  variant="default"
                  className={`cursor-pointer pr-0.5 ${
                    orderStatusIcons.find((icon) => icon.status === status)
                      ?.color || ""
                  }`}
                >
                  {orderStatusIcons.find((icon) => icon.status === status)
                    ?.icon || "❓"}
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                  <span className="border-l border-white">
                    <ChevronDownIcon className="size-4" />
                  </span>
                </Badge>
              </TooltipTrigger>
              <TooltipContent>Click to Change Order Status</TooltipContent>
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
          className={`cursor-default ${
            orderStatusIcons.find((icon) => icon.status === status)?.color || ""
          }`}
        >
          {orderStatusIcons.find((icon) => icon.status === status)?.icon ||
            "❓"}
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      )}
      <div
        className={`absolute ${status === "completed" ? "-bottom-7.5" : "-bottom-5"} right-0 text-[10px] flex items-center gap-1 text-muted-foreground w-max whitespace-pre-line`}
      >
        <span
          className={`${
            orderStatusIcons.find((icon) => icon.status === status)?.color || ""
          } w-1 h-1 rounded-full block`}
        ></span>
        {orderStatusIcons.find((icon) => icon.status === status)?.message || ""}
      </div>
    </div>
  );
};

export default OrderStatusDropdown;
