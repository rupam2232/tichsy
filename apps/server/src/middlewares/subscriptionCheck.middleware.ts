import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { env } from "../env.js";
import { isSubscriptionExpired } from "../config/subscriptionPlans.js";
const isProduction = env.NODE_ENV === "production";

/**
 * Middleware to check if the user has an active subscription.
 * If not, it throws an error with a message indicating the need to subscribe.
 */

export const isSubscriptionActive = asyncHandler(async (req, _, next) => {
  if (!isProduction) return next();
  const targetUserId = req.restaurant ? req.restaurant.ownerId : req.user!._id;
  const subscription = await Subscription.findOne({ userId: targetUserId });

  if (!subscription) {
    throw new ApiError(
      403,
      "No subscription found. Please contact support."
    );
  }

  // Starter plan is always active - no expiration check needed
  if (subscription.plan === "starter") {
    subscription.isSubscriptionActive = true;
    req.subscription = subscription;
    return next();
  }

  // Check expiration for paid plans only (medium/pro)
  // Grace period is applied - user gets extra days after subscriptionEndDate
  if (isSubscriptionExpired(subscription.subscriptionEndDate)) {
    // Downgrade to starter instead of disabling
    subscription.isSubscriptionActive = true;
    subscription.plan = "starter";
    subscription.period = undefined;
    subscription.subscriptionStartDate = undefined;
    subscription.subscriptionEndDate = undefined;
    await subscription.save({ validateBeforeSave: false });
    throw new ApiError(
      403,
      "Your subscription has expired. You've been downgraded to the Starter plan. Upgrade to restore full access."
    );
  }

  // Edge case: no plan set - set to starter
  if (!subscription.plan) {
    subscription.isSubscriptionActive = true;
    subscription.plan = "starter";
    subscription.period = undefined;
    subscription.subscriptionStartDate = undefined;
    subscription.subscriptionEndDate = undefined;
    await subscription.save({ validateBeforeSave: false });
    req.subscription = subscription;
    return next();
  }

  if (!subscription.isSubscriptionActive) {
    throw new ApiError(
      403,
      "Your subscription is not active. Please contact support."
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
  const targetUserId = req.restaurant ? req.restaurant.ownerId : req.user!._id;
  const subscription = await Subscription.findOne({ userId: targetUserId }).lean();
  req.subscription = subscription;
  return next();
});
