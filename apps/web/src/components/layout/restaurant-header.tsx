"use client";

import { usePathname } from "next/navigation";
import { RestaurantMinimalInfo } from "@repo/types";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@repo/ui/components/avatar";
import { Badge } from "@repo/ui/components/badge";
import Link from "next/link";
import { getOptimizedUrl } from "@/utils/imageOptimizer";

export const RestaurantHeader = ({
  restaurant,
}: {
  restaurant: RestaurantMinimalInfo;
}) => {
  const pathname = usePathname();

  // Show header only on specific sub-pages
  const showHeader =
    pathname.includes("my-orders") ||
    pathname.includes("order") ||
    pathname.includes("menu") ||
    pathname.includes("cart");

  if (!showHeader) return null;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 h-[calc(var(--spacing)*16)]">
      <div className="px-4 h-16 flex items-center justify-between gap-4">
        {/* Left: Logo & Details Linked to Overview */}
        <Link
          href={`/${restaurant.slug}`}
          className="flex items-center gap-3 transition-all group"
        >
          <Avatar className="h-10 w-10 border border-border shadow-sm group-hover:shadow-md transition-shadow">
            <AvatarImage
              src={getOptimizedUrl(restaurant.logoUrl, 150, 150, "r_max")}
              alt={`${restaurant.restaurantName} Logo`}
              className="object-cover"
              draggable={false}
            />
            <AvatarFallback className="text-xs font-medium text-muted-foreground">
              {restaurant.restaurantName
                .split(" ")
                .map((word) => word[0])
                .slice(0, 2)
                .join("")
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex flex-col">
            <h1 className="text-base font-semibold leading-tight text-foreground group-hover:text-foreground/90 transition-colors">
              {restaurant.restaurantName}
            </h1>
            {restaurant.description && (
              <span className="text-xs text-muted-foreground line-clamp-1 max-w-[200px] sm:max-w-xs">
                {restaurant.description}
              </span>
            )}
          </div>
        </Link>

        {/* Right: Actions / Status */}
        <div className="flex items-center gap-2">
          <Badge
            variant={restaurant.isCurrentlyOpen ? "success" : "destructive"}
            className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider shadow-sm"
          >
            {restaurant.isCurrentlyOpen ? "Open" : "Closed"}
          </Badge>
        </div>
      </div>
    </header>
  );
};
