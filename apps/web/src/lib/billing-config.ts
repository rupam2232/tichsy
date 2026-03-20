import {
  getAllPlans as getPlansFromPackage,
  PlanHierarchy,
  SUBSCRIPTION_PLANS,
  type SubscriptionPlan,
  type BillingCycle,
  type PlanConfig,
  type PlanFeature,
  type PlanDisplay,
} from "@repo/pricing";

// Re-export types
export type { SubscriptionPlan, BillingCycle, PlanConfig, PlanFeature, PlanDisplay };

// Re-export constants
export { PlanHierarchy, SUBSCRIPTION_PLANS };

// Export plans as array for backwards compatibility
export const plans = getPlansFromPackage();
export const getAllPlans = getPlansFromPackage;

// Legacy interface for backwards compatibility - now just an alias
export type Plan = PlanDisplay;

export interface CurrentPlan {
  plan: Plan;
  type: "monthly" | "yearly" | "custom";
  price?: string;
  startDate?: string;
  endDate?: string;
  status: "active" | "inactive" | "past_due" | "cancelled";
}
