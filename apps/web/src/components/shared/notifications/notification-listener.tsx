"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store/store";
import { useSocket } from "@/context/SocketContext";
import { addNotification, fetchNotifications } from "@/store/notificationSlice";
import { toast } from "sonner";
import type { Notification } from "@repo/types";
import * as orderSound from "@/utils/orderSound";
import { usePathname } from "next/navigation";

export function NotificationListener() {
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.auth.user);
  const { unreadCount } = useSelector(
    (state: RootState) => state.notifications,
  );
  const socket = useSocket();
  const pathname = usePathname();

  useEffect(() => {
    if (!user?._id) return;

    // Fetch initial notifications
    dispatch(fetchNotifications({ page: 1, limit: 10 }));

    if (!socket) return;

    const handleNewNotification = (notification: Notification) => {
      dispatch(addNotification(notification));

      if (Notification.permission === "granted") {
        new Notification(notification.title, {
          tag: "newOrder",
          body: notification.message,
          icon: notification.data?.imageUrl || "/favicon.ico",
        });
      }

      toast(notification.title, {
        description: notification.message,
      });

      // Play sound notification
      orderSound.play();
    };

    socket.on("new_notification", handleNewNotification);

    return () => {
      socket.off("new_notification", handleNewNotification);
    };
  }, [user?._id, dispatch, socket]);

  useEffect(() => {
    // Using a timeout to let Next.js metadata update the title first during navigation
    const timeoutId = setTimeout(() => {
      const currentTitle = document.title;
      // Regex to remove any existing "(number)" from start of title
      const cleanTitle = currentTitle.replace(/^\(\d+\)\s*/, "");

      if (unreadCount > 0) {
        document.title = `(${unreadCount}) ${cleanTitle}`;
      } else {
        document.title = cleanTitle;
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [unreadCount, pathname]);

  return null;
}
