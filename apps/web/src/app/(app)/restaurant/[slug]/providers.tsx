"use client";

import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSocket } from "@/context/SocketContext";
import { toast } from "sonner";
import { useParams } from "next/navigation";
import type { AxiosError } from "axios";
import type { ApiResponse } from "@repo/types";
import axios from "@/utils/axiosInstance";
import { setActiveRestaurant } from "@/store/restaurantSlice";
import type { AppDispatch, RootState } from "@/store/store";
import { useNewOrderListener } from "@/hooks/useNewOrderListener";

export function Providers({ children }: { children: React.ReactNode }) {
  const activeRestaurant = useSelector(
    (state: RootState) => state.restaurantsSlice.activeRestaurant,
  );
  const dispatch = useDispatch<AppDispatch>();
  const { slug } = useParams<{ slug: string }>();
  const socket = useSocket();

  // Ref to keep the latest restaurant data for the connect handler
  const connectHandlerRef = useRef<(() => void) | null>(null);
  // Register new order listener globally
  useNewOrderListener();

  useEffect(() => {
    if (!slug) return;
    (async () => {
      try {
        const response = await axios.get(`/restaurant/${slug}`);
        if (response.data.success) {
          dispatch(setActiveRestaurant(response.data.data));
        }
      } catch (error) {
        console.error("Error fetching restaurant data:", error);
        const axiosError = error as AxiosError<ApiResponse>;
        toast.error(
          axiosError.response?.data.message ||
            "Failed to fetch restaurant data",
        );
      }
    })();
  }, [slug, dispatch]);

  // Connect handling
  useEffect(() => {
    if (!socket) return;

    // Clean any previous connect handler
    if (connectHandlerRef.current) {
      socket.off("connect", connectHandlerRef.current);
      connectHandlerRef.current = null;
    }

    const handleConnect = () => {
      if (activeRestaurant?._id) {
        socket.emit("authenticate", activeRestaurant._id);
        console.log(
          "Emitted authenticate event with restaurant ID:",
          activeRestaurant._id,
          socket.id,
        );
      }
    };
    connectHandlerRef.current = handleConnect;

    if (socket.connected) {
      handleConnect();
    } else {
      socket.on("connect", handleConnect);
    }

    return () => {
      if (connectHandlerRef.current) {
        socket.off("connect", connectHandlerRef.current);
        connectHandlerRef.current = null;
      }
    };
  }, [socket, activeRestaurant?._id]);

  return <>{children}</>;
}
