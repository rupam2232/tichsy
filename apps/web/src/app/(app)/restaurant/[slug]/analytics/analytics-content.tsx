"use client";
import { useCallback, useEffect, useState } from "react";
import axios from "@/utils/axiosInstance";
import { toast } from "sonner";
import { useDispatch } from "react-redux";
import { signOut } from "@/store/authSlice";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import { Button } from "@repo/ui/components/button";
import {
  ChartNoAxesColumn,
  BookCheck,
  Loader2,
  CalendarIcon,
} from "lucide-react";
import { IconChartBar, IconReceiptOff, IconSalad } from "@tabler/icons-react";
import { cn } from "@repo/ui/lib/utils";
import { ChartAreaInteractive } from "@/components/shared/chart-area-interactive";
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
import type { DashboardAnalytics, ApiResponse } from "@repo/types";
import type { AxiosError } from "axios";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@repo/ui/components/popover";
import { Calendar } from "@repo/ui/components/calendar";
import { format } from "date-fns";

interface AnalyticsContentProps {
  slug: string;
}

export function AnalyticsContent({ slug }: AnalyticsContentProps) {
  const [analyticsData, setAnalyticsData] = useState<DashboardAnalytics | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Date State
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  const dispatch = useDispatch();
  const router = useRouter();

  const fetchAnalytics = useCallback(async () => {
    if (!slug) return;

    try {
      setIsLoading(true);
      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      let url = `/restaurant/${slug}/dashboard/analytics?timezone=${userTimezone}`;

      if (startDate) url += `&startDate=${format(startDate, "yyyy-MM-dd")}`;
      if (endDate) url += `&endDate=${format(endDate, "yyyy-MM-dd")}`;

      const analyticsRes =
        await axios.get<ApiResponse<DashboardAnalytics>>(url);
      setAnalyticsData(analyticsRes.data.data || null);
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse>;
      console.error("Failed to fetch analytics data:", error);
      toast.error(
        axiosError.response?.data.message ||
          "Failed to fetch analytics. You might not have permission locally to access this data.",
      );

      if (axiosError.response?.status === 401) {
        dispatch(signOut());
        router.push(`/signin?redirect=/restaurant/${slug}/dashboard`);
      }
    } finally {
      setIsLoading(false);
    }
  }, [slug, startDate, endDate, dispatch, router]);

  // Fetch on mount and when date changes
  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (isLoading && !analyticsData) {
    return (
      <div className="h-[50vh] flex flex-col items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p>Crunching the numbers...</p>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="h-[50vh] flex items-center justify-center text-muted-foreground bg-muted/30 rounded-lg border-2 border-dashed">
        <p>No analytics data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Date Filter Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-background/50 p-1 rounded-lg">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <IconChartBar className="w-5 h-5" /> Financial Analytics
        </h3>

        <div className="flex items-center gap-2 bg-card border rounded-md p-1 shadow-sm">
          <div className="grid gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant={"outline"}
                  size="sm"
                  className={cn(
                    "w-[140px] justify-start text-left font-normal bg-transparent border-0 h-8",
                    !startDate && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? (
                    format(startDate, "LLL dd, y")
                  ) : (
                    <span>Start Date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                />
              </PopoverContent>
            </Popover>
          </div>
          <span className="text-muted-foreground text-xs">-</span>
          <div className="grid gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant={"outline"}
                  size="sm"
                  className={cn(
                    "w-[140px] justify-start text-left font-normal bg-transparent border-0 h-8",
                    !endDate && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? (
                    format(endDate, "LLL dd, y")
                  ) : (
                    <span>End Date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                />
              </PopoverContent>
            </Popover>
          </div>

          {(startDate || endDate) && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-muted-foreground hover:text-red-500 hover:bg-red-50"
              onClick={() => {
                setStartDate(undefined);
                setEndDate(undefined);
              }}
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 *:data-[slot=card]:from-foreground/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs">
        <Card className="hover:shadow-md transition-shadow @container/card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              All Time Sales
            </CardTitle>
            <IconChartBar className="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold tracking-tight">
                ₹{analyticsData.kpis.allTimeSales.value.toFixed(2)}
              </h3>
              <p className="text-xs text-muted-foreground">
                {analyticsData.kpis.allTimeSales.description}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow @container/card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Period Sales
            </CardTitle>
            <ChartNoAxesColumn className="size-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold tracking-tight">
                ₹{analyticsData.kpis.thisMonthSales.value.toFixed(2)}
              </h3>
              <p className="text-xs text-muted-foreground">
                {analyticsData.kpis.thisMonthSales.description}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow @container/card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Period Orders
            </CardTitle>
            <BookCheck className="size-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold tracking-tight">
                {analyticsData.kpis.totalCompletedOrders.value}
              </h3>
              <p className="text-xs text-muted-foreground">
                {analyticsData.kpis.totalCompletedOrders.description}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow @container/card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Today Sales
            </CardTitle>
            <IconReceiptOff className="size-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold tracking-tight">
                ₹{analyticsData.kpis.todaySales.value.toFixed(2)}
              </h3>
              <p className="text-xs text-muted-foreground">
                {analyticsData.kpis.todaySales.description}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart and Top Items */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
        <div className="col-span-1 lg:col-span-4 h-full">
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm h-full overflow-hidden">
            <div className="p-6 pb-0">
              <h3 className="font-semibold leading-none tracking-tight">
                Sales Trend
              </h3>
              <p className="text-sm text-muted-foreground pt-1">
                Daily revenue over selected period
              </p>
            </div>
            <div className="p-6 pt-4 h-[350px]">
              <ChartAreaInteractive data={analyticsData.salesTrend} />
            </div>
          </div>
        </div>
        <div className="col-span-1 lg:col-span-3 grid grid-cols-1 gap-4">
          {/* Top Items */}
          <Card className="h-full flex flex-col shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <IconSalad className="w-5 h-5 text-green-600" />
                Top 5 Food Items
              </CardTitle>
              <CardDescription>
                By sales volume in selected period
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 p-0">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="text-left pl-6 h-9">
                      Food Name
                    </TableHead>
                    <TableHead className="text-center h-9 pr-6">Qty</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analyticsData.topFoodItems &&
                  analyticsData.topFoodItems.length > 0 ? (
                    analyticsData.topFoodItems.map((item, index) => (
                      <TableRow
                        key={item._id + (item.variantName ?? item.foodName)}
                        className=" hover:bg-muted/50"
                      >
                        <TableCell className="font-medium flex items-center gap-x-3 text-left py-3 pl-6">
                          <span
                            className={cn(
                              "text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full",
                              index === 0
                                ? "bg-yellow-100 text-yellow-700"
                                : index === 1
                                  ? "bg-gray-100 text-gray-700"
                                  : index === 2
                                    ? "bg-orange-100 text-orange-700"
                                    : "bg-primary/10 text-muted-foreground",
                            )}
                          >
                            {index + 1}
                          </span>
                          <Avatar className="w-10 h-10 rounded-lg border shadow-sm">
                            <AvatarImage
                              src={item.firstImageUrl}
                              className="object-cover"
                            />
                            <AvatarFallback className="rounded-lg bg-primary/10">
                              <IconSalad className="w-5 h-5" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium truncate max-w-[140px]">
                              {item.foodName}
                            </span>
                            {item.variantName && (
                              <span className="text-[10px] text-muted-foreground bg-secondary/50 px-1.5 py-0.5 rounded-sm w-fit">
                                {item.variantName}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center py-3 pr-6 font-semibold">
                          {item.count}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={2}
                        className="text-center text-muted-foreground py-8"
                      >
                        No sales data for this period
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
  );
}
