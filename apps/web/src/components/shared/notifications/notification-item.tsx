import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@repo/ui/components/avatar";
import { cn } from "@repo/ui/lib/utils";
import { Notification } from "@repo/types";
import { formatDistanceToNow } from "date-fns";
import {
  IconBell,
  IconShieldCheck,
  IconReceipt,
  IconDotsVertical,
  IconTrash,
  IconCreditCard,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import {
  markNotificationAsRead,
  deleteNotification,
} from "@/store/notificationSlice";
import { AppDispatch } from "@/store/store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@repo/ui/components/alert-dialog";
import { Button } from "@repo/ui/components/button";
import { useState } from "react";
import { toast } from "sonner";
import { CheckCheck } from "lucide-react";
import { getOptimizedUrl } from "@/utils/imageOptimizer";

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
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleClick = () => {
    if (!notification.read) {
      dispatch(markNotificationAsRead(notification._id));
    }

    if (notification.type === "order" && notification.data?.restaurantSlug) {
      router.push(
        `/restaurant/${notification.data.restaurantSlug}/orders?tab=new`,
      );
    } else if (
      notification.type === "security" &&
      notification.title.toLowerCase().includes("login")
    ) {
      router.push(`/settings/sessions`);
    } else if (
      notification.type === "system" &&
      notification.title.toLowerCase().includes("invitation") &&
      notification.data?.restaurantSlug
    ) {
      router.push(`/restaurant/${notification.data?.restaurantSlug}/staffs`);
    } else if (notification.type === "billing") {
      router.push(`/billing`);
    }

    if (onClick) onClick();
  };

  const handleMarkAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch(markNotificationAsRead(notification._id));
    toast.success("Notification marked as read");
  };

  const handleDelete = async () => {
    try {
      await dispatch(deleteNotification(notification._id)).unwrap();
      toast.success("Notification deleted");
    } catch {
      toast.error("Failed to delete notification");
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  const getIcon = () => {
    switch (notification.type) {
      case "order":
        return <IconReceipt className="h-5 w-5 text-orange-500" />;
      case "security":
        return <IconShieldCheck className="h-5 w-5 text-blue-500" />;
      case "system":
        return <IconBell className="h-5 w-5 text-green-500" />;
      case "billing":
        return <IconCreditCard className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />;
      default:
        return <IconBell className="h-5 w-5 text-gray-500" />;
    }
  };

  const hasImage = notification.data?.imageUrl;

  return (
    <div
      onClick={handleClick}
      className={cn(
        "flex cursor-pointer items-start gap-3 border-b p-4 transition-colors bg-background hover:bg-muted/50 group",
        !notification.read && "bg-muted",
      )}
    >
      <div className="relative">
        <Avatar className="h-10 w-10">
          <AvatarImage
            src={getOptimizedUrl(hasImage, 100, 100, "r_max")}
            alt="Notification Icon"
          />
          <AvatarFallback>{getIcon()}</AvatarFallback>
        </Avatar>

        {!notification.read && (
          <span className="absolute -left-1/2 top-1/2 h-2 w-2 translate-x-1/2 rounded-full bg-red-600 border border-background" />
        )}
      </div>
      <div className="flex-1 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              "text-sm font-medium leading-none text-foreground/80",
              !notification.read && "font-semibold text-foreground",
            )}
          >
            {notification.title}
          </p>
        </div>
        <p
          className={cn(
            "text-sm text-foreground/60",
            !notification.read && "text-foreground/80",
          )}
        >
          {notification.message}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(notification.createdAt), {
            addSuffix: true,
          })}
        </p>
      </div>

      <div onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <IconDotsVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-background">
            {!notification.read && (
              <DropdownMenuItem
                onClick={handleMarkAsRead}
                className="border-b hover:bg-muted/60 cursor-pointer"
              >
                <CheckCheck className="mr-2 h-4 w-4" />
                Mark as read
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              className="text-red-600/80 group hover:text-red-600 focus:text-red-600 hover:bg-muted/60 cursor-pointer"
              onSelect={(e) => {
                e.preventDefault();
                setIsDeleteDialogOpen(true);
              }}
            >
              <IconTrash className="mr-2 h-4 w-4 text-red-600/80 group-hover:text-red-600" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <AlertDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Notification?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This notification will be
                permanently removed from your inbox.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-red-600 text-destructive-foreground hover:bg-red-600/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
