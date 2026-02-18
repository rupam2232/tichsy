"use client";

import { Button } from "@repo/ui/components/button";
import { IconBell } from "@tabler/icons-react";
import { NotificationDropdown } from "./notification-dropdown";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";

export function NotificationBell() {
  const { unreadCount } = useSelector(
    (state: RootState) => state.notifications,
  );

  return (
    <NotificationDropdown>
      <Button
        variant="ghost"
        size="icon"
        className="relative h-8 w-8 rounded-full"
      >
        <IconBell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-red-600 ring-2 ring-background" />
        )}
        <span className="sr-only">Notifications</span>
      </Button>
    </NotificationDropdown>
  );
}
