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

  useEffect(() => {
    let isMounted = true;
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

        const url = `/restaurant/${slug}/dashboard/analytics/top-tables?timezone=${userTimezone}&startDate=${format(start, "yyyy-MM-dd")}&endDate=${format(end, "yyyy-MM-dd")}`;

        const res =
          await axios.get<ApiResponse<DashboardAnalytics["topTables"]>>(url);
        if (isMounted) setTopTables(res.data.data || []);
      } catch (error) {
        console.error("Failed to fetch top tables:", error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    fetchTopTables();
    return () => {
      isMounted = false;
    };
  }, [slug, period]);

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
    <Card className="h-full flex flex-col shadow-xs border-border/60">
      <CardHeader className="border-b pb-4 flex flex-row items-start justify-between">
        <div>
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="p-1.5 bg-blue-500/10 rounded-full text-blue-500">
              <IconTable className="w-5 h-5" />
            </div>
            Top Tables
          </CardTitle>
          <CardDescription>Most active tables by order count</CardDescription>
        </div>

        <Select
          value={period}
          onValueChange={(value: "today" | "7d" | "30d") => setPeriod(value)}
        >
          <SelectTrigger className="w-[120px] h-8 text-xs bg-muted/50 border-transparent hover:bg-muted/80 cursor-pointer">
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
      </CardHeader>

      <CardContent className="flex-1 p-4 relative">
        {isLoading ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 backdrop-blur-sm">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : null}

        <ChartContainer config={dynamicConfig} className="mx-auto h-full w-full max-h-[250px]">
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
      </CardContent>
    </Card>
  );
}
