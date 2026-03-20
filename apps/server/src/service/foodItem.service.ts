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

export function getMaxImagesPerFoodItem(subscription: SubscriptionType | null | undefined): number {
  const plan = (subscription?.plan as SubscriptionPlan) || "starter";
  return SUBSCRIPTION_PLANS[plan].maxImagesPerFoodItem;
}

export function checkImageLimit(
  currentImageCount: number,
  newImageCount: number,
  subscription: SubscriptionType | null | undefined
) {
  if (!isProduction) return;

  const plan = (subscription?.plan as SubscriptionPlan) || "starter";
  const maxImages = SUBSCRIPTION_PLANS[plan].maxImagesPerFoodItem;
  const totalImages = currentImageCount + newImageCount;

  if (newImageCount > maxImages) {
    throw new ApiError(
      400,
      `Your plan allows uploading max ${maxImages} images at once. Upgrade to upload more.`
    );
  }

  if (currentImageCount >= maxImages) {
    throw new ApiError(
      400,
      `Your plan allows max ${maxImages} images per food item. Upgrade to add more.`
    );
  }

  if (totalImages > maxImages) {
    throw new ApiError(
      400,
      `Total images cannot exceed ${maxImages} for your plan. You have ${currentImageCount} image(s), trying to add ${newImageCount}.`
    );
  }
}

export async function canUnarchiveFoodItem(
  restaurantId: string,
  foodItemId: string,
  subscription?: SubscriptionType | null,
) {
  if (!isProduction) return;
  if (!subscription || !subscription.isSubscriptionActive) {
    throw new ApiError(
      403,
      "No active subscription found. Please subscribe to a plan to unarchive this food item"
    );
  }

  const plan =
    (subscription?.plan as SubscriptionPlan) || ("starter" as SubscriptionPlan);
  const limits = SUBSCRIPTION_PLANS[plan];

  // Check total food item count
  const activeFoodItemCount = await FoodItem.countDocuments({
    restaurantId,
    isArchived: false,
  });

  if (activeFoodItemCount >= limits.maxFoodItemsPerRestaurant) {
    throw new ApiError(
      403,
      `Your plan allows max ${limits.maxFoodItemsPerRestaurant} active food items per restaurant. Upgrade your plan or archive another food item to unarchive this one`
    );
  }

  // Check if food item has excess images or variants
  const foodItem = await FoodItem.findById(foodItemId);
  if (!foodItem) {
    throw new ApiError(404, "Food item not found");
  }

  const imageCount = foodItem.imageUrls?.length || 0;
  const variantCount = foodItem.variants?.length || 0;

  if (imageCount > limits.maxImagesPerFoodItem) {
    throw new ApiError(
      403,
      `This food item has ${imageCount} images but your plan allows max ${limits.maxImagesPerFoodItem}. Remove ${imageCount - limits.maxImagesPerFoodItem} image(s) to unarchive.`
    );
  }

  if (variantCount > limits.maxVariantsPerFoodItem) {
    throw new ApiError(
      403,
      `This food item has ${variantCount} variants but your plan allows max ${limits.maxVariantsPerFoodItem}. Remove ${variantCount - limits.maxVariantsPerFoodItem} variant(s) to unarchive.`
    );
  }
}
