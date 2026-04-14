"use client";

import { useEffect, useState } from "react";
import { useSocket } from "@/context/SocketContext";
import { PaymentSuccessDialog } from "./payment-success-dialog";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/store/store";
import { fetchSubscriptionDetails, setPendingSuccessEvent } from "@/store/subscriptionSlice";
import type { SubscriptionSuccessEvent } from "@repo/types";

export function SubscriptionSuccessListener() {
  const socket = useSocket();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const isRazorpayOpen = useSelector((state: RootState) => state.subscription.isRazorpayOpen);
  const pendingEvent = useSelector((state: RootState) => state.subscription.pendingSuccessEvent);

  const [open, setOpen] = useState(false);
  const [eventData, setEventData] = useState<SubscriptionSuccessEvent | null>(null);

  // 1. Listen for background socket events and push to Redux
  useEffect(() => {
    if (!socket) return;

    const handleSubscriptionSuccess = (data: SubscriptionSuccessEvent) => {
      console.log("Subscription success event received:", data);
      dispatch(setPendingSuccessEvent(data));
      router.refresh();
      dispatch(fetchSubscriptionDetails());
    };

    socket.on("subscription_success", handleSubscriptionSuccess);

    return () => {
      socket.off("subscription_success", handleSubscriptionSuccess);
    };
  }, [socket, router, dispatch]);

  // 2. React to Redux state changes symmetrically
  useEffect(() => {
    if (!isRazorpayOpen && pendingEvent) {
      setEventData(pendingEvent);
      setOpen(true);
      dispatch(setPendingSuccessEvent(null));
    }
  }, [isRazorpayOpen, pendingEvent, dispatch]);

  if (!eventData) return null;

  const getSubtitle = () => {
    switch (eventData.action) {
      case "renew":
        return "Your subscription has been successfully renewed";
      case "upgrade":
        return "Your plan has been successfully upgraded";
      case "downgrade":
        return "Your plan has been successfully updated";
      case "create":
      default:
        return "Your subscription has been successfully activated";
    }
  };

  return (
    <PaymentSuccessDialog
      open={open}
      onOpenChange={setOpen}
      price={eventData.amount.toString()}
      currencySymbol="₹"
      productName={eventData.productName}
      title="Subscription Activated"
      subtitle={getSubtitle()}
      showFooter={false}
    />
  );
}
