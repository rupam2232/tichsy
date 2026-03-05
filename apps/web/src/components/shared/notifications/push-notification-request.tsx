"use client";

import { Button } from "@repo/ui/components/button";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const PushNotificationRequest = () => {
  const [askForPermission, setAskForPermission] = useState<boolean>(false);

  useEffect(() => {
    if (
      "Notification" in window &&
      Notification.permission !== "granted" &&
      localStorage.getItem("pushNotificationRequest") !== "closed"
    ) {
      setAskForPermission(true);
    }
  }, []);

  const handleClose = () => {
    setAskForPermission(false);
    localStorage.setItem("pushNotificationRequest", "closed");
  };

  const handleEnableNotifications = () => {
    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        toast.success("Notification permission granted");
        localStorage.setItem("sendPushNotification", "true");
        handleClose();
      } else {
        toast.error("Notification permission denied", {
          action: (
            <Button
              size="sm"
              className="ml-auto h-auto px-2 py-1 text-xs bg-foreground hover:bg-foreground/80 text-background"
              onClick={() => handleEnableNotifications()}
            >
              Retry
            </Button>
          ),
        });
      }
    });
  };

  if (askForPermission) {
    return (
      <div className="py-1 px-4 border-b">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-foreground">
            Allow push notifications
          </h4>
          <Button onClick={handleClose} variant="ghost" size="sm">
            <X />
            <span className="sr-only">Close</span>
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Get notified about new orders and updates
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-2"
          onClick={handleEnableNotifications}
        >
          Enable notifications
        </Button>
      </div>
    );
  }
  return null;
};

export default PushNotificationRequest;
