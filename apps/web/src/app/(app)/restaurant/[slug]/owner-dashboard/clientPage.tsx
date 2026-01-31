"use client";
import axios from "@/utils/axiosInstance";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useDispatch, useSelector } from "react-redux";
import { signOut } from "@/store/authSlice";
import { useRouter } from "next/navigation";
import type { AxiosError } from "axios";
import type { ApiResponse } from "@repo/ui/types/ApiResponse";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import { Loader2, ChartNoAxesColumn, BookCheck } from "lucide-react";
import { IconChartBar, IconReceiptOff, IconSalad } from "@tabler/icons-react";
import { useSocket } from "@/context/SocketContext";
import { Switch } from "@repo/ui/components/switch";
import { Label } from "@repo/ui/components/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@repo/ui/components/alert-dialog";
import type { RootState, AppDispatch } from "@/store/store";
import { setActiveRestaurant } from "@/store/restaurantSlice";
import { OwnerDashboardStats } from "@repo/ui/types/Stats";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/table";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@repo/ui/components/avatar";

const ClientPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [isPageLoading, setIsPageLoading] = useState<boolean>(true);
  const [stats, setStats] = useState<OwnerDashboardStats>();

  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const socket = useSocket();
  const isRestaurantCurrentlyOpen = useSelector(
    (state: RootState) =>
      state.restaurantsSlice.activeRestaurant?.isCurrentlyOpen,
  );
  const user = useSelector((state: RootState) => state.auth.user);

  const fetchDashboardStats = useCallback(async () => {
    try {
      setIsPageLoading(true);
      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const statsResponse = await axios.get(
        `/restaurant/${slug}/owner-dashboard-stats?timezone=${userTimezone}`,
      );

      if (statsResponse.data.success) {
        setStats(statsResponse.data.data);
      } else {
        toast.error(statsResponse.data.message);
      }
    } catch (error) {
      console.error(
        "Failed to fetch dashboard stats. Please try again later:",
        error,
      );
      const axiosError = error as AxiosError<ApiResponse>;
      toast.error(
        axiosError.response?.data.message ||
          "Failed to fetch dashboard stats. Please try again later",
      );
      if (axiosError.response?.status === 401) {
        dispatch(signOut());
        router.push(
          "/signin?redirect=/restaurant/" + slug + "/owner-dashboard",
        );
      }
    } finally {
      setIsPageLoading(false);
    }
  }, [slug, router, dispatch]);

  useEffect(() => {
    fetchDashboardStats();
  }, [slug, fetchDashboardStats]);

  useEffect(() => {
    if (!socket) return;
    socket.on("newOrder", fetchDashboardStats);

    return () => {
      socket.off("newOrder", fetchDashboardStats);
    };
  }, [socket, fetchDashboardStats]);

  const handleToggleRestaurantStatus = async () => {
    try {
      const response = await axios.patch(
        `/restaurant/${slug}/toggle-open-status`,
      );
      if (response.data.success) {
        dispatch(setActiveRestaurant(response.data.data));
        toast.success(response.data.message);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error("Failed to toggle restaurant status:", error);
      const axiosError = error as AxiosError<ApiResponse>;
      toast.error(
        axiosError.response?.data.message ||
          "Failed to toggle restaurant status. Please try again later",
      );
      if (axiosError.response?.status === 401) {
        dispatch(signOut());
        router.push(
          "/signin?redirect=/restaurant/" + slug + "/owner-dashboard",
        );
      }
    }
  };

  if (isPageLoading) {
    return (
      <div className="h-[95vh] flex items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col">
        <div className="flex justify-between items-center px-6 pt-2">
          {user?.role === "owner" && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <div className="inline-flex cursor-pointer gap-2">
                  <Switch
                    id="toggle-restaurant-status"
                    checked={isRestaurantCurrentlyOpen}
                    className="cursor-pointer"
                  />
                  <Label className="cursor-pointer">
                    {isRestaurantCurrentlyOpen
                      ? "Close restaurant"
                      : "Open restaurant"}
                  </Label>
                </div>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    {isRestaurantCurrentlyOpen
                      ? "This will close the restaurant and stop accepting orders."
                      : "This will open the restaurant and start accepting orders."}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleToggleRestaurantStatus}>
                    Continue
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
        <div className="flex flex-col gap-4 md:gap-6 p-4 pt-2! lg:p-6">
          <div className="*:data-[slot=card]:from-foreground/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
            <Card className="@container/card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  All Time Sales
                </CardTitle>
                <IconChartBar className="size-4" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold">
                    ₹{stats?.kpis.allTimeSales.value.toFixed(2) ?? 0}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Total revenue generated to date
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="@container/card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Completed Orders
                </CardTitle>
                <BookCheck className="size-4" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold">
                    {stats?.kpis.totalCompletedOrders.value.toFixed(2) ?? 0}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {stats?.kpis.totalCompletedOrders.description}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="@container/card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  This Month Sales
                </CardTitle>
                <ChartNoAxesColumn className="size-4" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold">
                    ₹{stats?.kpis.thisMonthSales.value.toFixed(2) ?? 0}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {stats?.kpis.thisMonthSales.description}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="@container/card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Today Sales
                </CardTitle>
                <IconReceiptOff className="size-4" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold">
                    ₹{stats?.kpis.todaySales.value.toFixed(2) ?? 0}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {stats?.kpis.todaySales.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 2xl:grid-cols-2 gap-4">
            <ChartAreaInteractive data={stats?.salesTrend} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card className="@container/card">
                <CardHeader>
                  <CardTitle className="text-lg">Top 5 Tables</CardTitle>
                  <CardDescription>
                    List of the most popular tables based on reservations.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader className="border-t">
                      <TableRow>
                        <TableHead className="text-left">Table Name</TableHead>
                        <TableHead className="text-center">Orders</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="border-b">
                      {stats?.topTables && stats?.topTables.length > 0 ? (
                        stats?.topTables.map((item, index) => (
                          <TableRow
                            key={item._id}
                            className="text-foreground/80"
                          >
                            <TableCell className="font-medium flex items-center gap-x-2 text-left whitespace-pre-wrap">
                              <span>{index + 1}.</span>
                              <span>{item.tableName}</span>
                            </TableCell>
                            <TableCell className="text-center">
                              {item.count}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={2} className="text-center">
                            No data available
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
              <Card className="@container/card">
                <CardHeader>
                  <CardTitle className="text-lg">Top 5 Food Items</CardTitle>
                  <CardDescription>
                    List of the most popular food items based on sales.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader className="border-t">
                      <TableRow>
                        <TableHead className="text-left">Food Name</TableHead>
                        <TableHead className="text-center">Orders</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="border-b">
                      {stats?.topFoodItems && stats?.topFoodItems.length > 0 ? (
                        stats?.topFoodItems.map((item, index) => (
                          <TableRow
                            key={item._id + (item.variantName ?? item.foodName)}
                            className="text-foreground/80"
                          >
                            <TableCell className="font-medium flex items-center gap-x-2 text-left whitespace-pre-wrap">
                              <span>{index + 1}.</span>
                              {item.firstImageUrl ? (
                                <Avatar>
                                  <AvatarImage
                                    src={item.firstImageUrl}
                                    alt={item.foodName}
                                    className="w-8 h-8 object-cover rounded-md"
                                    draggable={false}
                                  />
                                  <AvatarFallback className="rounded-md">
                                    <IconSalad />
                                  </AvatarFallback>
                                </Avatar>
                              ) : (
                                <Avatar className="w-8 h-8">
                                  <AvatarFallback className="rounded-md">
                                    <IconSalad />
                                  </AvatarFallback>
                                </Avatar>
                              )}
                              <span>
                                {item.foodName}
                                {item.variantName
                                  ? ` (${item.variantName})`
                                  : ""}
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              {item.count}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={2} className="text-center">
                            No data available
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientPage;
