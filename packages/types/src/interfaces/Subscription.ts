export interface CurrentSubscription {
  _id: string;
  userId: string;
  isOverLimit: boolean;
  plan?: "starter" | "medium" | "pro";
  isSubscriptionActive: boolean;
  trialExpiresAt?: string;
  subscriptionStartDate?: string;
  subscriptionEndDate?: string;
  isTrial?: boolean;
  period?: "monthly" | "yearly" | "trial";
}
