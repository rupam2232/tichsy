"use client";

import { useEffect, useState, useMemo, useId } from "react";
import axios from "@/utils/axiosInstance";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@repo/ui/components/chart";
import { ScrollArea, ScrollBar } from "@repo/ui/components/scroll-area";
import { Button } from "@repo/ui/components/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@repo/ui/components/popover";
import { Calendar, type DateRange } from "@repo/ui/components/calendar";
import {
  BarChart3,
  TrendingUp,
  Loader2,
  CalendarIcon,
  Download,
} from "lucide-react";
import { exportToCsv } from "@/utils/exportCsv";
import { cn } from "@repo/ui/lib/utils";
import {
  format,
  startOfDay,
  endOfDay,
  subDays,
  differenceInDays,
} from "date-fns";
import type { DashboardAnalytics, ApiResponse } from "@repo/types";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { signOut } from "@/store/authSlice";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@repo/ui/components/tooltip";
import { AnimatedNumber } from "@/components/shared/animated-odometer";

const chartConfig = {
  total: {
    label: "Sales",
    color: "var(--chart-1)",
    prefix: "₹",
  },
  orders: {
    label: "Orders",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

interface RevenueChartProps {
  slug: string;
}

export function RevenueChart({ slug }: RevenueChartProps) {
  const [chartType, setChartType] = useState<"area" | "bar">("bar");
  const [period, setPeriod] = useState<
    "today" | "last7d" | "last30d" | "custom"
  >("today");
  const [date, setDate] = useState<DateRange | undefined>();
  const [salesTrend, setSalesTrend] = useState<
    DashboardAnalytics["salesTrend"]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeZone, setTimeZone] = useState<string | undefined>(undefined);
  const dispatch = useDispatch();
  const router = useRouter();

  useEffect(() => {
    const fetchRevenue = async () => {
      try {
        setIsLoading(true);
        const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        setTimeZone(userTimezone);

        const now = new Date();
        let start = new Date();
        let end = new Date();
        let groupBy = "day";

        if (period === "today") {
          start = startOfDay(now);
          end = endOfDay(now);
          groupBy = "hour";
        } else if (period === "last7d") {
          // Last 7 days, excluding today
          end = endOfDay(subDays(now, 1));
          start = startOfDay(subDays(now, 7));
          groupBy = "day";
        } else if (period === "last30d") {
          // Last 30 days, excluding today
          end = endOfDay(subDays(now, 1));
          start = startOfDay(subDays(now, 30));
          groupBy = "week-sliding";
        } else if (period === "custom") {
          if (!date?.from) return; // Wait for valid selection
          start = startOfDay(date.from);
          end = date.to ? endOfDay(date.to) : endOfDay(date.from);

          const diffInDays = differenceInDays(end, start) + 1;
          if (diffInDays >= 60) {
            groupBy = "month-sliding";
          } else if (diffInDays >= 14) {
            groupBy = "week-sliding";
          } else if (diffInDays > 1) {
            groupBy = "day";
          } else {
            groupBy = "hour";
          }
        }

        const res = await axios.get<
          ApiResponse<DashboardAnalytics["salesTrend"]>
        >(`/restaurant/${slug}/dashboard/analytics/revenue`, {
          params: {
            timezone: userTimezone,
            startDate: format(start, "yyyy-MM-dd'T'HH:mm:ss"),
            endDate: format(end, "yyyy-MM-dd'T'HH:mm:ss"),
            groupBy,
          },
        });
        setSalesTrend(res.data.data || []);
      } catch (error) {
        console.error("Failed to fetch revenue trend:", error);
        const axiosError = error as AxiosError<ApiResponse>;
        toast.error(
          axiosError.response?.data?.message || "Failed to fetch revenue trend",
        );
        if (axiosError.response?.status === 401) {
          dispatch(signOut());
          router.push(`/signin?redirect=/restaurant/${slug}/analytics`);
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchRevenue();
  }, [slug, period, date, dispatch, router]);

  // Calculate total revenue from the filtered trend data
  const totalRevenue = useMemo(() => {
    return salesTrend?.reduce((acc, curr) => acc + (curr.total || 0), 0) || 0;
  }, [salesTrend]);

  const handleExport = () => {
    if (!salesTrend || salesTrend.length === 0) return;

    const exportData = salesTrend.map((item) => {
      let dateString = item._id;
      if (item._id.includes(":")) {
        // e.g. "2024-02-28 14:00" -> "Feb 28, 2024 02:00 PM - 02:59 PM"
        const d = new Date(item._id);
        const dEnd = new Date(d);
        dEnd.setHours(d.getHours(), 59);
        dateString = `${format(d, "MMM dd, yyyy, hh:mm a")} - ${format(dEnd, "hh:mm a")}`;
      } else if (item._id.includes(" - ")) {
        // Date range
        const [start, end] = item._id.split(" - ");
        if (start && end) {
          dateString = `${format(new Date(start), "MMM dd, yyyy")} - ${format(new Date(end), "MMM dd, yyyy")}`;
        }
      } else {
        // Single day: "2024-02-28" -> "Feb 28, 2024"
        dateString = format(new Date(item._id), "MMM dd, yyyy");
      }

      return {
        "Date/Time": dateString,
        "Total Sales (₹)": item.total,
        Orders: item.orders,
      };
    });

    exportToCsv(
      exportData,
      `revenue-${period}${period === "custom" ? "-" + format(date?.from ?? new Date(), "yyyyMMdd") + "-" + format(date?.to ?? new Date(), "yyyyMMdd") : ""}.csv`,
    );
  };

  // Ensure data exists and calculate required min-width
  // 45px per bar gives enough breathing room so bars never get too thin.
  const chartMinWidth =
    salesTrend && salesTrend.length > 0 ? salesTrend.length * 45 : 0;

  const chartId = useId();
  const fillTotalId = `fillTotal-${chartId}`;
  const fillOrdersId = `fillOrders-${chartId}`;

  return (
    <Card className=" h-full flex flex-col shadow-xs border-border/70 hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-col md:flex-row items-start justify-between gap-4 border-b pb-4">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg">
            Revenue Trend
          </CardTitle>
          <CardDescription>
            Total sales of selected period:{" "}
            <span className="font-bold text-foreground">
              <AnimatedNumber value={totalRevenue} decimals={2} prefix="₹" />
            </span>
          </CardDescription>
        </div>

        <div className="flex flex-col gap-2 w-full md:w-auto">
          <div className="flex justify-between items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleExport}
                  disabled={!salesTrend || salesTrend.length === 0}
                  className="bg-muted/70 hover:bg-muted/80 border"
                >
                  <Download />
                  <span className="sr-only">Export</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Export revenue trend to CSV</TooltipContent>
            </Tooltip>
            <Select
              value={period}
              onValueChange={(
                value: "today" | "last7d" | "last30d" | "custom",
              ) => setPeriod(value)}
            >
              <SelectTrigger
                className="w-[140px] h-8 text-xs border-border bg-muted/70 hover:bg-muted/80 cursor-pointer"
                size="sm"
              >
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today" className="cursor-pointer">
                  Today
                </SelectItem>
                <SelectItem value="last7d" className="cursor-pointer">
                  Last 7 Days
                </SelectItem>
                <SelectItem value="last30d" className="cursor-pointer">
                  Last 30 Days
                </SelectItem>
                <SelectItem value="custom" className="cursor-pointer">
                  Custom Range
                </SelectItem>
              </SelectContent>
            </Select>
            {/* Chart Type Toggle */}
            <div className="flex items-center bg-muted/50 p-1 rounded-lg border">
              <Button
                variant="ghost"
                onClick={() => setChartType("bar")}
                className={cn(
                  "h-7 px-3 rounded-md transition-all gap-2",
                  chartType === "bar"
                    ? "bg-foreground shadow-sm text-background hover:bg-foreground/90 dark:hover:bg-foreground/90 hover:text-background"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <BarChart3 className="size-4" />
                <span className="hidden sm:inline">Bar</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setChartType("area")}
                className={cn(
                  "h-7 px-3 rounded-md transition-all gap-2",
                  chartType === "area"
                    ? "bg-foreground shadow-sm text-background hover:bg-foreground/90 dark:hover:bg-foreground/90 hover:text-background"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <TrendingUp className="size-4" />
                <span className="hidden sm:inline">Line</span>
              </Button>
            </div>
          </div>
          {/* Custom Date Picker (Show only if period is custom) */}
          {period === "custom" && (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date-picker-range"
                  variant="ghost"
                  className={cn(
                    "w-[260px] justify-start text-left font-normal h-8 text-xs bg-muted/70 hover:bg-muted/80 border",
                    !date && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                  {date?.from ? (
                    date.to ? (
                      <>
                        {format(date.from, "LLL dd, y")} -{" "}
                        {format(date.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(date.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date or a range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="range"
                  defaultMonth={date?.from}
                  selected={date}
                  onSelect={setDate}
                  numberOfMonths={2}
                  timeZone={timeZone}
                  disabled={(date) =>
                    date > new Date() ||
                    date < startOfDay(subDays(new Date(), 365))
                  }
                  className="text-muted-foreground"
                />
              </PopoverContent>
            </Popover>
          )}
        </div>
      </CardHeader>

      <CardContent
        className={cn(
          "flex-1 p-0 relative", // Remove sm:p-2 pt-4, moving it to internal layout
          !isLoading && "flex flex-col",
        )}
      >
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 backdrop-blur-sm">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        )}

        <div className="relative flex-1 w-full overflow-hidden">
          {/* Sticky Y-Axis Overlay */}
          {!isLoading && salesTrend && salesTrend.length > 0 && (
            <div className="absolute left-0 top-0 bottom-0 w-16 z-10 pt-4 pointer-events-none bg-card rounded-l-lg">
              <ChartContainer
                config={chartConfig}
                className="w-full h-[270px] sm:h-[320px]"
              >
                {chartType === "bar" ? (
                  <BarChart data={salesTrend}>
                    <YAxis
                      dataKey="total"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tickFormatter={(value) => `₹${value.toFixed(0)}`}
                      className="text-xs"
                    />
                  </BarChart>
                ) : (
                  <AreaChart data={salesTrend}>
                    <YAxis
                      dataKey="total"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tickFormatter={(value) => `₹${value.toFixed(0)}`}
                      className="text-xs"
                    />
                  </AreaChart>
                )}
              </ChartContainer>
            </div>
          )}

          <ScrollArea className="w-full h-full pt-4 pr-5">
            <div
              style={{ minWidth: `${Math.max(chartMinWidth, 500)}px` }}
              className="h-[270px] sm:h-[320px] w-full pl-16"
            >
              <ChartContainer config={chartConfig} className="w-full h-full">
                {chartType === "bar" ? (
                  <BarChart accessibilityLayer data={salesTrend}>
                    <defs>
                      <linearGradient
                        id={fillTotalId}
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="var(--color-total)"
                          stopOpacity={1.0}
                        />
                        <stop
                          offset="95%"
                          stopColor="var(--color-total)"
                          stopOpacity={0.4}
                        />
                      </linearGradient>
                      <linearGradient
                        id={fillOrdersId}
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="var(--color-orders)"
                          stopOpacity={0.8}
                        />
                        <stop
                          offset="95%"
                          stopColor="var(--color-orders)"
                          stopOpacity={0.1}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="_id"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tickFormatter={(value) => {
                        if (value.includes(":")) {
                          return format(new Date(value), "h:mm a");
                        }
                        if (value.includes(" - ")) {
                          const [start, end] = value.split(" - ");
                          if (start && end) {
                            const d1 = new Date(start);
                            const d2 = new Date(end);
                            if (d1.getFullYear() !== d2.getFullYear()) {
                              return `${format(d1, "MMM dd, yy")} - ${format(d2, "MMM dd, yy")}`;
                            }
                            return `${format(d1, "MMM dd")} - ${format(d2, "MMM dd")}`;
                          }
                        }
                        return new Date(value).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        });
                      }}
                    />
                    <YAxis dataKey="total" hide />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          labelFormatter={(value) => {
                            if (value.includes(":")) {
                              const d = new Date(value);
                              const dEnd = new Date(d);
                              dEnd.setHours(d.getHours(), 59);
                              return `${format(d, "MMM dd, yy, hh:mm a")} - ${format(dEnd, "hh:mm a")}`;
                            }
                            if (value.includes(" - ")) {
                              const [start, end] = value.split(" - ");
                              if (start && end) {
                                return `${format(new Date(start), "MMM dd, yyyy")} - ${format(new Date(end), "MMM dd, yyyy")}`;
                              }
                            }
                            return new Date(value).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            });
                          }}
                          indicator="dot"
                          color="var(--chart-1)"
                          hideIndicator
                        />
                      }
                    />
                    <Bar
                      dataKey="total"
                      radius={4}
                      fill={`url(#${fillTotalId})`}
                      stackId="a"
                    />
                    <Bar
                      dataKey="orders"
                      barSize={0}
                      radius={4}
                      fill={`url(#${fillOrdersId})`}
                      stackId="a"
                      className="hidden"
                    />
                  </BarChart>
                ) : (
                  <AreaChart accessibilityLayer data={salesTrend}>
                    <defs>
                      <linearGradient
                        id={fillTotalId}
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="var(--color-total)"
                          stopOpacity={1.0}
                        />
                        <stop
                          offset="95%"
                          stopColor="var(--color-total)"
                          stopOpacity={0.4}
                        />
                      </linearGradient>
                      <linearGradient
                        id={fillOrdersId}
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="var(--color-orders)"
                          stopOpacity={0.8}
                        />
                        <stop
                          offset="95%"
                          stopColor="var(--color-orders)"
                          stopOpacity={0.1}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="_id"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tickFormatter={(value) => {
                        if (value.includes(":")) {
                          return format(new Date(value), "h:mm a");
                        }
                        if (value.includes(" - ")) {
                          const [start, end] = value.split(" - ");
                          if (start && end) {
                            const d1 = new Date(start);
                            const d2 = new Date(end);
                            if (d1.getFullYear() !== d2.getFullYear()) {
                              return `${format(d1, "MMM dd, yy")} - ${format(d2, "MMM dd, yy")}`;
                            }
                            return `${format(d1, "MMM dd")} - ${format(d2, "MMM dd")}`;
                          }
                        }
                        return new Date(value).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        });
                      }}
                    />
                    <YAxis dataKey="total" hide />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          labelFormatter={(value) => {
                            if (value.includes(":")) {
                              const d = new Date(value);
                              const dEnd = new Date(d);
                              dEnd.setHours(d.getHours(), 59);
                              return `${format(d, "MMM dd, yy hh:mm a")} - ${format(dEnd, "hh:mm a")}`;
                            }
                            if (value.includes(" - ")) {
                              const [start, end] = value.split(" - ");
                              if (start && end) {
                                return `${format(new Date(start), "MMM dd, yyyy")} - ${format(new Date(end), "MMM dd, yyyy")}`;
                              }
                            }
                            return new Date(value).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            });
                          }}
                          indicator="dot"
                          color="var(--chart-1)"
                          hideIndicator
                        />
                      }
                    />
                    <Area
                      dataKey="total"
                      type="monotone"
                      fill={`url(#${fillTotalId})`}
                      stroke="var(--color-total)"
                      strokeWidth={2}
                      stackId="a"
                    />
                    <Area
                      dataKey="orders"
                      type="monotone"
                      fill={`url(#${fillTotalId})`}
                      stroke="var(--color-total)"
                      stackId="a"
                      className="hidden"
                    />
                  </AreaChart>
                )}
              </ChartContainer>
            </div>
            <ScrollBar
              orientation="horizontal"
              className="z-12 h-2 hover:h-[10px]"
            />
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}
