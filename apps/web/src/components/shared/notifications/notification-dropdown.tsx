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
import {
  fetchNotifications,
  markAllNotificationsAsRead,
} from "@/store/notificationSlice";
import { useState, useRef, useCallback, useEffect } from "react";
import { CheckCheck, Loader2 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useRouter } from "next/navigation";

interface NotificationDropdownProps {
  children: React.ReactNode;
}

export function NotificationDropdown({ children }: NotificationDropdownProps) {
  const { notifications, unreadCount, loading, totalPages, page } = useSelector(
    (state: RootState) => state.notifications,
  );
  const dispatch = useDispatch<AppDispatch>();
  const [isOpen, setIsOpen] = useState(false);
  const observer = useRef<IntersectionObserver | null>(null);
  const isMobile = useIsMobile();
  const router = useRouter();

  useEffect(()=> {
    if (isMobile && isOpen){
      router.push("/notifications")
    }
  }, [isMobile, isOpen, router]);

  const lastElementRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0]?.isIntersecting && page < totalPages) {
          dispatch(fetchNotifications({ page: page + 1, limit: 10 }));
        }
      });

      if (node) observer.current.observe(node);
    },
    [loading, page, totalPages, dispatch],
  );

  const handleMarkAllRead = () => {
    dispatch(markAllNotificationsAsRead());
  };

  const showFullLoader = loading && notifications.length === 0;
  const showBottomLoader = loading && notifications.length > 0;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-80 md:w-96 bg-background"
        align="end"
        forceMount
      >
        <DropdownMenuLabel className="flex items-center justify-between font-normal">
          <span className="font-semibold">Notifications</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto px-0! text-xs hover:bg-transparent dark:hover:bg-transparent hover:border-b border-primary-foreground rounded-none"
              onClick={handleMarkAllRead}
            >
              <CheckCheck className="mr-1 h-3 w-3" />
              Mark all read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="h-[calc(100vh-300px)] md:h-[calc(100vh-250px)]">
          {showFullLoader ? (
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
              <div ref={lastElementRef} className="h-[1px] w-full" />
              {showBottomLoader && (
                <div className="flex items-center justify-center py-2 text-xs text-muted-foreground">
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                  Loading more...
                </div>
              )}
            </div>
          )}
        </ScrollArea>
        <DropdownMenuSeparator />
        <p className="text-center text-xs text-muted-foreground">Notifications auto delete after 15 days</p>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
