/**
 * Subscription plan identifiers
 */
export type SubscriptionPlan = "starter" | "medium" | "pro";

/**
 * Subscription billing cycle
 */
export type BillingCycle = "monthly" | "yearly";

/**
 * Plan configuration with limits and pricing
 */
export interface PlanConfig {
  maxRestaurants: number;
  maxTablesPerRestaurant: number;
  maxFoodItemsPerRestaurant: number;
  maxVariantsPerFoodItem: number;
  maxImagesPerFoodItem: number;
  maxCategoriesPerRestaurant: number;
  maxStaffPerRestaurant: number;
  analyticsHistoryDays: number;
  priceMonthly: number;
  priceYearly: number;
}

/**
 * Plan hierarchy for determining upgrade/downgrade
 */
export const PlanHierarchy: Record<SubscriptionPlan, number> = {
  starter: 1,
  medium: 2,
  pro: 3,
};

/**
 * Marketing feature for display
 */
export interface PlanFeature {
  name: string;
}

/**
 * Complete plan data for frontend display
 */
export interface PlanDisplay {
  id: SubscriptionPlan;
  title: string;
  description: string;
  highlight?: boolean;
  badge?: string;
  currency: string;
  monthlyPrice: string;
  yearlyPrice: string;
  buttonText: string;
  features: PlanFeature[];
}
