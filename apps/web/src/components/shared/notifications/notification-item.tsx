import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@repo/ui/components/avatar";
import { cn } from "@repo/ui/lib/utils";
import { Notification } from "@repo/types";
import { formatDistanceToNow } from "date-fns";
import { IconBell, IconShieldCheck, IconReceipt } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { markNotificationAsRead } from "@/store/notificationSlice";
import { AppDispatch } from "@/store/store";

interface NotificationItemProps {
  notification: Notification;
  onClick?: () => void;
}

export function NotificationItem({
  notification,
  onClick,
}: NotificationItemProps) {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  const handleClick = () => {
    if (!notification.read) {
      dispatch(markNotificationAsRead(notification._id));
    }

    if (notification.type === "order" && notification.data?.restaurantSlug) {
      router.push(
        `/restaurant/${notification.data.restaurantSlug}/orders?tab=new`,
      );
    }

    if (onClick) onClick();
  };

  const getIcon = () => {
    switch (notification.type) {
      case "order":
        return <IconReceipt className="h-5 w-5 text-orange-500" />;
      case "security":
        return <IconShieldCheck className="h-5 w-5 text-blue-500" />;
      case "system":
        return <IconBell className="h-5 w-5 text-gray-500" />;
      default:
        // Attempt to find an appropriate icon or default
        return <IconBell className="h-5 w-5 text-gray-500" />;
    }
  };

  // Logic to show image if available in metadata
  const hasImage = notification.data?.imageUrl;

  return (
    <div
      onClick={handleClick}
      className={cn(
        "flex cursor-pointer items-start gap-3 border-b p-4 transition-colors hover:bg-muted/50",
        !notification.read && "bg-muted/20",
      )}
    >
      <div className="relative">
        {hasImage ? (
          <Avatar className="h-10 w-10">
            <AvatarImage src={hasImage} alt="Notification Icon" />
            <AvatarFallback>{getIcon()}</AvatarFallback>
          </Avatar>
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent">
            {getIcon()}
          </div>
        )}
        {!notification.read && (
          <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-red-600 border border-background" />
        )}
      </div>
      <div className="flex-1 space-y-1">
        <p
          className={cn(
            "text-sm font-medium leading-none text-foreground",
            !notification.read && "font-semibold",
          )}
        >
          {notification.title}
          {notification.count > 1 && (
            <span className="ml-2 inline-flex items-center justify-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {notification.count}
            </span>
          )}
        </p>
        <p className="text-sm text-foreground/90 line-clamp-2">
          {notification.message}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(notification.createdAt), {
            addSuffix: true,
          })}
        </p>
      </div>
    </div>
  );
}
