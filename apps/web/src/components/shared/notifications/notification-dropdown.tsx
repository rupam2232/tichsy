import { Button } from "@repo/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import { ScrollArea } from "@repo/ui/components/scroll-area";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/store/store";
import { NotificationItem } from "./notification-item";
import { markAllNotificationsAsRead } from "@/store/notificationSlice";
import Link from "next/link";
import { IconCheck } from "@tabler/icons-react";
import { useState } from "react";

interface NotificationDropdownProps {
  children: React.ReactNode;
}

export function NotificationDropdown({ children }: NotificationDropdownProps) {
  const { notifications, unreadCount, loading } = useSelector(
    (state: RootState) => state.notifications,
  );
  const dispatch = useDispatch<AppDispatch>();
  const [isOpen, setIsOpen] = useState(false);

  const handleMarkAllRead = () => {
    dispatch(markAllNotificationsAsRead());
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 md:w-96" align="end" forceMount>
        <DropdownMenuLabel className="flex items-center justify-between font-normal">
          <span className="font-semibold">Notifications</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto px-2 text-xs"
              onClick={handleMarkAllRead}
            >
              <IconCheck className="mr-1 h-3 w-3" />
              Mark all read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="h-[calc(100vh-300px)] md:h-[400px]">
          {loading ? (
            <div className="flex h-20 items-center justify-center text-sm text-muted-foreground">
              Loading...
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex h-20 items-center justify-center text-sm text-muted-foreground">
              No notifications
            </div>
          ) : (
            <div className="grid">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification._id}
                  notification={notification}
                  onClick={() => setIsOpen(false)}
                />
              ))}
            </div>
          )}
        </ScrollArea>
        <DropdownMenuSeparator />
        <Link
          href="/notifications"
          className="flex w-full items-center justify-center p-2 text-sm font-medium hover:underline"
          onClick={() => setIsOpen(false)}
        >
          View all notifications
        </Link>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
