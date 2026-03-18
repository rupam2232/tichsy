"use client";

import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { addDays, isBefore, isAfter } from "date-fns";
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

    // Allow same plan selection for renewals (different period or same period)
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

  // Check if subscription is in grace period
  const isInGracePeriod = () => {
    if (!currentSubscription?.subscriptionEndDate) return false;
    const subscriptionEnd = new Date(currentSubscription.subscriptionEndDate);
    const graceEnd = addDays(subscriptionEnd, 1); // 1 day grace period
    return isAfter(new Date(), subscriptionEnd) && isBefore(new Date(), graceEnd);
  };

  // Calculate days until subscription expiry
  const getDaysUntilExpiry = () => {
    if (!currentSubscription?.subscriptionEndDate) return null;
    const endDate = new Date(currentSubscription.subscriptionEndDate);
    const now = new Date();
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const currentPlanData: CurrentPlan = {
    plan: activePlan!,
    type: currentSubscription?.period ?? "custom",
    price: activePlan?.monthlyPrice || "-",
    startDate: formatDate(currentSubscription?.subscriptionStartDate),
    endDate: formatDate(currentSubscription?.subscriptionEndDate),
    status: currentSubscription?.isSubscriptionActive ? "active" : "inactive",
  };

  // Determine button text based on subscription status
  const isActivePaidPlan =
    currentPlanData.status === "active" &&
    currentSubscription?.plan !== "starter";
  const triggerButtonText = isActivePaidPlan
    ? "Renew or Upgrade"
    : currentPlanData.status === "active"
      ? "Upgrade Plan"
      : "Purchase Plan";

  return (
    <section className="p-4 sm:p-6 w-full max-w-2xl mx-auto">
      <SubscriptionManagement
        currentPlan={currentPlanData}
        updatePlan={{
          currentPlan: currentPlanData.plan,
          plans: plans,
          onPlanChange: handleUpdatePlan,
          triggerText: triggerButtonText,
          currentPlanStatus: currentPlanData.status,
          title: isActivePaidPlan
            ? "Renew or Upgrade Plan"
            : currentPlanData.status === "active"
              ? "Upgrade Plan"
              : "Purchase Plan",
          hasPendingPlan: !!currentSubscription?.pendingPlan,
        }}
        isInGracePeriod={isInGracePeriod()}
        pendingPlan={currentSubscription?.pendingPlan}
        daysUntilExpiry={getDaysUntilExpiry()}
        className="animate-in fade-in slide-in-from-top-4 duration-500"
      />
      <SubscriptionHistoryList />
    </section>
  );
};

export default ClientPage;
