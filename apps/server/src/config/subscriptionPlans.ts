import { addDays, isBefore, isAfter } from "date-fns";

export type SubscriptionPlan = "starter" | "medium" | "pro";

export const SubscriptionPlanHierarchy: Record<SubscriptionPlan, number> = {
  starter: 1,
  medium: 2,
  pro: 3,
};

/**
 * Number of days after subscription end date before automatic downgrade.
 * During this period, user keeps paid plan features but should see renewal warnings.
 */
export const GRACE_PERIOD_DAYS = 1;

/**
 * Check if subscription has expired (past grace period) and should be downgraded.
 */
export function isSubscriptionExpired(subscriptionEndDate: Date | undefined): boolean {
  if (!subscriptionEndDate) return false;
  const graceEnd = addDays(subscriptionEndDate, GRACE_PERIOD_DAYS);
  return isBefore(graceEnd, new Date());
}

/**
 * Check if subscription is in grace period (expired but not yet downgraded).
 * Use this to show warnings to users about upcoming downgrade.
 */
export function isInGracePeriod(subscriptionEndDate: Date | undefined): boolean {
  if (!subscriptionEndDate) return false;
  const now = new Date();
  const graceEnd = addDays(subscriptionEndDate, GRACE_PERIOD_DAYS);
  return isAfter(now, subscriptionEndDate) && !isAfter(now, graceEnd);
}

export interface PlanConfig {
  maxRestaurants: number;
  maxTablesPerRestaurant: number;
  maxFoodItemsPerRestaurant: number;
  maxVariantsPerFoodItem: number;
  maxImagesPerFoodItem: number;
  maxCategoriesPerRestaurant: number;
  maxStaffPerRestaurant: number;
  maxActiveCouponsPerRestaurant: number;
  maxStorageInMB: number;
  orderHistoryDays: number;
  priceMonthly: number;
  priceYearly: number;
}

export const SUBSCRIPTION_PLANS: Record<SubscriptionPlan, PlanConfig> = {
  starter: {
    maxRestaurants: 1,
    maxTablesPerRestaurant: 10,
    maxFoodItemsPerRestaurant: 15,
    maxVariantsPerFoodItem: 0,
    maxImagesPerFoodItem: 1,
    maxCategoriesPerRestaurant: 0,
    maxStaffPerRestaurant: 0,
    maxActiveCouponsPerRestaurant: 3,
    maxStorageInMB: 100,
    orderHistoryDays: 30,
    priceMonthly: 0,
    priceYearly: 0,
  },
  medium: {
    maxRestaurants: 3,
    maxTablesPerRestaurant: 50,
    maxFoodItemsPerRestaurant: 200,
    maxVariantsPerFoodItem: 6,
    maxImagesPerFoodItem: 5,
    maxCategoriesPerRestaurant: 15,
    maxStaffPerRestaurant: 10,
    maxActiveCouponsPerRestaurant: 15,
    maxStorageInMB: 500,
    orderHistoryDays: 90,
    priceMonthly: 500,
    priceYearly: 5000,
  },
  pro: {
    maxRestaurants: 10,
    maxTablesPerRestaurant: 999999, // Unlimited
    maxFoodItemsPerRestaurant: 999999,
    maxVariantsPerFoodItem: 999999, // System limits might apply elsewhere
    maxImagesPerFoodItem: 10, // Practical limit
    maxCategoriesPerRestaurant: 999999,
    maxStaffPerRestaurant: 999999,
    maxActiveCouponsPerRestaurant: 999999,
    maxStorageInMB: 5000,
    orderHistoryDays: 999999,
    priceMonthly: 800,
    priceYearly: 8000,
  },
};
