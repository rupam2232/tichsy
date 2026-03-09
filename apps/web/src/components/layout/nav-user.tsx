"use client";

import {
  IconCreditCard,
  IconDotsVertical,
  IconLogout,
  IconSettings,
} from "@tabler/icons-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@repo/ui/components/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@repo/ui/components/sidebar";
import { UserState } from "@/store/authSlice";
import ToggleTheme from "@/components/shared/toggle-theme";
import Link from "next/link";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@repo/ui/components/alert-dialog";
import { Button } from "@repo/ui/components/button";
import axios from "@/utils/axiosInstance";
import { useSelector, useDispatch } from "react-redux";
import { signOut } from "@/store/authSlice";
import { RootState } from "@/store/store";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { AxiosError } from "axios";
import { ApiResponse } from "@repo/types";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@repo/ui/lib/utils";
import { getOptimizedUrl } from "@/utils/imageOptimizer";
import { useMediaQuery } from "usehooks-ts";

export function NavUser({ user }: { user: UserState["user"] }) {
  const { isMobile } = useSidebar();
  const dispatch = useDispatch();
  const userState = useSelector((state: RootState) => state.auth.status);
  const router = useRouter();
  const [isLogoutBtnLoading, setisLogoutBtnLoading] = useState(false);
  const isLargeScreen = useMediaQuery("(min-width: 1024px)");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleLogout = async () => {
    if (!userState) {
      toast.error("You are not logged in");
      return;
    }
    try {
      setisLogoutBtnLoading(true);
      const toastId = toast.loading("Logging out...");
      const response = await axios.post("/auth/signout");
      if (!response.data.success) {
        toast.error("Error logging out", { id: toastId });
        return;
      }
      dispatch(signOut());
      router.replace("/");
      toast.success("Logged out successfully", { id: toastId });
    } catch (error) {
      console.error("Error logging out:", error);
      const axiosError = error as AxiosError<ApiResponse>;
      toast.error(
        axiosError.response?.data.message ||
          "Error logging out. Please try again",
      );
    } finally {
      setisLogoutBtnLoading(false);
    }
  };

  const userInitials = user
    ? `${user.firstName?.charAt(0).toUpperCase() || ""}${user.lastName?.charAt(0).toUpperCase() || ""}`
    : "U";

  const NavUserItems = [
    { name: "Billing", href: "/billing", icon: IconCreditCard },
    {
      name: "Settings",
      href: isLargeScreen ? "/settings/profile" : "/settings",
      icon: IconSettings,
    },
  ];

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground cursor-pointer"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage
                  src={getOptimizedUrl(user?.avatar, 150, 150)}
                  alt={user?.firstName}
                  className="object-cover"
                  draggable={false}
                />
                <AvatarFallback className="rounded-lg">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium text-accent-foreground">
                  {user?.firstName ?? ""} {user?.lastName ?? ""}
                </span>
                <span className="text-muted-foreground truncate text-xs">
                  {user?.email}
                </span>
              </div>
              <IconDotsVertical className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage
                    src={getOptimizedUrl(user?.avatar, 150, 150)}
                    alt={user?.firstName}
                    className="object-cover"
                    draggable={false}
                  />
                  <AvatarFallback className="rounded-lg">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium text-accent-foreground">
                    {user?.firstName} {user?.lastName ?? ""}
                  </span>
                  <span className="text-muted-foreground truncate text-xs">
                    {user?.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-accent" />
            <div className="flex items-center justify-between px-2">
              <span className="text-sm text-accent-foreground dark:text-muted-foreground">
                Theme
              </span>
              <ToggleTheme className="border-accent" />
            </div>
            <DropdownMenuSeparator className="bg-accent" />
            <DropdownMenuGroup>
              {NavUserItems.map((item) => (
                <DropdownMenuItem
                  key={item.name}
                  onClick={() => setIsDropdownOpen(false)}
                >
                  <Link href={item.href} className="absolute inset-0" />
                  <item.icon />
                  {item.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="bg-accent" />

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  className="!text-red-600 data-[variant=destructive]:*:[svg]:!text-red-600 w-full justify-start hover:bg-destructive/20 dark:hover:bg-destructive/30 px-2 py-1.5 h-auto"
                >
                  <IconLogout />
                  Log out
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will log you out of the
                    application.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    disabled={isLogoutBtnLoading}
                    className={cn(
                      "bg-red-600 text-white hover:bg-red-500",
                      isLogoutBtnLoading && "w-21",
                    )}
                    onClick={handleLogout}
                  >
                    {isLogoutBtnLoading ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      "Log out"
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
