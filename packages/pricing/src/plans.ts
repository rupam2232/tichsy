import { PlanConfig, SubscriptionPlan } from "./types";

/**
 * Source of truth for subscription plans, limits, and pricing.
 * All pricing is in Indian Rupees (INR).
 * Yearly pricing includes 10% discount.
 */
export const SUBSCRIPTION_PLANS: Record<SubscriptionPlan, PlanConfig> = {
  starter: {
    maxRestaurants: 1,
    maxTablesPerRestaurant: 10,
    maxFoodItemsPerRestaurant: 20,
    maxVariantsPerFoodItem: 0,
    maxImagesPerFoodItem: 1,
    maxCategoriesPerRestaurant: 4,
    maxStaffPerRestaurant: 0,
    analyticsHistoryDays: 30,
    priceMonthly: 0,
    priceYearly: 0,
  },
  medium: {
    maxRestaurants: 3,
    maxTablesPerRestaurant: 30,
    maxFoodItemsPerRestaurant: 100,
    maxVariantsPerFoodItem: 3,
    maxImagesPerFoodItem: 3,
    maxCategoriesPerRestaurant: 15,
    maxStaffPerRestaurant: 10,
    analyticsHistoryDays: 180,
    priceMonthly: 399,
    priceYearly: 4310, // 10% discount: 399 * 12 * 0.9
  },
  pro: {
    maxRestaurants: 10,
    maxTablesPerRestaurant: 999999,
    maxFoodItemsPerRestaurant: 999999,
    maxVariantsPerFoodItem: 20,
    maxImagesPerFoodItem: 10,
    maxCategoriesPerRestaurant: 999999,
    maxStaffPerRestaurant: 50,
    analyticsHistoryDays: 365,
    priceMonthly: 699,
    priceYearly: 7550, // 10% discount: 699 * 12 * 0.9
  },
};

/**
 * Number of days after subscription end date before automatic downgrade.
 * During this period, user keeps paid plan features but should see renewal warnings.
 */
export const GRACE_PERIOD_DAYS = 1;
