"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "@/utils/axiosInstance";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select";
import { Loader2 } from "lucide-react";
import {
  format,
  startOfWeek,
  startOfMonth,
  startOfDay,
  endOfDay,
} from "date-fns";
import type { DashboardAnalytics, ApiResponse } from "@repo/types";
import { PieChart, Pie, Sector, Cell } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@repo/ui/components/chart";
import { PieSectorDataItem } from "recharts/types/polar/Pie";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { signOut } from "@/store/authSlice";

interface TopCategoriesProps {
  slug: string;
}

const COLORS = [
  "var(--chart-2)",
  "var(--chart-1)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

export function TopCategories({ slug }: TopCategoriesProps) {
  const [period, setPeriod] = useState<"today" | "7d" | "30d">("today");
  const [categories, setCategories] = useState<
    DashboardAnalytics["categoryBreakdown"]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const dispatch = useDispatch();
  const router = useRouter();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoading(true);
        const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

        let end = new Date();
        let start = new Date();

        if (period === "today") {
          start = startOfDay(end);
          end = endOfDay(end);
        } else if (period === "7d") {
          start = startOfWeek(end, { weekStartsOn: 1 });
        } else if (period === "30d") {
          start = startOfMonth(end);
        }

        const res = await axios.get<
          ApiResponse<DashboardAnalytics["categoryBreakdown"]>
        >(`/restaurant/${slug}/dashboard/analytics/categories`, {
          params: {
            timezone: userTimezone,
            startDate: format(start, "yyyy-MM-dd"),
            endDate: format(end, "yyyy-MM-dd"),
          },
        });

        setCategories(res.data.data || []);
      } catch (error) {
        console.error("Failed to fetch category breakdown:", error);
        const axiosError = error as AxiosError<ApiResponse>;
        toast.error(
          axiosError.response?.data?.message ||
            "Failed to fetch top categories",
        );
        if (axiosError.response?.status === 401) {
          dispatch(signOut());
          router.push(`/signin?redirect=/restaurant/${slug}/analytics`);
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchCategories();
  }, [slug, period, dispatch, router]);

  // Dynamically creating the ChartConfig and inject 'fill' properties into the data
  // so the Recharts Pie can map it to Shadcn's theme variables.
  const { chartData, dynamicConfig } = useMemo(() => {
    const config: ChartConfig = {};
    const dataWithFills = categories.map((cat, index) => {
      const safeId = cat._id || "Uncategorized";
      // Creating a safe key for CSS vars, e.g., 'Indian', 'Fast Food' -> 'fast_food'
      const key = safeId.toLowerCase().replace(/\s+/g, "_");

      if (COLORS[index]) {
        config[key] = {
          label: safeId,
          color: COLORS[index],
          prefix: "₹",
        };
      } else {
        // Using golden angle approximation to generate highly distinct colors infinitely
        const hue = (index * 137.508) % 360;
        const color = `hsl(${hue}, 70%, 50%)`;
        config[key] = {
          label: safeId,
          color: color,
          prefix: "₹",
        };
      }

      return {
        ...cat,
        _id: safeId,
        categoryId: key, // Recharts uses this via nameKey to look up config
        fill: `var(--color-${key})`,
      };
    });

    return { chartData: dataWithFills, dynamicConfig: config };
  }, [categories]);

  return (
    <Card className="h-full flex flex-col shadow-xs border-border/70 hover:shadow-md transition-shadow">
      <CardHeader className="border-b pb-4!">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">
            <h3>Top Categories</h3>
          </CardTitle>

          <Select
            value={period}
            onValueChange={(value: "today" | "7d" | "30d") => setPeriod(value)}
          >
            <SelectTrigger
              className="w-[120px] h-8 text-xs border-border bg-muted/70 hover:bg-muted/80 cursor-pointer"
              size="sm"
            >
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today" className="cursor-pointer">
                Today
              </SelectItem>
              <SelectItem value="7d" className="cursor-pointer">
                This Week
              </SelectItem>
              <SelectItem value="30d" className="cursor-pointer">
                This Month
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <CardDescription>
          <p className="text-sm text-muted-foreground">
            View the top categories based on revenue.
          </p>
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 p-0 relative min-h-[300px]">
        {isLoading ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 backdrop-blur-sm">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : null}

        {categories && categories.length > 0 ? (
          <div className="h-full w-full p-4 pb-0 flex flex-col items-center justify-center">
            <ChartContainer
              config={dynamicConfig}
              className="mx-auto aspect-square h-full w-full max-w-[300px] lg:max-w-[400px]"
              title="Interactive category pie chart"
            >
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent />}
                />
                <Pie
                  data={chartData}
                  dataKey="totalRevenue"
                  nameKey="categoryId"
                  innerRadius={60}
                  strokeWidth={5}
                  activeShape={({
                    outerRadius = 0,
                    ...props
                  }: PieSectorDataItem) => (
                    <Sector {...props} outerRadius={outerRadius + 10} />
                  )}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.fill}
                      className="cursor-pointer"
                    />
                  ))}
                </Pie>
                <ChartLegend
                  className="flex-wrap pb-0!"
                  content={<ChartLegendContent nameKey="categoryId" />}
                />
              </PieChart>
            </ChartContainer>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-6 text-center">
            <p className="text-sm">No category data found for this period</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
