"use client";

import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSocket } from "@/context/SocketContext";
import { useParams, useRouter, usePathname } from "next/navigation";
import type { AxiosError } from "axios";
import type { ApiResponse } from "@repo/types";
import axios from "@/utils/axiosInstance";
import { setActiveRestaurant } from "@/store/restaurantSlice";
import type { AppDispatch, RootState } from "@/store/store";
import { Loader2, ShieldAlert } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import Link from "next/link";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@repo/ui/components/empty";

export function Providers({ children }: { children: React.ReactNode }) {
  const activeRestaurant = useSelector(
    (state: RootState) => state.restaurantsSlice.activeRestaurant,
  );
  const dispatch = useDispatch<AppDispatch>();
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const pathname = usePathname();
  const socket = useSocket();

  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [authError, setAuthError] = useState<{
    title: string;
    description: string;
    content: string;
  } | null>(null);

  const pathnameRef = useRef(pathname);
  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    if (!slug) return;

    const redirectSlug = localStorage.getItem(`slug_redirect_${slug}`);
    if (redirectSlug && redirectSlug !== slug) {
      if (pathnameRef.current.includes(`/restaurant/${slug}`)) {
        const newPath = pathnameRef.current.replace(
          `/restaurant/${slug}`,
          `/restaurant/${redirectSlug}`,
        );
        router.replace(newPath);
        return;
      }
    }

    (async () => {
      try {
        setIsInitializing(true);
        setAuthError(null);
        const response = await axios.get(`/restaurant/${slug}`);
        if (response.data.success) {
          dispatch(
            setActiveRestaurant({
              ...response.data.data,
              userRole: response.data.data.userRole.toLowerCase(),
            }),
          );
        }
      } catch (error) {
        console.error("Error fetching restaurant data:", error);
        const axiosError = error as AxiosError<ApiResponse>;
        setAuthError({
          title: "Connection Error",
          description: "Could not connect to the server",
          content: "",
        });
        if (axiosError.response) {
          if (
            axiosError.response.status === 401 ||
            axiosError.response.status === 403
          ) {
            setAuthError({
              title: "Access Denied",
              description:
                "You do not have permission to view this page",
              content:
                "If you believe this is a mistake, please make sure you are logged into the correct account or contact the owner",
            });
          } else if (axiosError.response.status === 404) {
            setAuthError({
              title: "Restaurant Not Found",
              description:
                "The restaurant you are trying to access does not exist",
              content: "",
            });
          } else {
            setAuthError({
              title: "Error occurred",
              description:
                axiosError.response?.data?.message ||
                "Something went wrong while loading the page",
              content: "",
            });
          }
        }
      } finally {
        setIsInitializing(false);
      }
    })();
  }, [slug, dispatch, router]);

  // Connect handling
  useEffect(() => {
    if (!socket || !activeRestaurant?._id) return;

    const handleConnect = () => {
      socket.emit("joinRestaurantRoom", activeRestaurant._id);
      console.log(
        "Emitted joinRestaurantRoom event with restaurant ID:",
        activeRestaurant._id,
        socket.id,
      );
    };

    if (socket.connected) {
      handleConnect();
    }

    socket.on("connect", handleConnect);

    return () => {
      socket.off("connect", handleConnect);
      if (socket.connected) {
        socket.emit("leaveRestaurantRoom", activeRestaurant._id);
        console.log(
          "Emitted leaveRestaurantRoom with ID:",
          activeRestaurant._id,
        );
      }
    };
  }, [socket, activeRestaurant?._id]);

  if (isInitializing) {
    return (
      <div className="flex h-[80vh] w-full items-center justify-center bg-background">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  if (authError) {
    return (
      <div className="fixed inset-0 flex h-screen w-full items-center justify-center bg-background z-20">
        <Empty className="animate-in fade-in slide-in-from-top-4 duration-500 flex items-center justify-center mt-12">
          <EmptyHeader>
            <EmptyMedia variant="icon" className="size-9">
              <ShieldAlert className="size-4" />
            </EmptyMedia>
            <EmptyTitle>{authError.title}</EmptyTitle>
            <EmptyDescription>{authError.description}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            {authError.content && <p>{authError.content}</p>}
            <Button asChild className="px-8">
              <Link href="/home">Go Home</Link>
            </Button>
          </EmptyContent>
        </Empty>
      </div>
    );
  }

  return <>{children}</>;
}
