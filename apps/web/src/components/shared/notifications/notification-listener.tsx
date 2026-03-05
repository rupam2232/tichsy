"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store/store";
import { useSocket } from "@/context/SocketContext";
import { addNotification, fetchNotifications } from "@/store/notificationSlice";
import { toast } from "sonner";
import type { Notification } from "@repo/types";
import * as notificationSound from "@/utils/notificationSound";
import { usePathname, useRouter } from "next/navigation";

export function NotificationListener() {
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.auth.user);
  const { unreadCount } = useSelector(
    (state: RootState) => state.notifications,
  );
  const socket = useSocket();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!user?._id) return;

    // Fetch initial notifications
    dispatch(fetchNotifications({ page: 1, limit: 10 }));

    if (!socket) return;

    const handleNewNotification = (notification: Notification) => {
      dispatch(addNotification(notification));

      // Play sound notification
      notificationSound.play();

      // Show in-app toast notification
      toast(notification.title, {
        description: notification.message,
      });

      // Show push notification only if the app is not actively being used
      if (
        !document.hasFocus() &&
        window.Notification?.permission === "granted" &&
        localStorage.getItem("sendPushNotification") === "true"
      ) {
        const notificationInstance = new window.Notification(
          notification.title,
          {
            tag: "newOrder",
            body: notification.message,
            icon:
              notification.data?.imageUrl.replace(
                "/upload/",
                "/upload/r_max/",
              ) || "/favicon.ico",
          },
        );

        notificationInstance.onclick = (event) => {
          event.preventDefault();
          window.focus();
          notificationInstance.close();
          router.push(`/notifications`);
        };
      }
    };

    socket.on("new_notification", handleNewNotification);

    return () => {
      socket.off("new_notification", handleNewNotification);
    };
  }, [user?._id, dispatch, socket, router]);

  useEffect(() => {
    // Using a timeout to let metadata update the title first during navigation
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
