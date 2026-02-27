import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { env } from "../env.js";
const isProduction = env.NODE_ENV === "production";

/**
 * Middleware to check if the user has an active subscription.
 * If not, it throws an error with a message indicating the need to subscribe.
 */

export const isSubscriptionActive = asyncHandler(async (req, _, next) => {
  if (!isProduction) return next();
  const subscription = await Subscription.findOne({ userId: req.user!._id });
  if (!subscription || subscription.isSubscriptionActive === false)
    throw new ApiError(
      403,
      "No active subscription found. Please subscribe to continue using the service"
    );
  if (
    subscription.subscriptionEndDate &&
    subscription.subscriptionEndDate < new Date()
  ) {
    subscription.isSubscriptionActive = false;
    subscription.isTrial = false;
    subscription.trialExpiresAt = undefined;
    subscription.plan = undefined;
    subscription.subscriptionStartDate = undefined;
    subscription.subscriptionEndDate = undefined;
    subscription.save({ validateBeforeSave: false });
    throw new ApiError(
      403,
      "Your subscription has expired. Please renew to continue using the service"
    );
  }
  if (subscription.isTrial && !subscription.trialExpiresAt) {
    if (
      subscription.subscriptionEndDate &&
      subscription.subscriptionEndDate > new Date()
    ) {
      subscription.isTrial = false;
      subscription.save({ validateBeforeSave: false });
    } else {
      subscription.isTrial = false;
      subscription.isSubscriptionActive = false;
      subscription.plan = undefined;
      subscription.subscriptionStartDate = undefined;
      subscription.subscriptionEndDate = undefined;
      subscription.save({ validateBeforeSave: false });
      throw new ApiError(
        403,
        "Your subscription is not active. Please subscribe to continue using the service"
      );
    }
  }
  if (
    subscription.isTrial &&
    subscription.trialExpiresAt &&
    subscription.trialExpiresAt < new Date()
  ) {
    subscription.isSubscriptionActive = false;
    subscription.isTrial = false;
    subscription.trialExpiresAt = undefined;
    subscription.plan = undefined;
    subscription.subscriptionStartDate = undefined;
    subscription.subscriptionEndDate = undefined;
    subscription.save({ validateBeforeSave: false });
    throw new ApiError(
      403,
      "Your trial period has expired. Please subscribe to continue using the service"
    );
  }
  if (!subscription.trialExpiresAt && !subscription.subscriptionEndDate) {
    subscription.isSubscriptionActive = false;
    subscription.plan = undefined;
    subscription.subscriptionStartDate = undefined;
    subscription.subscriptionEndDate = undefined;
    subscription.save({ validateBeforeSave: false });
    throw new ApiError(
      403,
      "Your subscription is not active. Please subscribe to continue using the service"
    );
  }
  req.subscription = subscription;
  next();
});

/**
 * Middleware to check if the user has an active subscription.
 * If not, it throws an error with a message indicating the need to subscribe.
 */
export const optionalSubscriptionActive = asyncHandler(async (req, _, next) => {
  if (!isProduction) return next();
  const subscription = await Subscription.findOne({ userId: req.user!._id });
  req.subscription = subscription;
  return next();
});
