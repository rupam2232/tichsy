export type SubscriptionPlan = "starter" | "medium" | "pro";

export const SubscriptionPlanHierarchy: Record<SubscriptionPlan, number> = {
  starter: 1,
  medium: 2,
  pro: 3,
};

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
    maxFoodItemsPerRestaurant: 50,
    maxVariantsPerFoodItem: 3,
    maxImagesPerFoodItem: 2,
    maxCategoriesPerRestaurant: 5,
    maxStaffPerRestaurant: 2,
    maxActiveCouponsPerRestaurant: 3,
    maxStorageInMB: 100,
    orderHistoryDays: 30,
    priceMonthly: 300,
    priceYearly: 3000,
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
