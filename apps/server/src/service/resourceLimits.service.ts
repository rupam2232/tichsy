import { Restaurant } from "../models/restaurant.model.js";
import { RestaurantMember } from "../models/restaurantMember.model.js";
import { FoodItem } from "../models/foodItem.model.js";
import { Table } from "../models/table.model.js";
import {
  SUBSCRIPTION_PLANS,
  SubscriptionPlan,
} from "../config/subscriptionPlans.js";
import { Types } from "mongoose";

interface ResourceCount {
  current: number;
  limit: number;
  excess: number;
}

interface RestaurantResourceInfo {
  restaurantId: string;
  restaurantName: string;
  categories: ResourceCount;
  tables: ResourceCount;
  foodItems: ResourceCount;
  foodItemsWithExcessVariants: number;
  foodItemsWithExcessImages: number;
  staff: ResourceCount;
}

export interface ResourceLimitCheckResult {
  isWithinLimits: boolean;
  restaurants: ResourceCount;
  restaurantDetails: RestaurantResourceInfo[];
  summary: string[];
}

/**
 * Checks if user's current resource usage is within the limits of a target plan.
 * Returns detailed breakdown of what's over limit.
 */
export async function checkResourceLimits(
  userId: string | Types.ObjectId,
  targetPlan: SubscriptionPlan
): Promise<ResourceLimitCheckResult> {
  const limits = SUBSCRIPTION_PLANS[targetPlan];
  const summary: string[] = [];

  // Count active restaurants
  const activeRestaurants = await Restaurant.find({
    ownerId: userId,
    isArchived: { $ne: true },
  })
    .select("_id restaurantName categories")
    .lean();

  const restaurantCount: ResourceCount = {
    current: activeRestaurants.length,
    limit: limits.maxRestaurants,
    excess: Math.max(0, activeRestaurants.length - limits.maxRestaurants),
  };

  if (restaurantCount.excess > 0) {
    summary.push(
      `You have ${restaurantCount.current} active restaurants but the ${targetPlan} plan allows only ${restaurantCount.limit}. Archive ${restaurantCount.excess} restaurant(s).`
    );
  }

  // Check each restaurant's resources
  const restaurantDetails: RestaurantResourceInfo[] = [];

  for (const restaurant of activeRestaurants) {
    // Check category count
    const categoryCount = restaurant.categories?.length || 0;
    const categories: ResourceCount = {
      current: categoryCount,
      limit: limits.maxCategoriesPerRestaurant,
      excess: Math.max(0, categoryCount - limits.maxCategoriesPerRestaurant),
    };

    const [tableCount, activeFoodItems, staffCount] = await Promise.all([
      Table.countDocuments({
        restaurantId: restaurant._id,
        isArchived: { $ne: true },
      }),
      FoodItem.find({
        restaurantId: restaurant._id,
        isArchived: { $ne: true },
      })
        .select("variants imageUrls")
        .lean(),
      RestaurantMember.countDocuments({
        restaurantId: restaurant._id,
        isArchived: false,
      }),
    ]);

    const tables: ResourceCount = {
      current: tableCount,
      limit: limits.maxTablesPerRestaurant,
      excess: Math.max(0, tableCount - limits.maxTablesPerRestaurant),
    };

    const foodItems: ResourceCount = {
      current: activeFoodItems.length,
      limit: limits.maxFoodItemsPerRestaurant,
      excess: Math.max(0, activeFoodItems.length - limits.maxFoodItemsPerRestaurant),
    };

    // Count food items with excess variants or images
    let foodItemsWithExcessVariants = 0;
    let foodItemsWithExcessImages = 0;

    for (const item of activeFoodItems) {
      const variantCount = item.variants?.length || 0;
      const imageCount = item.imageUrls?.length || 0;

      if (variantCount > limits.maxVariantsPerFoodItem) {
        foodItemsWithExcessVariants++;
      }
      if (imageCount > limits.maxImagesPerFoodItem) {
        foodItemsWithExcessImages++;
      }
    }

    const staff: ResourceCount = {
      current: staffCount,
      limit: limits.maxStaffPerRestaurant,
      excess: Math.max(0, staffCount - limits.maxStaffPerRestaurant),
    };

    const hasExcess =
      categories.excess > 0 ||
      tables.excess > 0 ||
      foodItems.excess > 0 ||
      foodItemsWithExcessVariants > 0 ||
      foodItemsWithExcessImages > 0 ||
      staff.excess > 0;

    if (hasExcess) {
      const restaurantSummary: string[] = [];
      if (categories.excess > 0) {
        restaurantSummary.push(`${categories.excess} categories`);
      }
      if (tables.excess > 0) {
        restaurantSummary.push(`${tables.excess} tables`);
      }
      if (foodItems.excess > 0) {
        restaurantSummary.push(`${foodItems.excess} food items`);
      }
      if (foodItemsWithExcessVariants > 0) {
        restaurantSummary.push(
          `${foodItemsWithExcessVariants} food items with too many variants (max ${limits.maxVariantsPerFoodItem})`
        );
      }
      if (foodItemsWithExcessImages > 0) {
        restaurantSummary.push(
          `${foodItemsWithExcessImages} food items with too many images (max ${limits.maxImagesPerFoodItem})`
        );
      }
      if (staff.excess > 0) {
        restaurantSummary.push(`${staff.excess} staff members`);
      }
      summary.push(
        `"${restaurant.restaurantName}" exceeds limits: archive ${restaurantSummary.join(", ")} or archive the entire restaurant.`
      );
    }

    restaurantDetails.push({
      restaurantId: restaurant._id.toString(),
      restaurantName: restaurant.restaurantName,
      categories,
      tables,
      foodItems,
      foodItemsWithExcessVariants,
      foodItemsWithExcessImages,
      staff,
    });
  }

  const isWithinLimits = summary.length === 0;

  return {
    isWithinLimits,
    restaurants: restaurantCount,
    restaurantDetails,
    summary,
  };
}

/**
 * Builds a user-friendly error message for resource limit violations.
 */
export function buildResourceLimitErrorMessage(
  result: ResourceLimitCheckResult,
  targetPlan: SubscriptionPlan
): string {
  if (result.isWithinLimits) {
    return "";
  }

  const lines = [
    `Your current resource usage exceeds the ${targetPlan} plan limits:`,
    "",
    ...result.summary,
    "",
    "Please archive the excess resources before purchasing this plan.",
  ];

  return lines.join("\n");
}
