import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import type { Restaurant as RestaurantType } from "../models/restaurant.models.js";
const isProduction = process.env?.NODE_ENV === "production";

export const canRestaurantRecieveOrders = async (
  restaurant: RestaurantType
) => {
  if (!isProduction) return;

  const subscription = await Subscription.findOne({
    userId: restaurant.ownerId,
  });

  if (!subscription || subscription.isSubscriptionActive === false) {
    restaurant.isCurrentlyOpen = false;
    await restaurant.save({ validateBeforeSave: false, session: null });
    throw new ApiError(
      403,
      "This restaurant does not have an active subscription. we cannot process your order at this time. Please contact the restaurant owner for more information"
    );
  }

  if (
    subscription.subscriptionEndDate &&
    subscription.subscriptionEndDate < new Date()
  ) {
    restaurant.isCurrentlyOpen = false;
    await restaurant.save({ validateBeforeSave: false, session: null });
    subscription.isSubscriptionActive = false;
    subscription.plan = undefined;
    subscription.trialExpiresAt = undefined;
    subscription.subscriptionEndDate = undefined;
    subscription.subscriptionStartDate = undefined;
    subscription.isTrial = false;
    await subscription.save({ validateBeforeSave: false, session: null });
    throw new ApiError(
      403,
      "This restaurant's subscription has expired. Please contact the restaurant owner to renew the subscription"
    );
  }
  if (
    subscription.isTrial &&
    subscription.trialExpiresAt &&
    subscription.trialExpiresAt < new Date()
  ) {
    restaurant.isCurrentlyOpen = false;
    await restaurant.save({ validateBeforeSave: false, session: null });
    subscription.isSubscriptionActive = false;
    subscription.plan = undefined;
    subscription.trialExpiresAt = undefined;
    subscription.subscriptionEndDate = undefined;
    subscription.subscriptionStartDate = undefined;
    subscription.isTrial = false;
    await subscription.save({ validateBeforeSave: false, session: null });
    throw new ApiError(
      403,
      "This restaurant's trial period has expired. Please contact the restaurant owner to subscribe"
    );
  }
  if (!subscription.trialExpiresAt && !subscription.subscriptionEndDate) {
    restaurant.isCurrentlyOpen = false;
    await restaurant.save({ validateBeforeSave: false, session: null });
    subscription.isSubscriptionActive = false;
    subscription.plan = undefined;
    subscription.trialExpiresAt = undefined;
    subscription.subscriptionEndDate = undefined;
    subscription.subscriptionStartDate = undefined;
    subscription.isTrial = false;
    await subscription.save({ validateBeforeSave: false, session: null });
    throw new ApiError(
      403,
      "This restaurant's subscription is not active. Please contact the restaurant owner to subscribe"
    );
  }
};
