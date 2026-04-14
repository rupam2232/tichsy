"use client";

import { useEffect, useRef, useState, useCallback } from "react";
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
  const isRazorpayOpen = useSelector((state: RootState) => state.subscription.isRazorpayOpen);
  const isRazorpayOpenRef = useRef(isRazorpayOpen);
  const socket = useSocket();
  const pathname = usePathname();
  const router = useRouter();

  const [queuedNotifications, setQueuedNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    isRazorpayOpenRef.current = isRazorpayOpen;
  }, [isRazorpayOpen]);

  const triggerSideEffects = useCallback((notification: Notification) => {
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
          tag: notification.type,
          body: notification.message,
          icon:
            notification.data?.imageUrl?.replace(
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
  }, [router]);

  useEffect(() => {
    if (!user?._id) return;

    // Fetch initial notifications
    dispatch(fetchNotifications({ page: 1, limit: 10 }));

    if (!socket) return;

    const handleNewNotification = (notification: Notification) => {
      dispatch(addNotification(notification));

      // For billing notifications, wait for Razorpay's overlay to close
      // before playing sound/toast since the webhook fires before Razorpay dismisses
      if (notification.type === "billing" && isRazorpayOpenRef.current) {
        setQueuedNotifications((prev) => [...prev, notification]);
        return;
      }

      triggerSideEffects(notification);
    };

    socket.on("new_notification", handleNewNotification);

    return () => {
      socket.off("new_notification", handleNewNotification);
    };
  }, [user?._id, dispatch, socket, triggerSideEffects]);

  // Process queued notifications as soon as Razorpay closes
  useEffect(() => {
    if (!isRazorpayOpen && queuedNotifications.length > 0) {
      queuedNotifications.forEach((notification) => {
        triggerSideEffects(notification);
      });
      setQueuedNotifications([]);
    }
  }, [isRazorpayOpen, queuedNotifications, triggerSideEffects]);

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
