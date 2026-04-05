"use client";

import { cn } from "@repo/ui/lib/utils";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent } from "@repo/ui/components/card";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "@/utils/axiosInstance";
import { toast } from "sonner";
import { Loader2, Store, AlertCircle, Users } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store/store";
import { AxiosError } from "axios";
import { ApiResponse, InvitationType } from "@repo/types";
import { signOut } from "@/store/authSlice";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@repo/ui/components/avatar";
import { getOptimizedUrl } from "@/utils/imageOptimizer";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@repo/ui/components/empty";
import Link from "next/link";

export function JoinForm({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);

  const [loading, setLoading] = useState(true);
  const [invitation, setInvitation] = useState<InvitationType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  useEffect(() => {
    if (!token) {
      setError(
        "No invitation token provided. Please check the link from your email.",
      );
      setLoading(false);
      return;
    }

    const verifyToken = async () => {
      try {
        const res = await axios.get(`/invitation/verify/${token}`);
        setInvitation(res.data.data);
      } catch (error) {
        console.error("failed to verify invitation", error);
        const axiosError = error as AxiosError<ApiResponse>;
        setError(
          axiosError.response?.data?.message ||
            "Invalid or expired invitation token.",
        );
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleAccept = useCallback(async () => {
    setAccepting(true);
    const toastId = toast.loading("Accepting invitation...");
    try {
      await axios.post(`/invitation/accept/${token}`);
      toast.success("Invitation accepted successfully! Welcome to the team", {
        id: toastId,
      });
      router.push("/home");
    } catch (error) {
      console.error("failed to accept invitation", error);
      const axiosError = error as AxiosError<ApiResponse>;
      toast.error(
        axiosError.response?.data?.message || "Failed to accept invitation",
        { id: toastId },
      );
      if (axiosError.response?.status === 401) {
        dispatch(signOut());
        router.push("/signin?redirect=" + window.location.href);
      }
    } finally {
      setAccepting(false);
    }
  }, [token, router, dispatch]);

  const handleReject = useCallback(async () => {
    setRejecting(true);
    const toastId = toast.loading("Rejecting invitation...");
    try {
      await axios.post(`/invitation/reject/${token}`);
      toast.success("Invitation rejected successfully", { id: toastId });
      router.push("/");
    } catch (error) {
      console.error("failed to reject invitation", error);
      const axiosError = error as AxiosError<ApiResponse>;
      toast.error(
        axiosError.response?.data?.message || "Failed to reject invitation",
        { id: toastId },
      );
      if (axiosError.response?.status === 401) {
        dispatch(signOut());
        router.push("/signin?redirect=" + window.location.href);
      }
    } finally {
      setRejecting(false);
    }
  }, [token, router, dispatch]);

  const isEmailMatching = useMemo(
    () => user?.email.toLowerCase() === invitation?.email.toLowerCase(),
    [user, invitation],
  );

  if (loading) {
    return (
      <Card className={cn("overflow-hidden p-0", className)} {...props}>
        <CardContent className="flex flex-col items-center justify-center p-12 min-h-[400px]">
          <Loader2 className="animate-spin h-8 w-8 mb-4" />
          <p className="text-muted-foreground animate-pulse">
            Verifying your invitation securely...
          </p>
        </CardContent>
      </Card>
    );
  }

  if (error || !invitation) {
    return (
      <Card
        className={cn("overflow-hidden p-0 max-w-lg mx-auto", className)}
        {...props}
      >
        <CardContent>
          <Empty className="animate-in fade-in slide-in-from-top-4 duration-500 flex items-center justify-centery">
            <EmptyHeader>
              <EmptyMedia variant="icon" className="size-9">
                <AlertCircle className="size-4" />
              </EmptyMedia>
              <EmptyTitle>Invitation Error</EmptyTitle>
              <EmptyDescription>{error}</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button asChild className="px-8">
                <Link href="/home">Go Home</Link>
              </Button>
            </EmptyContent>
          </Empty>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        "overflow-hidden flex flex-col md:flex-row shadow-md border-border/50 backdrop-blur-sm p-0!",
        className,
      )}
      {...props}
    >
      <CardContent className="flex flex-col justify-center gap-8 md:w-1/2 p-8 lg:p-12 relative overflow-y-auto">
        <div className="flex flex-col items-center md:items-start text-center md:text-left">
          <div className="p-2 rounded-lg mb-6 bg-muted">
            <Users className="size-4" />
          </div>
          <h1 className="text-3xl font-bold mb-3 text-foreground tracking-tight">
            You&apos;ve been invited!
          </h1>
          <p className="text-muted-foreground text-balance mt-2 leading-relaxed">
            You have received an exclusive invitation to join{" "}
            <strong className="text-foreground">
              {invitation.restaurantId.restaurantName}
            </strong>{" "}
            as a{" "}
            <strong className="text-foreground capitalize">
              {invitation.role}
            </strong>
            .
          </p>
        </div>

        {!user ? (
          <div className="bg-muted/50 p-6 rounded-xl border border-border/50 shadow-inner">
            <p className="mb-5 text-sm text-muted-foreground text-balance text-center">
              To accept this invitation and join as{" "}
              <span className="font-semibold text-foreground">
                {invitation.role}
              </span>
              , please log in with the email address{" "}
              <span className="font-semibold text-foreground break-all">
                {invitation.email}
              </span>
              .
            </p>
            <div className="flex flex-col gap-3 mt-4 w-full max-w-sm mx-auto md:mx-0">
              <Button
                className="w-full shadow-sm"
                asChild
              >
                <Link href={`/signin?redirect=/join?token=${token}`}>
                  Sign In
                </Link>
              </Button>
              <Button
                variant="outline"
                className="w-full bg-background hover:bg-muted font-medium"
                asChild
              >
                <Link href={`/signup?redirect=/join?token=${token}`}>
                  Sign Up
                </Link>
              </Button>
            </div>
          </div>
        ) : !isEmailMatching ? (
          <>
            <div className="bg-destructive/10 border-destructive/30 border text-destructive p-5 rounded-xl shadow-inner flex gap-3 items-start">
              <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
              <div className="text-sm">
                You are currently logged in as{" "}
                <span className="font-bold">{user.email}</span>, but this
                invitation was sent to{" "}
                <span className="font-bold">{invitation.email}</span>. Please
                log out and sign back in with the correct account.
              </div>
            </div>
            <Button className="w-full shadow-sm" asChild>
              <Link href="/home">Go Home</Link>
            </Button>
          </>
        ) : (
          <div className="flex flex-col gap-3 mt-4 w-full max-w-sm mx-auto md:mx-0">
            <Button onClick={handleAccept} disabled={accepting || rejecting}>
              {accepting ? (
                <>
                  <Loader2 className="animate-spin mr-2 h-5 w-5" /> Accepting...
                </>
              ) : (
                "Accept Invitation"
              )}
            </Button>
            <Button
              onClick={handleReject}
              disabled={accepting || rejecting}
              variant="outline"
              className="text-red-500 hover:text-red-600"
            >
              {rejecting ? (
                <>
                  <Loader2 className="animate-spin mr-2 h-5 w-5" /> Rejecting...
                </>
              ) : (
                "Decline Invitation"
              )}
            </Button>
          </div>
        )}
      </CardContent>

      <div className="bg-muted relative hidden md:block md:w-1/2 min-h-[500px]">
        <div className="absolute inset-0 h-full w-full bg-gradient-to-br from-primary via-primary/50 to-background flex flex-col items-center justify-center p-8 text-center border-l border-border/50">
          <Avatar className="size-20 mb-2">
            <AvatarImage
              src={getOptimizedUrl(
                invitation.restaurantId.logoUrl,
                200,
                200,
                "r_max",
              )}
              alt={`${invitation.restaurantId.restaurantName} Logo`}
              className="object-cover"
              loading="lazy"
              draggable={false}
            />
            <AvatarFallback className="bg-muted p-6 rounded-full shadow-sm ring-1 ring-border/50 backdrop-blur-md">
              <Store />
            </AvatarFallback>
          </Avatar>
          <h2 className="text-2xl font-bold text-foreground/80 tracking-tight">
            {invitation.restaurantId.restaurantName}
          </h2>
        </div>
      </div>
    </Card>
  );
}
