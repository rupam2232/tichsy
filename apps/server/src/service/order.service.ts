import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import type { Restaurant as RestaurantType } from "../models/restaurant.model.js";
import { env } from "../env.js";
import { isSubscriptionExpired } from "../config/subscriptionPlans.js";

const isProduction = env.NODE_ENV === "production";

export const canRestaurantRecieveOrders = async (
  restaurant: RestaurantType
) => {
  if (!isProduction) return;

  const subscription = await Subscription.findOne({
    userId: restaurant.ownerId,
  });

  if (!subscription) {
    restaurant.isCurrentlyOpen = false;
    await restaurant.save({ validateBeforeSave: false, session: null });
    throw new ApiError(
      403,
      "This restaurant does not have a subscription. Please contact the restaurant owner."
    );
  }

  // Starter plan is always active - no expiration check needed
  if (subscription.plan === "starter") {
    return;
  }

  // Check expiration for paid plans only (medium/pro)
  // Grace period is applied - user gets extra days after subscriptionEndDate
  if (isSubscriptionExpired(subscription.subscriptionEndDate)) {
    restaurant.isCurrentlyOpen = false;
    await restaurant.save({ validateBeforeSave: false, session: null });
    // Downgrade to starter
    subscription.isSubscriptionActive = true;
    subscription.plan = "starter";
    subscription.period = undefined;
    subscription.subscriptionStartDate = undefined;
    subscription.subscriptionEndDate = undefined;
    await subscription.save({ validateBeforeSave: false, session: null });
    throw new ApiError(
      403,
      "This restaurant's subscription has expired. The owner has been downgraded to the Starter plan."
    );
  }

  // Edge case: no plan set - set to starter
  if (!subscription.plan) {
    subscription.isSubscriptionActive = true;
    subscription.plan = "starter";
    subscription.period = undefined;
    subscription.subscriptionStartDate = undefined;
    subscription.subscriptionEndDate = undefined;
    await subscription.save({ validateBeforeSave: false, session: null });
    return;
  }

  if (!subscription.isSubscriptionActive) {
    restaurant.isCurrentlyOpen = false;
    await restaurant.save({ validateBeforeSave: false, session: null });
    throw new ApiError(
      403,
      "This restaurant's subscription is not active. Please contact the restaurant owner."
    );
  }
};
