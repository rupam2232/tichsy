import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import {
  Subscription,
  type Subscription as SubscriptionType,
} from "../models/subscription.model.js";
import {
  Restaurant,
  type Restaurant as RestaurantType,
} from "../models/restaurant.models.js";
import {
  SUBSCRIPTION_PLANS,
  type SubscriptionPlan,
} from "../config/subscriptionPlans.js";

export async function canCreateRestaurant(
  user: User,
  subscription: SubscriptionType
) {
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

export async function canToggleOpeningStatus(
  restaurant: RestaurantType
) {
  const subscription = await Subscription.findOne({
    userId: restaurant.ownerId,
  });

  if (!subscription || subscription.isSubscriptionActive === false) {
    restaurant.isCurrentlyOpen = false;
    restaurant.save({ validateBeforeSave: false });
    throw new ApiError(
      403,
      "The owner of this restaurant does not have an active subscription. Please renew the subscription to toggle the opening status"
    );
  }

  if (
    subscription.subscriptionEndDate &&
    subscription.subscriptionEndDate < new Date()
  ) {
    restaurant.isCurrentlyOpen = false;
    restaurant.save({ validateBeforeSave: false });
    subscription.isSubscriptionActive = false;
    subscription.isTrial = false;
    subscription.plan = undefined;
    subscription.subscriptionStartDate = undefined;
    subscription.subscriptionEndDate = undefined;
    subscription.save({ validateBeforeSave: false });
    throw new ApiError(
      403,
      "Your subscription has expired. Please renew the subscription to toggle the opening status"
    );
  }
  if (
    subscription.isTrial &&
    subscription.trialExpiresAt &&
    subscription.trialExpiresAt < new Date()
  ) {
    restaurant.isCurrentlyOpen = false;
    restaurant.save({ validateBeforeSave: false });
    subscription.isSubscriptionActive = false;
    subscription.isTrial = false;
    subscription.plan = undefined;
    subscription.subscriptionStartDate = undefined;
    subscription.subscriptionEndDate = undefined;
    subscription.save({ validateBeforeSave: false });
    throw new ApiError(
      403,
      "Your trial period has expired. Please subscribe to continue using the service"
    );
  }
  if (
    !subscription.trialExpiresAt &&
    !subscription.subscriptionEndDate
  ) {
    restaurant.isCurrentlyOpen = false;
    restaurant.save({ validateBeforeSave: false });
    subscription.isSubscriptionActive = false;
    subscription.isTrial = false;
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

export async function canAddCategory(
  restaurant: RestaurantType,
  subscription: SubscriptionType
) {
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
