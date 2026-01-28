"use client";

import {
  IconCreditCard,
  IconDotsVertical,
  IconLogout,
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
import ToggleTheme from "./toggle-Theme";
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
import { ApiResponse } from "@repo/ui/types/ApiResponse";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@repo/ui/lib/utils";

export function NavUser({ user }: { user: UserState["user"] }) {
  const { isMobile } = useSidebar();
  const dispatch = useDispatch();
  const userState = useSelector((state: RootState) => state.auth.status);
  const router = useRouter();
  const [isLogoutBtnLoading, setisLogoutBtnLoading] = useState(false);

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
          "Error logging out. Please try again"
      );
    } finally {
      setisLogoutBtnLoading(false);
    }
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage
                  src={user?.avatar}
                  alt={user?.firstName}
                  draggable={false}
                />
                <AvatarFallback className="rounded-lg">{`${user?.firstName ? user?.firstName[0]?.toUpperCase() : ""}${user?.lastName ? user.lastName[0]?.toUpperCase() : ""}`}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">
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
                    src={user?.avatar}
                    alt={user?.firstName}
                    draggable={false}
                  />
                  <AvatarFallback className="rounded-lg">{`${user?.firstName ? user?.firstName[0]?.toUpperCase() : ""}${user?.lastName ? user?.lastName[0]?.toUpperCase() : ""}`}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">
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
              <DropdownMenuItem>
                <Link href="/billing" className="absolute inset-0" />
                <IconCreditCard />
                Billing
              </DropdownMenuItem>
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
                      isLogoutBtnLoading && "w-21"
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
