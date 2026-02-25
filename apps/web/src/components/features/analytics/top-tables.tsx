"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import axios from "@/utils/axiosInstance";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import { IconTable } from "@tabler/icons-react";
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
  startOfDay,
  startOfWeek,
  startOfMonth,
  endOfDay,
} from "date-fns";
import type { DashboardAnalytics, ApiResponse } from "@repo/types";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@repo/ui/components/chart";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  XAxis,
  YAxis,
} from "recharts";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { signOut } from "@/store/authSlice";

interface TopTablesProps {
  slug: string;
}

const COLORS = [
  "var(--chart-4)",
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-5)",
];

export function TopTables({ slug }: TopTablesProps) {
  const [period, setPeriod] = useState<"today" | "7d" | "30d">("today");
  const [topTables, setTopTables] = useState<DashboardAnalytics["topTables"]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);
  const [hasEnteredViewport, setHasEnteredViewport] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dispatch = useDispatch();
  const router = useRouter();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setHasEnteredViewport(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 },
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!hasEnteredViewport) return;

    const fetchTopTables = async () => {
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
          ApiResponse<DashboardAnalytics["topTables"]>
        >(`/restaurant/${slug}/dashboard/analytics/top-tables`, {
          params: {
            timezone: userTimezone,
            startDate: format(start, "yyyy-MM-dd"),
            endDate: format(end, "yyyy-MM-dd"),
          },
        });
        setTopTables(res.data.data || []);
      } catch (error) {
        console.error("Failed to fetch top tables:", error);
        const axiosError = error as AxiosError<ApiResponse>;
        toast.error(
          axiosError.response?.data?.message || "Failed to fetch top tables",
        );
        if (axiosError.response?.status === 401) {
          dispatch(signOut());
          router.push(`/signin?redirect=/restaurant/${slug}/analytics`);
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchTopTables();
  }, [slug, period, hasEnteredViewport, dispatch, router]);

  const { chartData, dynamicConfig } = useMemo(() => {
    const config: ChartConfig = {};
    const dataWithFills = topTables.map((cat, index) => {
      const safeId = cat.tableName || "Uncategorized";
      const key = safeId.toLowerCase().replace(/\s+/g, "_");

      if (COLORS[index]) {
        config[key] = {
          label: safeId,
          color: COLORS[index],
        };
      } else {
        // Using golden angle approximation to generate highly distinct colors infinitely
        const hue = (index * 137.508) % 360;
        const color = `hsl(${hue}, 70%, 50%)`;
        config[key] = {
          label: safeId,
          color: color,
        };
      }

      return {
        ...cat,
        _id: safeId,
        tableId: key, // Recharts uses this via nameKey to look up config
        fill: `var(--color-${key})`,
      };
    });

    return { chartData: dataWithFills, dynamicConfig: config };
  }, [topTables]);

  return (
    <Card
      ref={containerRef}
      className="h-full flex flex-col shadow-xs border-border/70 hover:shadow-md transition-shadow"
    >
      <CardHeader className="border-b pb-4">
        <div className="flex justify-between items-center w-full gap-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="p-2 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400">
              <IconTable className="size-3.5" />
            </div>
            Top Tables
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
        <CardDescription>Most active tables by order count</CardDescription>
      </CardHeader>

      <CardContent className="flex-1 p-4 relative">
        {isLoading ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 backdrop-blur-sm">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : null}

        {topTables && topTables.length > 0 ? (
          <ChartContainer
            config={dynamicConfig}
            className="mx-auto h-full w-full max-h-[250px]"
            title="Interactive table bar chart"
          >
            <BarChart
              accessibilityLayer
              data={chartData}
              layout="vertical"
              margin={{
                right: 16,
              }}
            >
              <CartesianGrid horizontal={false} />
              <YAxis
                dataKey="tableName"
                type="category"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tickFormatter={(value) => value.slice(0, 3)}
                hide
              />
              <XAxis
                dataKey="count"
                type="number"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                hide
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="line" />}
              />
              <Bar dataKey="count" fill="var(--color-tableId)" radius={4}>
                <LabelList
                  dataKey="tableName"
                  position="insideLeft"
                  offset={8}
                  className="fill-background font-medium"
                  fontSize={12}
                />
                <LabelList
                  dataKey="count"
                  position="right"
                  offset={8}
                  className="fill-foreground font-medium"
                  fontSize={12}
                />
              </Bar>
            </BarChart>
          </ChartContainer>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-6 text-center">
            <p className="text-sm">No table data found for this period</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
