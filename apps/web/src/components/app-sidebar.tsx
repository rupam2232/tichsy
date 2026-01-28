"use client";

import * as React from "react";
import {
  IconInnerShadowTop,
  IconReceipt,
  IconSettings,
  IconTable,
  IconToolsKitchen,
  IconLayoutDashboard,
  IconChartBar,
  IconUser,
  IconHome,
} from "@tabler/icons-react";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar
} from "@repo/ui/components/sidebar";
import { useSelector } from "react-redux";
import type { RootState } from "@/store/store";
import { ScrollArea } from "@repo/ui/components/scroll-area";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useIsMobile } from "@/hooks/use-mobile";
import { X } from "lucide-react";

const data = {
  navMain: [
    {
      title: "Home",
      url: "/home",
      showInSidebar: true,
      icon: IconHome,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const user = useSelector((state: RootState) => state.auth.user);
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const { toggleSidebar } = useSidebar();

  const isRestaurantPage = pathname?.slice(1).split("/")[0] === "restaurant";

  let restaurantSlug = "";
  if (isRestaurantPage) {
    restaurantSlug = pathname?.slice(1).split("/")[1] || "";
  }

  const restaurantNavData = [
    {
      title: "Dashboard",
      url: `/restaurant/${restaurantSlug}/dashboard`,
      showInSidebar: true,
      icon: IconLayoutDashboard,
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
      title: "Owner",
      icon: IconUser,
      showInSidebar: user?.role === "owner",
      subItems: [
        {
          title: "Owner Dashboard",
          url: `/restaurant/${restaurantSlug}/owner-dashboard`,
          icon: IconChartBar,
        },
        {
          title: "Settings",
          url: `/restaurant/${restaurantSlug}/settings`,
          icon: IconSettings,
        },
      ],
    },
  ];

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center justify-between gap-2">
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5 text-sidebar-accent-foreground flex-1 hover:bg-sidebar"
            >
              <Link href="/">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">
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
            items={isRestaurantPage ? restaurantNavData : data.navMain}
          />
        </ScrollArea>
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
