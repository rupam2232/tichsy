export interface CurrentSubscription {
  _id: string;
  userId: string;
  plan?: "starter" | "medium" | "pro";
  isSubscriptionActive: boolean;
  subscriptionStartDate?: string;
  subscriptionEndDate?: string;
  period?: "monthly" | "yearly";
}

export interface SubscriptionSuccessEvent {
  plan: string;
  period: string;
  amount: number;
  currency: string;
  productName: string;
  action: "create" | "renew" | "upgrade" | "downgrade";
}
