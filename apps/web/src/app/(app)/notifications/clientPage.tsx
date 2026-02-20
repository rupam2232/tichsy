"use client";

import { useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store/store";
import {
  fetchNotifications,
  markAllNotificationsAsRead,
} from "@/store/notificationSlice";
import { NotificationItem } from "@/components/shared/notifications/notification-item";
import { Button } from "@repo/ui/components/button";
import { CheckCheck, Loader2 } from "lucide-react";

export default function NotificationsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { notifications, loading, unreadCount, totalPages, page } = useSelector(
    (state: RootState) => state.notifications,
  );
  const observer = useRef<IntersectionObserver | null>(null);

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
    <div className="mx-auto max-w-2xl p-4 md:p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Notifications
          </h1>
          <p className="text-sm text-muted-foreground">
            View and manage your notifications
          </p>
          <p className="text-xs text-muted-foreground">
            Notifications auto delete after 15 days
          </p>
        </div>
        {unreadCount > 0 && (
          <Button onClick={handleMarkAllRead} variant="ghost" size="sm">
            <CheckCheck />
            Mark all read
          </Button>
        )}
      </div>

      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        {showFullLoader ? (
          <div className="flex h-32 items-center justify-center text-muted-foreground">
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-muted-foreground">
            No notifications found
          </div>
        ) : (
          <div className="divide-y">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification._id}
                notification={notification}
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
      </div>
    </div>
  );
}
