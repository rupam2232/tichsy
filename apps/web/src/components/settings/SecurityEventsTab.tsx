"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import axios from "@/utils/axiosInstance";
import { toast } from "sonner";
import { Loader2, History, AlertCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import {
  SecurityEventData,
  SecurityEventsResponse,
  ApiResponse,
} from "@repo/types";
import { format } from "date-fns";
import { Badge } from "@repo/ui/components/badge";
import { useDispatch } from "react-redux";
import { signOut } from "@/store/authSlice";
import { usePathname, useRouter } from "next/navigation";
import { AxiosError } from "axios";
import { Skeleton } from "@repo/ui/components/skeleton";

export default function SecurityEventsTab() {
  const [events, setEvents] = useState<SecurityEventData[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingNextPage, setIsFetchingNextPage] = useState(false);
  const isFetchingRef = useRef(false);
  const observer = useRef<IntersectionObserver>(null);
  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname();

  const fetchEvents = useCallback(
    async (pageNumber: number) => {
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;

      if (pageNumber === 1) setIsLoading(true);
      else setIsFetchingNextPage(true);

      try {
        const response = await axios.get(
          `/user/security-events?page=${pageNumber}&limit=10`,
        );
        const payload: SecurityEventsResponse = response.data.data;

        if (pageNumber === 1) {
          setEvents(payload.events);
        } else {
          setEvents((prev) => {
            const newEvents = payload.events.filter(
              (newEvent) => !prev.some((e) => e._id === newEvent._id),
            );
            return [...prev, ...newEvents];
          });
        }
        setTotalPages(payload.totalPages);
      } catch (error) {
        console.error("Failed to load security events:", error);
        const axiosError = error as AxiosError<ApiResponse>;
        toast.error(
          axiosError.response?.data.message || "Failed to load security events",
        );
        if (axiosError.response?.status === 401) {
          dispatch(signOut());
          router.push(`/signin?redirect=${pathname}`);
        }
      } finally {
        setIsLoading(false);
        setIsFetchingNextPage(false);
        isFetchingRef.current = false;
      }
    },
    [dispatch, pathname, router],
  );

  useEffect(() => {
    fetchEvents(1);
  }, [fetchEvents]);

  const lastElementRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isLoading || isFetchingNextPage) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0] && entries[0].isIntersecting && page < totalPages) {
          if (isFetchingRef.current) return;
          const nextPage = page + 1;
          setPage(nextPage);
          fetchEvents(nextPage);
        }
      });
      if (node) observer.current.observe(node);
    },
    [isLoading, isFetchingNextPage, page, totalPages, fetchEvents],
  );

  const getEventTitle = (type: string) => {
    switch (type) {
      case "new_login":
        return "New Login";
      case "password_change":
        return "Password Changed";
      case "email_change":
        return "Email Address Changed";
      case "signup":
        return "Account Created";
      default:
        return type.replace("_", " ");
    }
  };

  const getEventBadge = (type: string) => {
    switch (type) {
      case "new_login":
        return <Badge variant="secondary">Login</Badge>;
      case "password_change":
        return <Badge variant="destructive">Security Update</Badge>;
      case "email_change":
        return <Badge variant="destructive">Security Update</Badge>;
      case "signup":
        return <Badge variant="outline">Onboarding</Badge>;
      default:
        return <Badge variant="secondary">Info</Badge>;
    }
  };

  return (
    <Card className="animate-in fade-in slide-in-from-top-4 duration-500">
      <CardHeader>
        <CardTitle>Security Logs</CardTitle>
        <CardDescription>
          Review the historical security timeline for your account
        </CardDescription>
      </CardHeader>
      <CardContent className="pl-3 sm:pl-6">
        <div className="flex flex-col space-y-4">
          {isLoading ? (
            <div className="relative border-l border-muted pl-6 ml-2 space-y-8 py-2 animate-in fade-in slide-in-from-top-2 duration-500">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-20" />
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground flex flex-col items-center">
              <History className="size-5 mb-2" />
              <p className="text-sm">No security events found</p>
            </div>
          ) : (
            <div className="relative border-l border-muted pl-3 sm:pl-6 ml-2 space-y-8 py-2">
              {events.map((event, index) => {
                const isLastElement = index === events.length - 1;
                return (
                  <div
                    key={event._id}
                    ref={isLastElement ? lastElementRef : null}
                    className="relative @container/event animate-in fade-in slide-in-from-top-2 duration-500"
                  >
                    <span className="absolute -left-[16px] sm:-left-[29px] top-2 flex size-2 items-center justify-center rounded-full bg-primary" />
                    <div className="flex flex-col gap-1.5 animate-in fade-in slide-in-from-bottom-2">
                      <div className="flex items-center flex-wrap gap-2">
                        <span className="font-semibold text-foreground">
                          {getEventTitle(event.eventType)}
                        </span>
                        {getEventBadge(event.eventType)}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {format(
                          new Date(event.createdAt),
                          "MMM d, yyyy 'at' h:mm a",
                        )}
                      </span>

                      <div className="bg-muted/50 rounded-md p-3 text-sm mt-2 border space-y-2">
                        <div className="overflow-hidden">
                          <p className="text-xs text-muted-foreground mb-1 font-medium">
                            Location
                          </p>
                          <p
                            className="font-mono text-xs text-foreground bg-background rounded px-2 py-1 border inline-block"
                            title={event.ipAddress}
                          >
                            {event.metadata?.deviceInfo?.location ||
                              event.ipAddress}
                          </p>
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-xs text-muted-foreground mb-1 font-medium">
                            Device / Agent
                          </p>
                          <p
                            className="font-mono text-xs text-foreground bg-background rounded px-2 py-1 border whitespace-pre-wrap break-all"
                            title={event.userAgent}
                          >
                            {event.metadata?.deviceInfo
                              ? `${event.metadata.deviceInfo.os} - ${event.metadata.deviceInfo.browser}`
                              : event.userAgent}
                          </p>
                        </div>
                      </div>

                      {event.metadata && event.eventType === "email_change" && (
                        <div className="bg-primary/5 rounded-md p-3 text-sm mt-1 border border-primary/20 flex flex-col">
                          <p className="text-xs text-primary font-medium mb-2 flex items-center gap-1.5">
                            <AlertCircle className="h-3.5 w-3.5" />
                            Recorded Change Data
                          </p>
                          <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3 font-mono text-xs bg-background/50 rounded border p-2">
                            <span className="line-through opacity-60 text-red-600 break-all">
                              {event.metadata.oldEmail}
                            </span>
                            <span className="hidden md:inline px-1">→</span>
                            <span className="text-green-600 dark:text-green-500 font-medium break-all">
                              {event.metadata.newEmail}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {isFetchingNextPage && (
                <div className="flex justify-center p-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
