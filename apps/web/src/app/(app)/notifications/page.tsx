"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store/store";
import {
  fetchNotifications,
  markAllNotificationsAsRead,
} from "@/store/notificationSlice";
import { NotificationItem } from "@/components/shared/notifications/notification-item";
import { Button } from "@repo/ui/components/button";
import { IconCheck } from "@tabler/icons-react";

export default function NotificationsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { notifications, loading, unreadCount } = useSelector(
    (state: RootState) => state.notifications,
  );

  useEffect(() => {
    dispatch(fetchNotifications({ page: 1, limit: 50 }));
  }, [dispatch]);

  const handleMarkAllRead = () => {
    dispatch(markAllNotificationsAsRead());
  };

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
        </div>
        {unreadCount > 0 && (
          <Button onClick={handleMarkAllRead} variant="outline" size="sm">
            <IconCheck className="mr-2 h-4 w-4" />
            Mark all read
          </Button>
        )}
      </div>

      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        {loading ? (
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
          </div>
        )}
      </div>
    </div>
  );
}
