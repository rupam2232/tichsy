import { ApiError } from "../utils/ApiError.js";
import { FoodItem } from "../models/foodItem.model.js";
import type { Subscription as SubscriptionType } from "../models/subscription.model.js";
import {
  SUBSCRIPTION_PLANS,
  SubscriptionPlan,
} from "../config/subscriptionPlans.js";

export async function canCreateFoodItem(
  subscription: SubscriptionType,
  restaurantId: string
) {
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
