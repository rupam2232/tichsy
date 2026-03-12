"use client";

import * as React from "react";
import {
  IconReceipt,
  IconSettings,
  IconTable,
  IconToolsKitchen,
  IconLayoutDashboard,
  IconCreditCard,
  IconHome,
  IconChartBar,
  IconUsers,
} from "@tabler/icons-react";
import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@repo/ui/components/sidebar";
import { useSelector } from "react-redux";
import type { RootState } from "@/store/store";
import { ScrollArea } from "@repo/ui/components/scroll-area";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useIsMobile } from "@/hooks/use-mobile";
import { X } from "lucide-react";
import Image from "next/image";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const activeRestaurant = useSelector(
    (state: RootState) => state.restaurantsSlice.activeRestaurant,
  );
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const { toggleSidebar } = useSidebar();

  const isRestaurantPage = pathname?.slice(1).split("/")[0] === "restaurant";

  let restaurantSlug = "";
  if (isRestaurantPage) {
    restaurantSlug = pathname?.slice(1).split("/")[1] || "";
  }

  const mainNavItems = [
    {
      title: "Home",
      url: "/home",
      showInSidebar: true,
      icon: IconHome,
    },
    {
      title: "Billing",
      url: "/billing",
      showInSidebar: true,
      icon: IconCreditCard,
    },
    {
      title: "Settings",
      url: "/settings",
      showInSidebar: true,
      icon: IconSettings,
    },
  ];

  const restaurantNavItems = [
    {
      title: "Dashboard",
      url: `/restaurant/${restaurantSlug}/dashboard`,
      showInSidebar: true,
      icon: IconLayoutDashboard,
    },
    {
      title: "Analytics",
      url: `/restaurant/${restaurantSlug}/analytics`,
      showInSidebar: activeRestaurant?.userRole === "owner",
      icon: IconChartBar,
    },
    {
      title: "Orders",
      url: `/restaurant/${restaurantSlug}/orders`,
      showInSidebar: true,
      icon: IconReceipt,
    },
    {
      title: "Tables",
      url: `/restaurant/${restaurantSlug}/tables`,
      showInSidebar: true,
      icon: IconTable,
    },
    {
      title: "Menu",
      url: `/restaurant/${restaurantSlug}/menu`,
      showInSidebar: true,
      icon: IconToolsKitchen,
    },
    {
      title: "Staffs",
      url: `/restaurant/${restaurantSlug}/staffs`,
      showInSidebar: activeRestaurant?.userRole === "owner",
      icon: IconUsers,
    },
    {
      title: "Settings",
      url: `/restaurant/${restaurantSlug}/settings`,
      showInSidebar: activeRestaurant?.userRole === "owner",
      icon: IconSettings,
    },
  ];

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="px-0 pl-1">
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center justify-between gap-2">
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5 text-sidebar-accent-foreground flex-1 hover:bg-sidebar"
            >
              <Link href="/" className="gap-1! transition-all duration-300">
                <Image
                  loading="eager"
                  src="/white-transparent-icon.svg"
                  className="hidden dark:block"
                  alt="logo"
                  width={30}
                  height={30}
                />
                <Image
                  loading="eager"
                  src="/black-transparent-icon.svg"
                  className="block dark:hidden"
                  alt="logo"
                  width={30}
                  height={30}
                />
                <span className="text-xl font-bold">
                  {process.env.NEXT_PUBLIC_APP_NAME}
                </span>
              </Link>
            </SidebarMenuButton>
            {isMobile && (
              <SidebarMenuButton
                className="data-[slot=sidebar-menu-button]:!p-1.5 text-sidebar-accent-foreground w-min cursor-pointer"
                onClick={toggleSidebar}
              >
                <X />
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <ScrollArea className="h-full">
          <NavMain
            items={isRestaurantPage ? restaurantNavItems : mainNavItems}
          />
        </ScrollArea>
      </SidebarContent>
      <SidebarFooter className="group-data-[collapsible=icon]:p-2 px-2 md:p-0">
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
