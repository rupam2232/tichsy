import { Subscription } from "../models/subscription.model.js";
import { Restaurant } from "../models/restaurant.model.js";
import { Table } from "../models/table.model.js";
import { FoodItem } from "../models/foodItem.model.js";
import { GRACE_PERIOD_DAYS, SUBSCRIPTION_PLANS } from "../config/subscriptionPlans.js";
import { Types } from "mongoose";
import { subDays } from "date-fns";

/**
 * Checks if a user is currently in grace period.
 * Grace period = subscription expired but within GRACE_PERIOD_DAYS.
 * During grace period:
 * - User can still use starter plan features (free forever)
 * - User can archive/remove resources (for cleanup)
 * - User CANNOT create resources that would exceed starter plan limits
 */
export async function isUserInGracePeriod(
  userId: string | Types.ObjectId
): Promise<boolean> {
  const subscription = await Subscription.findOne({
    userId: userId,
    isSubscriptionActive: true,
  })
    .select("plan subscriptionEndDate")
    .lean();

  // No subscription or starter plan (never expires) = not in grace period
  if (!subscription || subscription.plan === "starter") {
    return false;
  }

  // No end date = not in grace period
  if (!subscription.subscriptionEndDate) {
    return false;
  }

  const now = new Date();
  const endDate = new Date(subscription.subscriptionEndDate);
  const graceEndDate = subDays(endDate, -GRACE_PERIOD_DAYS); // Add grace period days

  // In grace period if: subscription expired AND within grace period
  const isExpired = endDate < now;
  const isWithinGracePeriod = now <= graceEndDate;

  return isExpired && isWithinGracePeriod;
}

/**
 * Blocks resource creation only if it would exceed starter plan limits during grace period.
 * Users in grace period can still use starter plan features since it's free forever.
 */
export async function blockIfExceedsStarterLimitsInGracePeriod(
  userId: string | Types.ObjectId,
  resourceType: 'restaurant' | 'table' | 'foodItem' | 'category' | 'staff',
  restaurantId?: string | Types.ObjectId
): Promise<void> {
  const inGracePeriod = await isUserInGracePeriod(userId);

  if (!inGracePeriod) {
    return; // Not in grace period, allow all actions
  }

  const starterLimits = SUBSCRIPTION_PLANS.starter;

  switch (resourceType) {
    case 'restaurant': {
      const currentCount = await Restaurant.countDocuments({
        ownerId: userId,
        isArchived: { $ne: true },
      });

      if (currentCount >= starterLimits.maxRestaurants) {
        throw new Error(
          `Your subscription has expired. Starter plan allows ${starterLimits.maxRestaurants} restaurant(s) only. Please renew your subscription to create more restaurants.`
        );
      }
      break;
    }

    case 'table': {
      if (!restaurantId) throw new Error('Restaurant ID required for table creation');

      const currentCount = await Table.countDocuments({
        restaurantId: restaurantId,
        isArchived: { $ne: true },
      });

      if (currentCount >= starterLimits.maxTablesPerRestaurant) {
        throw new Error(
          `Your subscription has expired. Starter plan allows ${starterLimits.maxTablesPerRestaurant} table(s) per restaurant only. Please renew your subscription to create more tables.`
        );
      }
      break;
    }

    case 'foodItem': {
      if (!restaurantId) throw new Error('Restaurant ID required for food item creation');

      const currentCount = await FoodItem.countDocuments({
        restaurantId: restaurantId,
        isArchived: { $ne: true },
      });

      if (currentCount >= starterLimits.maxFoodItemsPerRestaurant) {
        throw new Error(
          `Your subscription has expired. Starter plan allows ${starterLimits.maxFoodItemsPerRestaurant} food item(s) per restaurant only. Please renew your subscription to create more food items.`
        );
      }
      break;
    }

    case 'category': {
      if (!restaurantId) throw new Error('Restaurant ID required for category creation');

      const restaurant = await Restaurant.findById(restaurantId).select('categories').lean();
      const currentCount = restaurant?.categories?.length || 0;

      if (currentCount >= starterLimits.maxCategoriesPerRestaurant) {
        throw new Error(
          `Your subscription has expired. Starter plan allows ${starterLimits.maxCategoriesPerRestaurant} categor${starterLimits.maxCategoriesPerRestaurant === 1 ? 'y' : 'ies'} per restaurant only. Please renew your subscription to add more categories.`
        );
      }
      break;
    }

    case 'staff': {
      // Starter plan allows 0 staff, so always block staff creation in grace period
      throw new Error(
        "Your subscription has expired. Starter plan does not include staff management. Please renew your subscription to manage staff."
      );
    }

    default:
      throw new Error('Invalid resource type');
  }
}
