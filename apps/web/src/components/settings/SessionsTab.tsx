"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import { Button } from "@repo/ui/components/button";
import { toast } from "sonner";
import axios from "@/utils/axiosInstance";
import { Loader2, Monitor, MapPin, Clock, Unlink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { AxiosError } from "axios";
import type { ApiResponse } from "@repo/types";
import { signOut } from "@/store/authSlice";
import { useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@repo/ui/components/alert-dialog";

type Session = {
  _id: string;
  ipAddress: string;
  userAgent: string;
  lastActiveAt: string;
  createdAt: string;
};

export default function SessionsTab() {
  const dispatch = useDispatch();
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);

  const fetchSessions = useCallback(async () => {
    try {
      const response = await axios.get("/user/sessions");
      setSessions(response.data.data.sessions);
      setCurrentSession(response.data.data.currentSession);
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse>;
      console.error(axiosError);
      toast.error(
        axiosError.response?.data.message || "Failed to load active sessions",
      );
      if (axiosError.response?.status === 401) {
        dispatch(signOut());
        router.push("/signin" + "?redirect=" + window.location.href);
      }
    } finally {
      setIsLoading(false);
    }
  }, [dispatch, router]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const parseUserAgent = (ua: string) => {
    // Very basic parsing for display. You might want to use a library like UAParser.js for robust parsing.
    let browser = "Unknown Browser";
    let os = "Unknown OS";

    if (ua.includes("Chrome")) browser = "Chrome";
    else if (ua.includes("Firefox")) browser = "Firefox";
    else if (ua.includes("Safari") && !ua.includes("Chrome"))
      browser = "Safari";
    else if (ua.includes("Edge")) browser = "Edge";

    if (ua.includes("Windows")) os = "Windows";
    else if (ua.includes("Mac OS X")) os = "macOS";
    else if (ua.includes("Linux")) os = "Linux";
    else if (ua.includes("Android")) os = "Android";
    else if (ua.includes("iOS") || ua.includes("iPhone")) os = "iOS";

    return `${browser} on ${os}`;
  };

  const handleRevoke = async (id: string) => {
    setRevokingId(id);
    try {
      await axios.delete(`/user/sessions/${id}`);
      toast.success("Session revoked successfully");
      setSessions(sessions.filter((s) => s._id !== id));
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse>;
      console.error(axiosError);
      toast.error(
        axiosError.response?.data.message || "Failed to revoke session",
      );
      if (axiosError.response?.status === 401) {
        dispatch(signOut());
        router.push("/signin" + "?redirect=" + window.location.href);
      }
    } finally {
      setRevokingId(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Sessions</CardTitle>
        <CardDescription>
          These are devices that have logged into your account. Revoke any
          sessions that you do not recognize
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : sessions.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No active sessions found
          </p>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => (
              <div
                key={session._id}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg gap-4"
              >
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-primary/10 rounded-full mt-1">
                    <Monitor className="h-5 w-5 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium text-sm flex flex-wrap gap-2">
                      <span>{parseUserAgent(session.userAgent)}</span>
                      {session._id === currentSession?._id && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-semibold">
                          Current Session
                        </span>
                      )}
                    </p>
                    <div className="flex flex-wrap items-center text-xs text-muted-foreground mt-1 space-x-3">
                      <span className="flex items-center">
                        <MapPin className="h-3 w-3 mr-1" />
                        {session.ipAddress}
                      </span>
                      <span className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        Active{" "}
                        {formatDistanceToNow(
                          new Date(session.lastActiveAt),
                        )}{" "}
                        ago
                      </span>
                    </div>
                  </div>
                </div>
                {session._id !== currentSession?._id && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={revokingId === session._id}
                      >
                        {revokingId === session._id ? (
                          <Loader2 className="animate-spin" />
                        ) : (
                          <Unlink />
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Are you absolutely sure?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          This action will revoke the selected session and log
                          the user out of the application.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive hover:bg-destructive/90 text-white"
                          onClick={() => handleRevoke(session._id)}
                        >
                          Continue
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
