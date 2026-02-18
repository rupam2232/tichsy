"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store/store";
import { useSocket } from "@/context/SocketContext";
import { addNotification, fetchNotifications } from "@/store/notificationSlice";
import { toast } from "sonner";
import { Notification } from "@repo/types";

export function NotificationListener() {
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.auth.user);
  const socket = useSocket();

  useEffect(() => {
    if (!user?._id) return;

    // Fetch initial notifications
    dispatch(fetchNotifications({ page: 1, limit: 20 }));

    if (!socket) return;


    const handleNewNotification = (notification: Notification) => {
      dispatch(addNotification(notification));

      toast(notification.title, {
        description: notification.message,
        action: {
          label: "View",
          onClick: () => {
            // Logic to navigate logic is duplicated here, ideally use a helper or just rely on global store/router
          },
        },
      });
    };

    socket.on("new_notification", handleNewNotification);

    return () => {
      socket.off("new_notification", handleNewNotification);
    };
  }, [user?._id, dispatch, socket]);

  return null;
}
