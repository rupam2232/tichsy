import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import {
  Subscription,
  type Subscription as SubscriptionType,
} from "../models/subscription.model.js";
import {
  Restaurant,
  type Restaurant as RestaurantType,
} from "../models/restaurant.model.js";
import {
  SUBSCRIPTION_PLANS,
  type SubscriptionPlan,
  isSubscriptionExpired,
} from "../config/subscriptionPlans.js";
import { env } from "../env.js";
import { checkRestaurantComplianceForPlan } from "./resourceLimits.service.js";
import { RestaurantMember } from "../models/restaurantMember.model.js";
import { Invitation } from "../models/invitation.model.js";
const isProduction = env.NODE_ENV === "production";

export async function canCreateRestaurant(
  user: User,
  subscription: SubscriptionType
) {
  if (!isProduction) return;
  const restaurantCount = await Restaurant.countDocuments({
    ownerId: user._id,
  });

  const plan = (subscription.plan as SubscriptionPlan) || "starter";
  const maxRestaurants = SUBSCRIPTION_PLANS[plan].maxRestaurants;

  if (restaurantCount >= maxRestaurants) {
    throw new ApiError(
      403,
      `Your plan allows to create max ${maxRestaurants} restaurants. Upgrade your plan to create more`
    );
  }
}

export async function canToggleOpeningStatus(restaurant: RestaurantType) {
  if (!isProduction) return;
  const subscription = await Subscription.findOne({
    userId: restaurant.ownerId,
  });

  if (!subscription) {
    restaurant.isCurrentlyOpen = false;
    restaurant.save({ validateBeforeSave: false });
    throw new ApiError(
      403,
      "No subscription found. Please contact support."
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
    restaurant.save({ validateBeforeSave: false });
    // Downgrade to starter
    subscription.isSubscriptionActive = true;
    subscription.plan = "starter";
    subscription.period = undefined;
    subscription.subscriptionStartDate = undefined;
    subscription.subscriptionEndDate = undefined;
    subscription.save({ validateBeforeSave: false });
    throw new ApiError(
      403,
      "Your subscription has expired. You've been downgraded to the Starter plan."
    );
  }

  // Edge case: no plan set - set to starter
  if (!subscription.plan) {
    subscription.isSubscriptionActive = true;
    subscription.plan = "starter";
    subscription.period = undefined;
    subscription.subscriptionStartDate = undefined;
    subscription.subscriptionEndDate = undefined;
    subscription.save({ validateBeforeSave: false });
    return;
  }

  if (!subscription.isSubscriptionActive) {
    restaurant.isCurrentlyOpen = false;
    restaurant.save({ validateBeforeSave: false });
    throw new ApiError(
      403,
      "Your subscription is not active. Please contact support."
    );
  }
}

export async function canAddCategory(
  restaurant: RestaurantType,
  subscription: SubscriptionType
) {
  if (!isProduction) return;
  const categoryCount = restaurant.categories.length;

  const plan = (subscription.plan as SubscriptionPlan) || "starter";
  const maxCategories = SUBSCRIPTION_PLANS[plan].maxCategoriesPerRestaurant;

  if (categoryCount >= maxCategories) {
    throw new ApiError(
      403,
      `Your plan allows to add max ${maxCategories} categories`
    );
  }
}

export async function canUnarchiveRestaurant(
  user: User,
  subscription: SubscriptionType,
  restaurant: RestaurantType
) {
  if (!isProduction) return;
  const activeRestaurantCount = await Restaurant.countDocuments({
    ownerId: user._id,
    isArchived: false,
  });

  const plan = (subscription.plan as SubscriptionPlan) || "starter";
  const maxRestaurants = SUBSCRIPTION_PLANS[plan].maxRestaurants;

  if (activeRestaurantCount >= maxRestaurants) {
    throw new ApiError(
      403,
      `Your plan allows max ${maxRestaurants} active restaurants. Upgrade your plan or archive another restaurant to unarchive this restaurant`
    );
  }

  const compliance = await checkRestaurantComplianceForPlan(
    restaurant._id,
    plan
  );

  if (!compliance.isWithinLimits) {
    throw new ApiError(
      403,
      `Cannot unarchive restaurant. This restaurant exceeds your ${plan} plan limits.`,
      compliance.summary
    );
  }
}

export async function canUnarchiveStaff(
  subscription: SubscriptionType,
  restaurant: RestaurantType
) {
  if (!isProduction) return;
  const activeStaffCount = await RestaurantMember.countDocuments({
    restaurantId: restaurant._id,
    isArchived: false,
  });

  const plan = (subscription.plan as SubscriptionPlan) || "starter";
  const maxStaff = SUBSCRIPTION_PLANS[plan].maxStaffPerRestaurant;

  if (activeStaffCount >= maxStaff) {
    throw new ApiError(
      403,
      `Your plan allows max ${maxStaff} active staff`
    );
  }
}

export async function checkStaffLimit(
  restaurant: RestaurantType,
  userId: User["_id"],
  isInvitee: boolean = false
) {
  if (!isProduction) return;

  // Count active (non-archived) staff members from RestaurantMember collection
  const activeStaffCount = await RestaurantMember.countDocuments({
    restaurantId: restaurant._id,
    isArchived: false,
  });

  const pendingInvitesCount = await Invitation.countDocuments({
    restaurantId: restaurant._id,
    status: "pending",
  });

  const staffCount = activeStaffCount + pendingInvitesCount;

  const subscription = await Subscription.findOne({ userId: userId }).lean();
  const plan =
    (subscription?.plan as SubscriptionPlan) || ("starter" as SubscriptionPlan);

  const maxStaff = SUBSCRIPTION_PLANS[plan].maxStaffPerRestaurant;

  if (staffCount >= maxStaff) {
    if (isInvitee) {
      throw new ApiError(
        403,
        "This restaurant has reached its maximum staff limit and cannot accept new members at this time"
      );
    } else {
      throw new ApiError(
        403,
        `Your plan allows to add max ${maxStaff} staff members per restaurant`
      );
    }
  }
}
