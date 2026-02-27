"use client";

import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { RootState, AppDispatch } from "@/store/store";
import { fetchSubscriptionDetails } from "@/store/subscriptionSlice";
import { SubscriptionManagement } from "@/components/features/billing/subscription-management";
import { SubscriptionHistoryList } from "@/components/features/billing/subscription-history-list";
import { plans, type CurrentPlan } from "@/lib/billingsdk-config";

const ClientPage = () => {
  const { currentSubscription, loading } = useSelector(
    (state: RootState) => state.subscription,
  );
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.auth.user);

  useEffect(() => {
    dispatch(fetchSubscriptionDetails());
  }, [dispatch]);

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

  // Transforming backend data to frontend model
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
    <section className="p-4 sm:p-6 w-full max-w-2xl mx-auto">
      <SubscriptionManagement
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
        className="animate-in fade-in slide-in-from-top-4 duration-500"
      />
      <SubscriptionHistoryList />
    </section>
  );
};

export default ClientPage;
