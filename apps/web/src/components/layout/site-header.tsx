"use client";
import { Separator } from "@repo/ui/components/separator";
import { SidebarTrigger } from "@repo/ui/components/sidebar";
import { useEffect, useRef, useState } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store/store";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@repo/ui/components/avatar";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select";
import axios from "@/utils/axiosInstance";
import { AxiosError } from "axios";
import { ApiResponse } from "@repo/types";
import { signOut } from "@/store/authSlice";
import { toast } from "sonner";
import { setActiveRestaurant } from "@/store/restaurantSlice";
import { NotificationBell } from "@/components/shared/notifications/notification-bell";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@repo/ui/components/tooltip";
import { Kbd } from "@repo/ui/components/kbd";
import { getOptimizedUrl } from "@/utils/imageOptimizer";

export function SiteHeader() {
  const [currentTime, setCurrentTime] = useState<null | Date>(null);
  const [isRestaurantOpen, setIsRestaurantOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const pageTitle = useRef<string>("");
  const pathname = usePathname();
  const activeRestaurant = useSelector(
    (state: RootState) => state.restaurantsSlice.activeRestaurant,
  );

  const isMobile = useIsMobile();
  const dispatch = useDispatch();
  const router = useRouter();
  const { slug } = useParams<{ slug: string }>();

  const updateTime = () => {
    const now = new Date();
    setCurrentTime(now);
  };

  useEffect(() => {
    if (isMobile) {
      return;
    }
    const intervalId = setInterval(updateTime, 1000);
    return () => clearInterval(intervalId);
  }, [isMobile]);

  useEffect(() => {
    (() => {
      if (pathname.startsWith("/restaurant/")) {
        const segment = pathname?.slice(1).split("/")[2];
        pageTitle.current = segment
          ? segment
              .split("-")
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(" ")
          : "";
      } else {
        const segment = pathname?.slice(1).split("/")[0];
        pageTitle.current = segment
          ? segment
              .split("-")
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(" ")
          : "";
      }
    })();
  }, [pathname]);

  useEffect(() => {
    setIsRestaurantOpen(activeRestaurant?.isCurrentlyOpen ?? false);
  }, [activeRestaurant?.isCurrentlyOpen]);

  const handleToggleRestaurantStatus = async () => {
    if (isLoading) {
      return;
    }
    const newStatus = !isRestaurantOpen;
    try {
      setIsLoading(true);
      setIsRestaurantOpen(newStatus);
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
      setIsRestaurantOpen(!newStatus);
      if (axiosError.response?.status === 401) {
        dispatch(signOut());
        router.push(`/signin?redirect=${pathname}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height) sticky top-0 z-11 px-1 backdrop-blur-sm bg-background/70 rounded-t-2xl">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <Tooltip>
          <TooltipTrigger asChild>
            <SidebarTrigger className="-ml-1" />
          </TooltipTrigger>
          <TooltipContent side="right">
            Toggle Sidebar{" "}
            <span className="text-[10px]">
              <Kbd className="text-[11px] font-medium">Ctrl + B</Kbd>
            </span>
          </TooltipContent>
        </Tooltip>
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4 bg-zinc-400"
        />
        {pathname.startsWith("/restaurant/") ? (
          <div className="text-base font-medium flex items-center space-x-2">
            <Avatar className="w-7 h-7">
              <AvatarImage
                src={getOptimizedUrl(
                  activeRestaurant?.logoUrl,
                  150,
                  150,
                  "r_max",
                )}
                alt={`${activeRestaurant?.restaurantName} Logo`}
                className="object-cover"
                loading="lazy"
                draggable={false}
              />
              <AvatarFallback className="text-xs font-medium">
                {activeRestaurant?.restaurantName
                  ?.split(" ")
                  .map((word) => word[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex items-center">
              <span className="hidden sm:block line-clamp-1">
                {activeRestaurant?.restaurantName}
              </span>
              {activeRestaurant?.userRole === "owner" && (
                <Separator
                  orientation="vertical"
                  className="mx-2 data-[orientation=vertical]:h-5 bg-zinc-400"
                />
              )}
            </div>
            {activeRestaurant?.userRole === "owner" && (
              <Select
                disabled={isLoading}
                value={isRestaurantOpen ? "open" : "closed"}
                defaultValue={isRestaurantOpen ? "open" : "closed"}
                onValueChange={handleToggleRestaurantStatus}
              >
                <SelectTrigger
                  size="sm"
                  className="text-sm font-medium cursor-pointer"
                >
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent align="center" position="popper">
                  <SelectItem value="open" className="cursor-pointer">
                    <span className="h-2 w-2 rounded-full bg-green-500"></span>
                    Open
                  </SelectItem>
                  <SelectItem value="closed" className="cursor-pointer">
                    <span className="h-2 w-2 rounded-full bg-red-500"></span>
                    Closed
                  </SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        ) : (
          <h3 className="text-base font-medium">{pageTitle.current}</h3>
        )}
        <div className="ml-auto flex items-center gap-2">
          <NotificationBell />
          <div className="md:flex items-center gap-2 hidden">
            {currentTime ? (
              <span className="text-sm text-gray-500">
                {`${currentTime
                  .toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                    hour12: true,
                  })
                  .toUpperCase()}`}
                {`, `}
                {`${currentTime.toLocaleDateString("en-US", {
                  weekday: "short",
                  year: "numeric",
                  month: "long",
                  day: "2-digit",
                })}`}
              </span>
            ) : (
              <span className="text-sm text-gray-500">Loading time...</span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
