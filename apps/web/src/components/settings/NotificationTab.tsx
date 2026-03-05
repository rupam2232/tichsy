"use client";
import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import { Switch } from "@repo/ui/components/switch";
import { toast } from "sonner";
import { Button } from "@repo/ui/components/button";

const NotificationTab = () => {
  const [disableSwitch, setDisableSwitch] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [permission, setPermission] = useState<boolean>(false);

  useEffect(() => {
    if (!("Notification" in window)) {
      setError("Notifications are not supported in your browser");
      setDisableSwitch(true);
      setPermission(false);
      return;
    }
    if (Notification.permission === "default") {
      setDisableSwitch(false);
      setPermission(false);
    }
    if (Notification.permission === "denied") {
      setPermission(false);
      setDisableSwitch(true);
      setError(
        "Notification permission denied. To get notifications, please give permission from your browser settings",
      );
    }
    if (Notification.permission === "granted") {
      if (localStorage.getItem("sendPushNotification") === "true") {
        setPermission(true);
        setDisableSwitch(false);
      } else {
        setPermission(false);
        setDisableSwitch(false);
      }
    }
  }, []);

  const handleSwitch = (checked: boolean) => {
    if (disableSwitch) return;
    if (checked) {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          toast.success("Notification permission granted");
          setPermission(true);
          localStorage.setItem("sendPushNotification", "true");
        } else {
          toast.error("Notification permission denied", {
            action: (
              <Button
                size="sm"
                className="ml-auto h-auto px-2 py-1 text-xs bg-foreground hover:bg-foreground/80 text-background"
                onClick={() => handleSwitch(checked)}
              >
                Retry
              </Button>
            ),
          });
          setPermission(false);
          localStorage.setItem("sendPushNotification", "false");
        }
      });
    } else {
      localStorage.setItem("sendPushNotification", "false");
      setPermission(false);
      toast.success("Notification permission revoked");
    }
  };

  return (
    <Card className="animate-in fade-in slide-in-from-top-4 duration-500">
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-foreground">
                Push Notifications
              </h4>
              <p className="text-xs text-muted-foreground">
                Get notified about new orders and updates
              </p>
              {error && <p className="text-xs text-destructive">{error}</p>}
            </div>
            <Switch
              checked={permission}
              onCheckedChange={handleSwitch}
              disabled={disableSwitch}
              className="cursor-pointer"
              aria-label="Enable push notifications"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationTab;
