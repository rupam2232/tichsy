"use client";

import { useEffect, useState } from "react";
import axios from "@/utils/axiosInstance";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import { IconSalad, IconFlame } from "@tabler/icons-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select";
import { Loader2 } from "lucide-react";
import { cn } from "@repo/ui/lib/utils";
import {
  format,
  startOfDay,
  startOfWeek,
  startOfMonth,
  endOfDay,
} from "date-fns";
import type { DashboardAnalytics, ApiResponse } from "@repo/types";
import Image from "next/image";
import Link from "next/link";
import { ScrollArea, ScrollBar } from "@repo/ui/components/scroll-area";

interface TrendingItemsProps {
  slug: string;
}

export function TrendingItems({ slug }: TrendingItemsProps) {
  const [period, setPeriod] = useState<"today" | "7d" | "30d">("today");
  const [topFoodItems, setTopFoodItems] = useState<
    DashboardAnalytics["topFoodItems"]
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchTrending = async () => {
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

        const url = `/restaurant/${slug}/dashboard/analytics/trending?timezone=${userTimezone}&startDate=${format(start, "yyyy-MM-dd")}&endDate=${format(end, "yyyy-MM-dd")}`;

        const res =
          await axios.get<ApiResponse<DashboardAnalytics["topFoodItems"]>>(url);
        if (isMounted) setTopFoodItems(res.data.data || []);
      } catch (error) {
        console.error("Failed to fetch trending foods:", error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    fetchTrending();
    return () => {
      isMounted = false;
    };
  }, [slug, period]);

  return (
    <Card className="h-full flex flex-col shadow-xs border-border/60 @container/trending">
      <CardHeader className="border-b pb-4 flex flex-row items-start justify-between">
        <div>
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="p-1.5 bg-orange-500/10 rounded-full text-orange-500">
              <IconFlame className="w-5 h-5" />
            </div>
            Trending Menu
          </CardTitle>
          <CardDescription>
            Top selling items in the selected period
          </CardDescription>
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

      <CardContent className="flex-1 p-0 relative">
        {isLoading ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 backdrop-blur-sm">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : null}

        <ScrollArea className="w-full px-4 py-2">
          <div className="flex gap-2 pb-2">
            {topFoodItems.map((item, index) => (
              <Link
                key={item._id + (item.variantName ?? item.foodName)}
                href={`/restaurant/${slug}/menu?search=${item.foodName.replaceAll(" ", "+")}&tab=search`}
                className="group relative flex flex-col rounded-xl border bg-card text-card-foreground shadow-xs hover:shadow-md transition-all overflow-hidden w-[180px] aspect-[3/4]"
              >
                {/* Image Section */}
                <div className="relative aspect-[4/3] w-full bg-muted overflow-hidden">
                  {item.firstImageUrl ? (
                    <Image
                      src={item.firstImageUrl}
                      alt={item.foodName}
                      fill
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary/5">
                      <IconSalad className="w-10 h-10 text-muted-foreground" />
                    </div>
                  )}

                  {/* Rank Badge */}
                  <div className="absolute top-2 left-2 z-[9px]">
                    <span
                      className={cn(
                        "text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full shrink-0 shadow-sm",
                        index === 0
                          ? "bg-yellow-400 text-yellow-900 border border-yellow-300"
                          : index === 1
                            ? "bg-gray-200 text-gray-700 border border-gray-300"
                            : index === 2
                              ? "bg-orange-300 text-orange-900 border border-orange-200"
                              : "bg-background/90 text-foreground border border-border",
                      )}
                    >
                      {index + 1}
                    </span>
                  </div>
                </div>

                {/* Content Section */}
                <div className="flex flex-col flex-1 p-3">
                  <div className="flex justify-between items-start mb-1">
                    <span
                      className="text-sm font-semibold line-clamp-2 flex-1 pr-2"
                      title={item.foodName}
                    >
                      {item.foodName}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-auto pt-2">
                    {item.variantName ? (
                      <span className="text-[10px] font-medium text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-sm">
                        {item.variantName}
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-sm">
                        Regular
                      </span>
                    )}

                    <div className="flex items-center gap-1.5">
                      <IconFlame className="w-3.5 h-3.5" />
                      <span className="text-xs font-bold">{item.count}</span>
                      <span className="text-[10px] text-muted-foreground">
                        orders
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <ScrollBar orientation="horizontal" className="h-2 hover:h-[10px]" />
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
