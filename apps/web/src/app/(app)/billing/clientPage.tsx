"use client";
import { Loader2 } from "lucide-react";
import { useState, useCallback, useEffect } from "react";
import axios from "@/utils/axiosInstance";
import { toast } from "sonner";
import { useDispatch, useSelector } from "react-redux";
import { signOut } from "@/store/authSlice";
import { useRouter } from "next/navigation";
import { AxiosError } from "axios";
import type { ApiResponse, CurrentSubscription } from "@repo/types";
import { RootState } from "@/store/store";
import { SubscriptionManagement } from "@/components/billingsdk/subscription-management";
import { plans, type CurrentPlan } from "@/lib/billingsdk-config";

const ClientPage = () => {
  const [currentSubscription, setCurrentSubscription] =
    useState<CurrentSubscription | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);

  const fetchSubscriptionDetails = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get("/subscription");
      setCurrentSubscription(response.data.data);
    } catch (error) {
      console.error(
        "Failed to fetch subscription details. Please try again later:",
        error,
      );
      const axiosError = error as AxiosError<ApiResponse>;
      // If 404, it just means no subscription, which is fine.
      if (axiosError.response?.status !== 404) {
        toast.error(
          axiosError.response?.data.message ||
            "Failed to fetch subscription details. Please try again later",
        );
      }

      if (axiosError.response?.status === 401) {
        dispatch(signOut());
        router.push("/signin?redirect=/billing");
      }
    } finally {
      setLoading(false);
    }
  }, [dispatch, router]);

  useEffect(() => {
    fetchSubscriptionDetails();
  }, [fetchSubscriptionDetails]);

  const handleUpdatePlan = async (
    planId: string,
    period: "monthly" | "yearly",
  ) => {
    if (!user) {
      toast.error("You need to be signed in to subscribe");
      router.push("/signin?redirect=/billing");
      return;
    }

    const selectedPlan = plans.find((p) => p.id === planId);
    if (!selectedPlan) {
      toast.error("Invalid plan selected");
      return;
    }

    // Logic to prevent downgrading if needed, or check validity
    if (
      currentSubscription?.plan === planId &&
      currentSubscription?.period === period &&
      currentSubscription?.isSubscriptionActive
    ) {
      toast.info("You are already subscribed to this plan");
      return;
    }

    router.push(`/billing/checkout?plan=${planId}&period=${period}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(95svh-var(--header-height))]">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  // Transform backend data to frontend model
  const activePlan = currentSubscription?.plan
    ? plans.find((p) => p.id === currentSubscription.plan)
    : null;

  const formatDate = (dateString: string | undefined | Date) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const currentPlanData: CurrentPlan = {
    plan: activePlan!,
    type:
      currentSubscription?.period === "yearly"
        ? "yearly"
        : currentSubscription?.period === "monthly"
          ? "monthly"
          : "custom",
    price: activePlan?.monthlyPrice || "-",
    startDate: formatDate(currentSubscription?.subscriptionStartDate),
    endDate: formatDate(currentSubscription?.subscriptionEndDate),
    status: currentSubscription?.isSubscriptionActive ? "active" : "inactive",
  };

  return (
    <section className="p-4 sm:p-6 w-full max-w-7xl mx-auto">
      <SubscriptionManagement
        className="max-w-2xl mx-auto"
        currentPlan={currentPlanData}
        updatePlan={{
          currentPlan: currentPlanData.plan,
          plans: plans,
          onPlanChange: handleUpdatePlan,
          triggerText:
            currentPlanData.status === "active"
              ? "Upgrade Plan"
              : "Purchase Plan",
          currentPlanStatus: currentPlanData.status,
          title:
            currentPlanData.status === "active"
              ? "Upgrade Plan"
              : "Purchase Plan",
        }}
      />
    </section>
  );
};

export default ClientPage;
