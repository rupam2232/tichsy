export interface CurrentSubscription {
  _id: string;
  userId: string;
  plan?: "starter" | "medium" | "pro";
  isSubscriptionActive: boolean;
  subscriptionStartDate?: string;
  subscriptionEndDate?: string;
  period?: "monthly" | "yearly";
  pendingPlan?: {
    plan: "medium" | "pro";
    period: "monthly" | "yearly";
    paidAt: string;
    transactionId: string;
  };
}
