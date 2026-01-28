export interface CurrentSubscription {
  _id: string;
  userId: string;
  plan?: "starter" | "medium" | "pro";
  isSubscriptionActive: boolean;
  trialExpiresAt?: string;
  subscriptionStartDate?: string;
  subscriptionEndDate?: string;
  isTrial?: boolean;
}