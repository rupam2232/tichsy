"use client";

import { useEffect, useState } from "react";
import { useSocket } from "@/context/SocketContext";
import { PaymentSuccessDialog } from "./payment-success-dialog";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "@/store/store";
import { fetchSubscriptionDetails } from "@/store/subscriptionSlice";

interface SubscriptionSuccessEvent {
  plan: string;
  period: string;
  amount: number;
  currency: string;
  productName: string;
  action: "create" | "renew" | "upgrade" | "downgrade";
}

export function SubscriptionSuccessListener() {
  const socket = useSocket();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const [open, setOpen] = useState(false);
  const [eventData, setEventData] = useState<SubscriptionSuccessEvent | null>(
    null,
  );

  useEffect(() => {
    if (!socket) return;

    const handleSubscriptionSuccess = (data: SubscriptionSuccessEvent) => {
      console.log("Subscription success event received:", data);
      setEventData(data);
      setOpen(true);

      router.refresh();
      dispatch(fetchSubscriptionDetails());
    };

    socket.on("subscription_success", handleSubscriptionSuccess);

    return () => {
      socket.off("subscription_success", handleSubscriptionSuccess);
    };
  }, [socket, router, dispatch]);

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
