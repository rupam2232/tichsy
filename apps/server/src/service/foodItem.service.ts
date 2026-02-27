import { ApiError } from "../utils/ApiError.js";
import { FoodItem } from "../models/foodItem.model.js";
import type { Subscription as SubscriptionType } from "../models/subscription.model.js";
import {
  SUBSCRIPTION_PLANS,
  SubscriptionPlan,
} from "../config/subscriptionPlans.js";
import { env } from "../env.js";

const isProduction = env.NODE_ENV === "production";

export async function canCreateFoodItem(
  subscription: SubscriptionType,
  restaurantId: string
) {
  if (!isProduction) return;
  const foodItemCount = await FoodItem.countDocuments({ restaurantId });

  const plan =
    (subscription?.plan as SubscriptionPlan) || ("starter" as SubscriptionPlan);

  const maxFoodItems = SUBSCRIPTION_PLANS[plan].maxFoodItemsPerRestaurant;

  if (foodItemCount >= maxFoodItems) {
    throw new ApiError(
      403,
      `Your plan allows to create max ${maxFoodItems} food items per restaurant. Upgrade to create more.`
    );
  }
}

export async function checkVariantLimit(
  variantCount: number,
  subscription: SubscriptionType
) {
  if (!isProduction) return;
  if (variantCount <= 0) return;

  const plan =
    (subscription?.plan as SubscriptionPlan) || ("starter" as SubscriptionPlan);

  const maxVariants = SUBSCRIPTION_PLANS[plan].maxVariantsPerFoodItem;

  if (variantCount > maxVariants) {
    throw new ApiError(
      403,
      `Your plan allows to create max ${maxVariants} variants per food item. Upgrade to create more.`
    );
  }
}

export async function canUnarchiveFoodItem(
  restaurantId: string,
  subscription?: SubscriptionType | null,
) {
  if (!isProduction) return;
  if (!subscription || !subscription.isSubscriptionActive) {
    throw new ApiError(
      403,
      "No active subscription found. Please subscribe to a plan to unarchive this food item"
    );
  }
  const activeFoodItemCount = await FoodItem.countDocuments({
    restaurantId,
    isArchived: false,
  });

  const plan =
    (subscription?.plan as SubscriptionPlan) || ("starter" as SubscriptionPlan);

  const maxFoodItems = SUBSCRIPTION_PLANS[plan].maxFoodItemsPerRestaurant;

  if (activeFoodItemCount >= maxFoodItems) {
    throw new ApiError(
      403,
      `Your plan allows max ${maxFoodItems} active food items per restaurant. Upgrade your plan or archive another food item to unarchive this one`
    );
  }
}
